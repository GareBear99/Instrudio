#include "PluginEditor.h"

InstrudioEditor::InstrudioEditor(InstrudioProcessor& p)
    : AudioProcessorEditor(&p), proc(p),
      keyboard(keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard)
{
    setupTheme();
    setupKnobs();

    // Keyboard
    keyboard.setAvailableRange(36, 96);
    keyboard.setKeyWidth(22.0f);
    addAndMakeVisible(keyboard);

    // Keyboard state will be polled in the processor

    setSize(620, 440);
    setResizable(true, true);
    setResizeLimits(500, 360, 1200, 800);

    startTimerHz(30);
}

InstrudioEditor::~InstrudioEditor()
{
    stopTimer();
}

void InstrudioEditor::setupTheme()
{
    juce::String id = proc.getInstrumentId();

    if (id == "violin")
    {
        bgColor = juce::Colour(0xff120b04);
        accentColor = juce::Colour(0xffc87830);
        accent2Color = juce::Colour(0xffe8a050);
        mutedColor = juce::Colour(0xff806040);
        textColor = juce::Colour(0xfff0e0c0);
        instrumentName = "Studio Violin";
        instrumentSub = "Helmholtz · H2 Correction · Sympathetic Resonance";
    }
    else if (id == "piano")
    {
        bgColor = juce::Colour(0xff0e0e0f);
        accentColor = juce::Colour(0xffc9a96e);
        accent2Color = juce::Colour(0xffe8c98a);
        mutedColor = juce::Colour(0xff7a7872);
        textColor = juce::Colour(0xfff0ede8);
        instrumentName = "Studio Grand";
        instrumentSub = "Inharmonic Synthesis · Stereo Spread · Hammer Transients";
    }
    else if (id == "harp")
    {
        bgColor = juce::Colour(0xff060810);
        accentColor = juce::Colour(0xffc9a84c);
        accent2Color = juce::Colour(0xffe8c96a);
        mutedColor = juce::Colour(0xff6a7a8a);
        textColor = juce::Colour(0xffe8dfc8);
        instrumentName = "Celestial Harp";
        instrumentSub = "Karplus-Strong · Per-String Decay · Glissando";
    }
    else if (id == "bongo")
    {
        bgColor = juce::Colour(0xff0d0905);
        accentColor = juce::Colour(0xffcf9550);
        accent2Color = juce::Colour(0xfff0bb76);
        mutedColor = juce::Colour(0xff8d6540);
        textColor = juce::Colour(0xfff5e5cf);
        instrumentName = "Studio Bongos";
        instrumentSub = "Bessel Modal Synthesis · Open · Mute · Slap";
    }
    else
    {
        bgColor = juce::Colour(0xff101010);
        accentColor = juce::Colour(0xff9070ff);
        accent2Color = juce::Colour(0xffb0a0ff);
        mutedColor = juce::Colour(0xff666680);
        textColor = juce::Colour(0xffeeeaff);
        instrumentName = "Instrudio";
        instrumentSub = "";
    }
}

void InstrudioEditor::styleKnob(juce::Slider& s, juce::Label& l, const juce::String& name)
{
    s.setSliderStyle(juce::Slider::RotaryVerticalDrag);
    s.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 60, 16);
    s.setColour(juce::Slider::rotarySliderFillColourId, accentColor);
    s.setColour(juce::Slider::rotarySliderOutlineColourId, mutedColor.withAlpha(0.3f));
    s.setColour(juce::Slider::thumbColourId, accent2Color);
    s.setColour(juce::Slider::textBoxTextColourId, textColor);
    s.setColour(juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
    addAndMakeVisible(s);

    l.setText(name, juce::dontSendNotification);
    l.setJustificationType(juce::Justification::centred);
    l.setColour(juce::Label::textColourId, mutedColor);
    l.setFont(juce::Font(10.0f));
    addAndMakeVisible(l);
}

void InstrudioEditor::setupKnobs()
{
    juce::String id = proc.getInstrumentId();

    if (id == "violin")
    {
        styleKnob(knob1, knob1Label, "BOW PRESS");  knob1.setRange(0.05, 1.0, 0.01); knob1.setValue(0.6);
        styleKnob(knob2, knob2Label, "BOW SPEED");   knob2.setRange(0.05, 1.0, 0.01); knob2.setValue(0.55);
        styleKnob(knob3, knob3Label, "BRIGHTNESS");   knob3.setRange(0.1, 1.0, 0.01);  knob3.setValue(0.75);
        styleKnob(knob4, knob4Label, "VOLUME");       knob4.setRange(0.0, 1.0, 0.01);  knob4.setValue(0.72);
    }
    else if (id == "piano")
    {
        styleKnob(knob1, knob1Label, "VOLUME");    knob1.setRange(0.0, 1.0, 0.01); knob1.setValue(0.7);
        styleKnob(knob2, knob2Label, "REVERB");    knob2.setRange(0.0, 1.0, 0.01); knob2.setValue(0.35);
        styleKnob(knob3, knob3Label, "BRIGHTNESS"); knob3.setRange(500, 8000, 100); knob3.setValue(3000);
        styleKnob(knob4, knob4Label, "TONE");      knob4.setRange(0.0, 1.0, 0.01); knob4.setValue(0.5);
    }
    else if (id == "harp")
    {
        styleKnob(knob1, knob1Label, "VOLUME");    knob1.setRange(0.0, 1.0, 0.01); knob1.setValue(0.75);
        styleKnob(knob2, knob2Label, "REVERB");    knob2.setRange(0.0, 1.0, 0.01); knob2.setValue(0.45);
        styleKnob(knob3, knob3Label, "DAMPING");   knob3.setRange(0.0, 1.0, 0.01); knob3.setValue(0.3);
        styleKnob(knob4, knob4Label, "RESONANCE"); knob4.setRange(0.0, 1.0, 0.01); knob4.setValue(0.5);
    }
    else // bongo
    {
        styleKnob(knob1, knob1Label, "VOLUME");  knob1.setRange(0.0, 1.0, 0.01); knob1.setValue(0.78);
        styleKnob(knob2, knob2Label, "ROOM");    knob2.setRange(0.0, 1.0, 0.01); knob2.setValue(0.22);
        styleKnob(knob3, knob3Label, "TONE");    knob3.setRange(400, 5000, 50);   knob3.setValue(2200);
        styleKnob(knob4, knob4Label, "ACCENT");  knob4.setRange(0.35, 1.35, 0.01); knob4.setValue(0.92);
    }
}

