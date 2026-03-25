#include "PluginProcessor.h"
#include "PluginEditor.h"
#include "ViolinVoice.h"
#include "PianoVoice.h"
#include "HarpVoice.h"
#include "BongoVoice.h"

InstrudioProcessor::InstrudioProcessor()
    : AudioProcessor(BusesProperties()
        .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    synth.addSound(new InstrudioSound());

    juce::String id(INSTRUDIO_INSTRUMENT_ID);
    int numVoices = 8;

    // Add the correct voice type based on compile-time instrument ID
    for (int i = 0; i < numVoices; ++i)
    {
        if (id == "violin")       synth.addVoice(new ViolinVoice());
        else if (id == "piano")   synth.addVoice(new PianoVoice());
        else if (id == "harp")    synth.addVoice(new HarpVoice());
        else if (id == "bongo")   synth.addVoice(new BongoVoice());
        else                      synth.addVoice(new ViolinVoice()); // fallback
    }
}

InstrudioProcessor::~InstrudioProcessor() {}

void InstrudioProcessor::prepareToPlay(double sampleRate, int)
{
    synth.setCurrentPlaybackSampleRate(sampleRate);
}

void InstrudioProcessor::releaseResources() {}

void InstrudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    buffer.clear();

    // Track MIDI activity for UI indicator
    if (!midiMessages.isEmpty())
        midiActivity.store(true);

    // Render synth voices from incoming MIDI
    synth.renderNextBlock(buffer, midiMessages, 0, buffer.getNumSamples());
}

juce::AudioProcessorEditor* InstrudioProcessor::createEditor()
{
    return new InstrudioEditor(*this);
}

void InstrudioProcessor::getStateInformation(juce::MemoryBlock&) {}
void InstrudioProcessor::setStateInformation(const void*, int) {}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new InstrudioProcessor();
}
