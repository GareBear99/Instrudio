#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
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

    InstrudioProcessor& proc;

    // Theme colors (set per instrument)
    juce::Colour bgColor, accentColor, accent2Color, mutedColor, textColor;
    juce::String instrumentName, instrumentSub;

    // Knobs
    juce::Slider knob1, knob2, knob3, knob4;
    juce::Label knob1Label, knob2Label, knob3Label, knob4Label;

    // MIDI activity
    bool midiLit = false;
    int midiLitCounter = 0;

    // On-screen keyboard for standalone
    juce::MidiKeyboardState keyboardState;
    juce::MidiKeyboardComponent keyboard;

    void setupTheme();
    void setupKnobs();
    void styleKnob(juce::Slider& s, juce::Label& l, const juce::String& name);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(InstrudioEditor)
};
