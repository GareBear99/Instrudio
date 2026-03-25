#pragma once
#include "ViolinVoice.h" // for InstrudioSound

class BongoVoice : public juce::SynthesiserVoice
{
public:
    bool canPlaySound(juce::SynthesiserSound* s) override { return dynamic_cast<InstrudioSound*>(s) != nullptr; }

    void startNote(int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        // Map MIDI to drum: lower half = low drum, upper = high drum
        bool isHigh = midiNote >= 60;
        double baseFreq = isHigh ? 214.5 : 156.8;
        level = velocity;
        time = 0.0;
        active = true;

        // Bessel function modal ratios for circular membrane
        static const double ratios[] = {1.000, 1.593, 2.136, 2.296, 2.653, 2.917};
        static const double decayMul[] = {1.0, 0.55, 0.35, 0.28, 0.18, 0.12};
        // Mode amplitudes: center hit emphasizes lower modes
        static const double ampsCenter[] = {1.0, 0.4, 0.25, 0.12, 0.06, 0.03};

        double baseDecay = isHigh ? 0.68 : 0.82;

        for (int m = 0; m < NUM_MODES; ++m)
        {
            modes[m].freq = baseFreq * ratios[m];
            modes[m].phase = 0.0;
            modes[m].amp = ampsCenter[m] * velocity;
            modes[m].decay = baseDecay * decayMul[m];
        }

        noiseTime = 0.0;
        noiseDur = 0.06;
    }

    void stopNote(float, bool) override { clearCurrentNote(); active = false; }
    void pitchWheelMoved(int) override {}
    void controllerMoved(int cc, int value) override
    {
        if (cc == 7) masterVol = value / 127.0f;
        else if (cc == 91) room = value / 127.0f;
        else if (cc == 74) tone = 400.0f + (value / 127.0f) * 4600.0f;
    }

    void renderNextBlock(juce::AudioBuffer<float>& buffer, int startSample, int numSamples) override
    {
        if (!active) return;
        double sr = getSampleRate();
        double dt = 1.0 / sr;

        for (int i = startSample; i < startSample + numSamples; ++i)
        {
            double sample = 0.0;

            // Sum modal oscillators with exponential decay
            for (int m = 0; m < NUM_MODES; ++m)
            {
                double env = std::exp(-time / modes[m].decay);
                sample += modes[m].amp * env * std::sin(modes[m].phase);
                modes[m].phase += 2.0 * 3.14159 * modes[m].freq / sr;
                if (modes[m].phase > 2.0 * 3.14159) modes[m].phase -= 2.0 * 3.14159;
            }

            // Head noise (bandpass-filtered)
            double noise = 0.0;
            if (noiseTime < noiseDur)
            {
                double raw = ((double)rand() / RAND_MAX * 2.0 - 1.0);
                noise = raw * level * 0.4 * (1.0 - noiseTime / noiseDur);
                noiseTime += dt;
            }

            // Tone lowpass
            double cutoff = tone;
            double rc = 1.0 / (2.0 * 3.14159 * cutoff);
            double alpha = dt / (rc + dt);
            lpState = lpState + alpha * ((sample + noise) * masterVol - lpState);

            float out = (float)(lpState * 0.45);
            buffer.addSample(0, i, out);
            buffer.addSample(1, i, out);

            time += dt;

            // Auto-stop after decay
            if (time > 2.0) { clearCurrentNote(); active = false; return; }
        }
    }

    float masterVol = 0.78f, room = 0.22f, tone = 2200.0f;

private:
    static constexpr int NUM_MODES = 6;
    struct Mode { double freq, phase, amp, decay; };
    Mode modes[6] = {};
    double time = 0.0, level = 0.0, noiseTime = 0.0, noiseDur = 0.06;
    double lpState = 0.0;
    bool active = false;
};
