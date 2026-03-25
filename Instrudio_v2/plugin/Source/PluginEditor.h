#pragma once

#include <juce_gui_extra/juce_gui_extra.h>
#include "PluginProcessor.h"

class InstrudioEditor : public juce::AudioProcessorEditor,
                         private juce::Timer
{
public:
    InstrudioEditor(InstrudioProcessor&);
    ~InstrudioEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;

    InstrudioProcessor& instrudioProcessor;
    juce::WebBrowserComponent browser;
    juce::ComboBox instrumentSelector;

    void loadCurrentInstrument();
    void onInstrumentChanged();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(InstrudioEditor)
};
