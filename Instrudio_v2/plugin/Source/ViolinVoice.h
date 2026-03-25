#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
#include <cmath>

struct InstrudioSound : public juce::SynthesiserSound
{
    bool appliesToNote(int) override { return true; }
    bool appliesToChannel(int) override { return true; }
};

class ViolinVoice : public juce::SynthesiserVoice
{
public:
    bool canPlaySound(juce::SynthesiserSound* s) override { return dynamic_cast<InstrudioSound*>(s) != nullptr; }

    void startNote(int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        freq = juce::MidiMessage::getMidiNoteInHertz(midiNote);
        level = velocity;
        phase = 0.0; h2Phase = 0.0; vibratoPhase = 0.0; noisePhase = 0.0;
        envelope = 0.0; attacking = true; releasing = false;
        tailOff = 0.0;
        // Body EQ simulated via simple brightness filter
        brightness = 0.7f + (midiNote - 55) * 0.005f; // brighter for higher notes
    }

    void stopNote(float, bool allowTailOff) override
    {
        if (allowTailOff) { releasing = true; }
        else { clearCurrentNote(); envelope = 0.0; }
    }

    void pitchWheelMoved(int value) override
    {
        pitchBend = (value - 8192) / 8192.0 * 2.0; // ±2 semitones
    }
    void controllerMoved(int cc, int value) override
    {
        if (cc == 1) bowPressure = value / 127.0f;
        else if (cc == 2) bowSpeed = value / 127.0f;
        else if (cc == 74) brightness = value / 127.0f;
        else if (cc == 7) masterVol = value / 127.0f;
    }

    void renderNextBlock(juce::AudioBuffer<float>& buffer, int startSample, int numSamples) override
    {
        if (envelope <= 0.0001 && !attacking) return;

        double sr = getSampleRate();
        double dt = 1.0 / sr;

        for (int i = startSample; i < startSample + numSamples; ++i)
        {
            // Envelope
            if (attacking) { envelope += (1.0 - envelope) * 0.002; if (envelope > 0.98) attacking = false; }
            if (releasing) { envelope *= 0.9997; if (envelope < 0.001) { clearCurrentNote(); return; } }

            // Bent frequency
            double f = freq * std::pow(2.0, pitchBend / 12.0);

            // Helmholtz-like waveform: sum of harmonics with 1/n² rolloff
            double D = 0.5 + bowPressure * 0.30;
            double sample = 0.0;
            for (int n = 1; n <= 24; ++n)
            {
                double hn = f * n;
                if (hn > sr * 0.45) break;
                double amp = (2.0 / (n * n * 3.14159 * 3.14159 * D * (1.0 - D))) * std::sin(n * 3.14159 * D);
                sample += amp * std::sin(phase * n);
            }

            // H2 correction (boost 2nd harmonic)
            double h2 = 0.38 * std::sin(h2Phase);
            sample += h2 * bowPressure;

            // Vibrato
            double vibHz = f * (std::pow(2.0, vibratoDepth * 50.0 / 1200.0) - 1.0);
            double vibMod = vibHz * std::sin(vibratoPhase);

            // Bow noise texture
            double noise = ((double)rand() / RAND_MAX * 2.0 - 1.0) * 0.02 * bowPressure * bowSpeed;

            // Brightness filter (simple 1-pole lowpass)
            double cutoff = 800.0 + brightness * 8000.0;
            double rc = 1.0 / (2.0 * 3.14159 * cutoff);
            double alpha = dt / (rc + dt);
            lpState = lpState + alpha * ((sample + noise) * level * envelope * masterVol - lpState);

            float out = (float)(lpState * 0.35);

            buffer.addSample(0, i, out);
            buffer.addSample(1, i, out);

            // Advance phases
            double phaseInc = 2.0 * 3.14159 * (f + vibMod) / sr;
            phase += phaseInc;
            if (phase > 2.0 * 3.14159) phase -= 2.0 * 3.14159;
            h2Phase += 2.0 * 3.14159 * f * 2.0 / sr;
            if (h2Phase > 2.0 * 3.14159) h2Phase -= 2.0 * 3.14159;
            vibratoPhase += 2.0 * 3.14159 * vibratoRate / sr;
            if (vibratoPhase > 2.0 * 3.14159) vibratoPhase -= 2.0 * 3.14159;
        }
    }

    // Public params for UI access
    float bowPressure = 0.6f, bowSpeed = 0.55f, brightness = 0.75f, masterVol = 0.72f;
    float vibratoRate = 5.5f, vibratoDepth = 0.32f;

private:
    double freq = 440.0, phase = 0.0, h2Phase = 0.0, vibratoPhase = 0.0, noisePhase = 0.0;
    double envelope = 0.0, level = 0.0, pitchBend = 0.0;
    double lpState = 0.0;
    bool attacking = false, releasing = false;
    double tailOff = 0.0;
};
