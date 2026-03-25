#pragma once
#include "ViolinVoice.h" // for InstrudioSound
#include <vector>

class HarpVoice : public juce::SynthesiserVoice
{
public:
    bool canPlaySound(juce::SynthesiserSound* s) override { return dynamic_cast<InstrudioSound*>(s) != nullptr; }

    void startNote(int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        double sr = getSampleRate();
        freq = juce::MidiMessage::getMidiNoteInHertz(midiNote);
        level = velocity;
        releasing = false;

        // Karplus-Strong: init delay line with noise burst
        int delayLen = (int)(sr / freq);
        if (delayLen < 2) delayLen = 2;
        delayLine.resize(delayLen);
        for (int i = 0; i < delayLen; ++i)
            delayLine[i] = (float)((double)rand() / RAND_MAX * 2.0 - 1.0) * velocity;
        delayIdx = 0;
        prevSample = 0.0f;

        // Per-note decay: lower notes ring longer
        feedback = 0.994f + (midiNote - 24) * 0.00004f;
        feedback = juce::jlimit(0.990f, 0.999f, feedback);

        pluckGain = 1.0f;
    }

    void stopNote(float, bool allowTailOff) override
    {
        if (allowTailOff) { releasing = true; }
        else { clearCurrentNote(); pluckGain = 0.0f; }
    }

    void pitchWheelMoved(int) override {}
    void controllerMoved(int cc, int value) override
    {
        if (cc == 7) masterVol = value / 127.0f;
        else if (cc == 91) reverbMix = value / 127.0f;
        else if (cc == 74) damping = value / 127.0f;
    }

    void renderNextBlock(juce::AudioBuffer<float>& buffer, int startSample, int numSamples) override
    {
        if (pluckGain < 0.0001f && releasing) { clearCurrentNote(); return; }
        if (delayLine.empty()) return;

        int len = (int)delayLine.size();

        for (int i = startSample; i < startSample + numSamples; ++i)
        {
            // KS: read from delay line, average with previous (lowpass)
            float current = delayLine[delayIdx];
            float filtered = (current + prevSample) * 0.5f * feedback;

            // Extra damping control
            filtered = filtered * (1.0f - damping * 0.3f);

            prevSample = current;
            delayLine[delayIdx] = filtered;
            delayIdx = (delayIdx + 1) % len;

            if (releasing) pluckGain *= 0.9996f;

            float out = current * pluckGain * masterVol * 0.5f;
            buffer.addSample(0, i, out);
            buffer.addSample(1, i, out);
        }
    }

    float masterVol = 0.75f, reverbMix = 0.45f, damping = 0.3f;

private:
    std::vector<float> delayLine;
    int delayIdx = 0;
    float prevSample = 0.0f, feedback = 0.996f, pluckGain = 0.0f;
    double freq = 440.0;
    float level = 0.0f;
    bool releasing = false;
};
