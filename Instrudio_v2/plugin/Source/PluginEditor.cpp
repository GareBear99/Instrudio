#include "PluginEditor.h"

struct InstrumentEntry { const char* id; const char* label; };
static const InstrumentEntry INSTRUMENTS[] = {
    {"violin",    "Studio Violin"},
    {"piano",     "Studio Grand"},
    {"harp",      "Celestial Harp"},
    {"bongo",     "Studio Bongos"},
    {"guitar",    "Studio Guitar"},
    {"saxophone", "Saxophone"},
    {"accordion", "Accordion"},
    {"harmonica", "Harmonica"},
    {"bagpipes",  "Bagpipes"},
    {"triangle",  "Triangle"},
};
static const int NUM_INSTRUMENTS = sizeof(INSTRUMENTS) / sizeof(INSTRUMENTS[0]);

InstrudioEditor::InstrudioEditor(InstrudioProcessor& p)
    : AudioProcessorEditor(&p), instrudioProcessor(p)
{
    setSize(1100, 780);
    setResizable(true, true);
    setResizeLimits(800, 500, 2000, 1400);

    // Instrument selector dropdown
    for (int i = 0; i < NUM_INSTRUMENTS; ++i)
        instrumentSelector.addItem(INSTRUMENTS[i].label, i + 1);
    // Find which instrument is compiled in
    for (int i = 0; i < NUM_INSTRUMENTS; ++i) {
        juce::String id(INSTRUMENTS[i].id);
        juce::String compiled(INSTRUDIO_INSTRUMENT_ID);
        if (id == compiled) { instrumentSelector.setSelectedId(i + 1); break; }
    }
    instrumentSelector.onChange = [this] { onInstrumentChanged(); };
    addAndMakeVisible(instrumentSelector);

    // WebView — loads the actual instrument HTML from GitHub Pages
    addAndMakeVisible(browser);
    loadCurrentInstrument();

    // Timer to poll for MIDI from the DAW (for forwarding to webview)
    startTimerHz(60);
}

InstrudioEditor::~InstrudioEditor()
{
    stopTimer();
}

void InstrudioEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff120b04));
}

void InstrudioEditor::resized()
{
    auto area = getLocalBounds();

    // Top bar with instrument selector
    auto topBar = area.removeFromTop(36);
    instrumentSelector.setBounds(topBar.reduced(8, 4));

    // Rest is the web browser
    browser.setBounds(area);
}

void InstrudioEditor::loadCurrentInstrument()
{
    auto url = instrudioProcessor.getCurrentURL();
    browser.goToURL(url.toStdString());
}

void InstrudioEditor::onInstrumentChanged()
{
    int idx = instrumentSelector.getSelectedId() - 1;
    if (idx >= 0 && idx < NUM_INSTRUMENTS)
    {
        instrudioProcessor.setInstrument(INSTRUMENTS[idx].id);
        loadCurrentInstrument();
    }
}

void InstrudioEditor::timerCallback()
{
    // This is where we'd inject JS to forward DAW MIDI to the webview
    // and read back note events from the webview to send to the DAW.
    //
    // JUCE's WebBrowserComponent supports evaluateJavascript() in newer versions.
    // The flow:
    // 1. DAW sends MIDI note-on → processBlock receives it
    // 2. Timer callback here injects JS: InstrudioBridge.playMidi(note, vel, dur)
    // 3. User plays HTML instrument → JS calls a callback
    // 4. We read the callback and call processor.webViewNoteOn()
    //
    // For now, the webview runs the full instrument independently.
    // The bridge-client.js in the HTML page auto-connects to ws://localhost:9100
    // which provides the DAW↔web link via the bridge server.
}
