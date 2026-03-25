cmake_minimum_required(VERSION 3.22)
project(InstrudioPlugin VERSION 2.0.0)

set(CMAKE_CXX_STANDARD 17)

add_subdirectory(JUCE)

juce_add_plugin(InstrudioPlugin
    COMPANY_NAME "Instrudio"
    PLUGIN_MANUFACTURER_CODE Inst
    PLUGIN_CODE Ins1
    FORMATS AU VST3 Standalone
    PRODUCT_NAME "Instrudio"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    COPY_PLUGIN_AFTER_BUILD TRUE
)

target_sources(InstrudioPlugin PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginProcessor.h
    Source/PluginEditor.cpp
    Source/PluginEditor.h
)

target_compile_definitions(InstrudioPlugin PUBLIC
    JUCE_WEB_BROWSER=1
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(InstrudioPlugin
    PRIVATE
        juce::juce_audio_utils
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)
