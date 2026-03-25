#pragma once

#include <juce_audio_processors/juce_audio_processors.h>

class InstrudioProcessor : public juce::AudioProcessor
{
public:
    InstrudioProcessor();
    ~InstrudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    juce::String getCurrentURL() const { return currentURL; }
    void setInstrument(const juce::String& instrumentId);

    void webViewNoteOn(int note, float velocity);
    void webViewNoteOff(int note);

private:
    juce::String currentURL { INSTRUDIO_INSTRUMENT_URL };
    juce::String currentInstrument { INSTRUDIO_INSTRUMENT_ID };
    juce::MidiBuffer pendingWebMidi;
    juce::CriticalSection midiLock;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(InstrudioProcessor)
};
