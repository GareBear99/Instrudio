cmake_minimum_required(VERSION 3.22)
project(InstrudioPlugins VERSION 2.0.0)

set(CMAKE_CXX_STANDARD 17)

add_subdirectory(JUCE)

# ── Macro to create one plugin per instrument ──────────────────
macro(instrudio_plugin TARGET_NAME PRODUCT PLUGIN_CODE INSTRUMENT_ID)
    juce_add_plugin(${TARGET_NAME}
        COMPANY_NAME "Instrudio"
        PLUGIN_MANUFACTURER_CODE Inst
        PLUGIN_CODE ${PLUGIN_CODE}
        FORMATS AU VST3 Standalone
        PRODUCT_NAME "${PRODUCT}"
        IS_SYNTH TRUE
        NEEDS_MIDI_INPUT TRUE
        NEEDS_MIDI_OUTPUT TRUE
        IS_MIDI_EFFECT FALSE
        EDITOR_WANTS_KEYBOARD_FOCUS TRUE
        COPY_PLUGIN_AFTER_BUILD TRUE
    )

    target_sources(${TARGET_NAME} PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginProcessor.h
        Source/PluginEditor.cpp
        Source/PluginEditor.h
        Source/ViolinVoice.h
        Source/PianoVoice.h
        Source/HarpVoice.h
        Source/BongoVoice.h
    )

    target_compile_definitions(${TARGET_NAME} PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
        INSTRUDIO_INSTRUMENT_ID="${INSTRUMENT_ID}"
    )

    target_link_libraries(${TARGET_NAME}
        PRIVATE
            juce::juce_audio_utils
        PUBLIC
            juce::juce_recommended_config_flags
            juce::juce_recommended_lto_flags
            juce::juce_recommended_warning_flags
    )
endmacro()

# ── 4 Core Instruments ─────────────────────────────────────────
instrudio_plugin(InstrudioViolin
    "Instrudio Studio Violin" InVi violin)

instrudio_plugin(InstrudioGrand
    "Instrudio Studio Grand" InGr piano)

instrudio_plugin(InstrudioHarp
    "Instrudio Celestial Harp" InHa harp)

instrudio_plugin(InstrudioBongos
    "Instrudio Studio Bongos" InBo bongo)
