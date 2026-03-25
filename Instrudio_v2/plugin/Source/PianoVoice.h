#pragma once
#include "ViolinVoice.h" // for InstrudioSound

class PianoVoice : public juce::SynthesiserVoice
{
public:
    bool canPlaySound(juce::SynthesiserSound* s) override { return dynamic_cast<InstrudioSound*>(s) != nullptr; }

    void startNote(int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        freq = juce::MidiMessage::getMidiNoteInHertz(midiNote);
        level = velocity;
        midi = midiNote;
        for (int i = 0; i < MAX_PARTIALS; ++i) phases[i] = 0.0;
        envelope = 0.0; attacking = true; releasing = false;
        hammerTime = 0.0; hammerActive = true;
        // Stereo pan: low notes left, high right
        pan = juce::jlimit(-0.6f, 0.6f, (midiNote - 60) / 50.0f);
        // Inharmonicity B constant by register
        if (midiNote < 36) B = 0.00008; else if (midiNote < 48) B = 0.00014;
        else if (midiNote < 60) B = 0.00025; else if (midiNote < 72) B = 0.00045;
        else if (midiNote < 84) B = 0.00080; else B = 0.00140;
    }

    void stopNote(float, bool allowTailOff) override
    {
        if (allowTailOff && !sustainPedal) { releasing = true; }
        else if (!allowTailOff) { clearCurrentNote(); envelope = 0.0; }
    }

    void pitchWheelMoved(int) override {}
    void controllerMoved(int cc, int value) override
    {
        if (cc == 64) sustainPedal = value >= 64;
        else if (cc == 7) masterVol = value / 127.0f;
        else if (cc == 91) reverb = value / 127.0f;
        else if (cc == 74) bright = 500.0f + (value / 127.0f) * 7500.0f;
    }

    void renderNextBlock(juce::AudioBuffer<float>& buffer, int startSample, int numSamples) override
    {
        if (envelope <= 0.0001 && !attacking) return;
        double sr = getSampleRate();
        double dt = 1.0 / sr;
        bool isLow = midi < 48, isMid = midi >= 48 && midi < 72;
        double decayRate = isLow ? 0.99998 : isMid ? 0.99995 : 0.9999;
        double atkRate = 0.01;

        // Harmonic amplitudes (grand piano profile)
        static const double amps[] = {1.0, 0.65, 0.24, 0.13, 0.08, 0.05, 0.03, 0.015};

        for (int i = startSample; i < startSample + numSamples; ++i)
        {
            if (attacking) { envelope += (1.0 - envelope) * atkRate; if (envelope > 0.95) attacking = false; }
            if (releasing) { envelope *= 0.9994; if (envelope < 0.001) { clearCurrentNote(); return; } }
            else { envelope *= decayRate; }

            double sample = 0.0;
            for (int n = 0; n < MAX_PARTIALS; ++n)
            {
                double harmN = (double)(n + 1);
                double stretchedHz = freq * harmN * std::sqrt(1.0 + B * harmN * harmN);
                if (stretchedHz > sr * 0.45) break;
                double amp = (n < 8) ? amps[n] : 0.01 / (n + 1);
                sample += amp * std::sin(phases[n]);
                phases[n] += 2.0 * 3.14159 * stretchedHz / sr;
                if (phases[n] > 2.0 * 3.14159) phases[n] -= 2.0 * 3.14159;
            }

            // Hammer transient (25ms noise burst)
            double hammer = 0.0;
            if (hammerActive)
            {
                hammer = ((double)rand() / RAND_MAX * 2.0 - 1.0) * level * 0.3 * (1.0 - hammerTime / 0.025);
                hammerTime += dt;
                if (hammerTime > 0.025) hammerActive = false;
            }

            // Brightness lowpass
            double cutoff = bright;
            double rc = 1.0 / (2.0 * 3.14159 * cutoff);
            double alpha = dt / (rc + dt);
            lpState = lpState + alpha * ((sample + hammer) * level * envelope * masterVol - lpState);

            float out = (float)(lpState * 0.38);
            float outL = out * (0.5f - pan * 0.5f);
            float outR = out * (0.5f + pan * 0.5f);
            buffer.addSample(0, i, outL);
            buffer.addSample(1, i, outR);
        }
    }

    float masterVol = 0.7f, reverb = 0.35f, bright = 3000.0f;
    bool sustainPedal = false;

private:
    static constexpr int MAX_PARTIALS = 16;
    double freq = 440.0, phases[16] = {}, envelope = 0.0, level = 0.0;
    double B = 0.00025, lpState = 0.0, hammerTime = 0.0;
    float pan = 0.0f;
    int midi = 60;
    bool attacking = false, releasing = false, hammerActive = false;
};