void InstrudioEditor::paint(juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();

    // Background gradient
    g.setGradientFill(juce::ColourGradient(
        bgColor.brighter(0.08f), bounds.getCentreX(), 0.0f,
        bgColor, bounds.getCentreX(), bounds.getHeight(),
        true));
    g.fillAll();

    // Subtle radial glow at top
    g.setGradientFill(juce::ColourGradient(
        accentColor.withAlpha(0.06f), bounds.getCentreX(), 0.0f,
        juce::Colours::transparentBlack, bounds.getCentreX(), bounds.getHeight() * 0.5f,
        true));
    g.fillRect(bounds);

    // Header area
    float headerH = 70.0f;
    g.setColour(accent2Color);
    g.setFont(juce::Font(28.0f).boldened());
    g.drawText(instrumentName, bounds.removeFromTop(40.0f).reduced(20, 0), juce::Justification::centredLeft);

    g.setColour(mutedColor);
    g.setFont(juce::Font(11.0f));
    g.drawText(instrumentSub, bounds.removeFromTop(18.0f).reduced(20, 0), juce::Justification::centredLeft);

    // MIDI activity LED
    float ledX = getWidth() - 40.0f, ledY = 20.0f, ledR = 6.0f;
    g.setColour(midiLit ? accent2Color : mutedColor.withAlpha(0.3f));
    g.fillEllipse(ledX, ledY, ledR * 2, ledR * 2);
    if (midiLit)
    {
        g.setColour(accent2Color.withAlpha(0.2f));
        g.fillEllipse(ledX - 4, ledY - 4, ledR * 2 + 8, ledR * 2 + 8);
    }
    g.setColour(mutedColor);
    g.setFont(juce::Font(9.0f));
    g.drawText("MIDI", (int)(ledX - 10), (int)(ledY + 16), 32, 12, juce::Justification::centred);

    // Separator line
    g.setColour(accentColor.withAlpha(0.15f));
    g.drawHorizontalLine((int)headerH, 20.0f, getWidth() - 20.0f);

    // "Instrudio" branding bottom-right
    g.setColour(mutedColor.withAlpha(0.25f));
    g.setFont(juce::Font(9.0f));
    g.drawText("Instrudio v2.0.0", getWidth() - 140, getHeight() - 20, 120, 16, juce::Justification::centredRight);
}

void InstrudioEditor::resized()
{
    auto area = getLocalBounds();
    area.removeFromTop(75); // header space

    // Knobs row
    auto knobArea = area.removeFromTop(110);
    int knobW = knobArea.getWidth() / 4;
    int knobH = 80;
    int labelH = 16;

    auto k1 = knobArea.removeFromLeft(knobW);
    knob1.setBounds(k1.removeFromTop(knobH).reduced(10, 0));
    knob1Label.setBounds(k1.removeFromTop(labelH));

    auto k2 = knobArea.removeFromLeft(knobW);
    knob2.setBounds(k2.removeFromTop(knobH).reduced(10, 0));
    knob2Label.setBounds(k2.removeFromTop(labelH));

    auto k3 = knobArea.removeFromLeft(knobW);
    knob3.setBounds(k3.removeFromTop(knobH).reduced(10, 0));
    knob3Label.setBounds(k3.removeFromTop(labelH));

    auto k4 = knobArea.removeFromLeft(knobW);
    knob4.setBounds(k4.removeFromTop(knobH).reduced(10, 0));
    knob4Label.setBounds(k4.removeFromTop(labelH));

    // Keyboard at bottom
    area.removeFromTop(10);
    keyboard.setBounds(area.reduced(10, 0));
}

void InstrudioEditor::timerCallback()
{
    // MIDI activity LED
    if (proc.midiActivity.exchange(false))
    {
        midiLit = true;
        midiLitCounter = 4; // ~130ms at 30Hz
    }
    if (midiLitCounter > 0)
    {
        midiLitCounter--;
        if (midiLitCounter == 0) midiLit = false;
    }
    repaint(getWidth() - 60, 10, 50, 40); // only repaint LED area

    // Feed keyboard MIDI to synth
    juce::MidiBuffer keyMidi;
    keyboardState.processNextMidiBuffer(keyMidi, 0, 512, true);
    if (!keyMidi.isEmpty())
    {
        for (auto meta : keyMidi)
        {
            auto msg = meta.getMessage();
            if (msg.isNoteOn())
                proc.getSynth().noteOn(msg.getChannel(), msg.getNoteNumber(), msg.getFloatVelocity());
            else if (msg.isNoteOff())
                proc.getSynth().noteOff(msg.getChannel(), msg.getNoteNumber(), msg.getFloatVelocity(), true);
        }
    }
}
