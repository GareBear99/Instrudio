> 🎛️ Part of the [TizWildin Plugin Ecosystem](https://garebear99.github.io/TizWildinEntertainmentHUB/) — 19 free audio plugins with a live update dashboard.
>
> [FreeEQ8](https://github.com/GareBear99/FreeEQ8) · [XyloCore](https://github.com/GareBear99/XyloCore) · [Instrudio](https://github.com/GareBear99/Instrudio) · [Therum](https://github.com/GareBear99/Therum_JUCE-Plugin) · [BassMaid](https://github.com/GareBear99/BassMaid) · [SpaceMaid](https://github.com/GareBear99/SpaceMaid) · [GlueMaid](https://github.com/GareBear99/GlueMaid) · [MixMaid](https://github.com/GareBear99/MixMaid) · [MultiMaid](https://github.com/GareBear99/MultiMaid) · [MeterMaid](https://github.com/GareBear99/MeterMaid) · [ChainMaid](https://github.com/GareBear99/ChainMaid) · [PaintMask](https://github.com/GareBear99/PaintMask_Free-JUCE-Plugin) · [WURP](https://github.com/GareBear99/WURP_Toxic-Motion-Engine_JUCE) · [AETHER](https://github.com/GareBear99/AETHER_Choir-Atmosphere-Designer) · [WhisperGate](https://github.com/GareBear99/WhisperGate_Free-JUCE-Plugin) · [RiftWave](https://github.com/GareBear99/RiftWaveSuite_RiftSynth_WaveForm_Lite) · [FreeSampler](https://github.com/GareBear99/FreeSampler_v0.3) · [VF-PlexLab](https://github.com/GareBear99/VF-PlexLab) · [PAP-Forge-Audio](https://github.com/GareBear99/PAP-Forge-Audio)
>
> 🎁 [Free Packs & Samples](#tizwildin-free-sample-packs) — jump to free packs & samples
>
> 🎵 [Awesome Audio](https://github.com/GareBear99/awesome-audio-plugins-dev) — (FREE) Awesome Audio Dev List

# Instrudio — Connected Instrument Ecosystem


Cross-platform instrument suite where web demos, plugins, and the mobile app all share the same live-updating instrument core.

**Play Online:** [garebear99.github.io/Instrudio/Instrudio_v2/](https://garebear99.github.io/Instrudio/Instrudio_v2/)

## ⬇ Download Plugins (Free)

> **[All Downloads — v2.0.0 Release Page](https://github.com/GareBear99/Instrudio/releases/tag/v2.0.0)**

| Plugin | VST3 (macOS) | AU (macOS) |
|---|---|---|
| Studio Violin | [Download VST3](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Violin-VST3-macOS.zip) | [Download AU](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Violin-AU-macOS.zip) |
| Studio Grand | [Download VST3](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Grand-VST3-macOS.zip) | [Download AU](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Grand-AU-macOS.zip) |
| Celestial Harp | [Download VST3](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Celestial-Harp-VST3-macOS.zip) | [Download AU](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Celestial-Harp-AU-macOS.zip) |
| Studio Bongos | [Download VST3](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Bongos-VST3-macOS.zip) | [Download AU](https://github.com/GareBear99/Instrudio/releases/download/v2.0.0/Instrudio-Studio-Bongos-AU-macOS.zip) |

**Install:** Unzip VST3 → `~/Library/Audio/Plug-Ins/VST3/` · AU → `~/Library/Audio/Plug-Ins/Components/` · Rescan in your DAW.

*Windows builds coming soon.*

---

## V1 Core (fully connected)

| Instrument | MIDI | Bridge | Presets | Definition |
|---|---|---|---|---|
| Studio Grand (piano) | ✓ | ✓ | 5 | `studio_grand.json` |
| Studio Violin | ✓ | ✓ | 6 | `studio_violin.json` |
| Celestial Harp | ✓ | ✓ | 4 | `celestial_harp.json` |
| Studio Bongos | ✓ | ✓ | 4 | `studio_bongos.json` |

6 additional instruments (Guitar, Saxophone, Accordion, Harmonica, Bagpipes, Triangle) are playable but not yet wired into the connected SSOT pipeline.

## How it works

### Single Source of Truth

Every instrument is defined by a JSON file in `Instrudio_v2/instruments/definitions/`. This definition drives:

- **Web page** — title, controls, presets, MIDI CC mappings, note range
- **Plugin bridge** — instrument ID, control IDs, preset IDs
- **Mobile app** — same definition, same IDs (planned)

### Remote-first loading

`core/definition-runtime.js` fetches definitions from this GitHub repo first (`raw.githubusercontent.com`), falling back to local files when offline. 5-minute cache TTL.

**To update all outlets:** edit a definition JSON on GitHub → push → every web page, plugin, and mobile client picks up the change automatically.

### External MIDI

The V1 Core instruments accept MIDI input from any external controller via the Web MIDI API. They also send MIDI output when played, so they can drive external synths/DAWs.

MIDI CC mappings are defined per-instrument in the definition JSON (e.g., CC1 = bow pressure on violin, CC7 = volume, CC74 = brightness).

### Plugin Bridge

`core/bridge-client.js` auto-connects to `ws://localhost:9100`. To run the bridge relay:

```
cd Instrudio_v2/platform/plugin
npm install ws
node bridge-server.js
```

Web pages and DAW plugins both connect to this relay. Messages follow `platform/plugin/bridge-contract.json`.

## Repository structure

```
Instrudio_v2/
├── index.html                    # Homepage
├── piano.html                    # Studio Grand
├── violin.html                   # Studio Violin (reference SSOT instrument)
├── harp.html                     # Celestial Harp
├── bongo.html                    # Studio Bongos
├── guitar.html … triangle.html   # 6 additional instruments
├── instrudio-suite.js            # Shared playback/import engine
├── core/
│   ├── definition-runtime.js     # Remote-first SSOT loader
│   ├── midi-io.js                # Web MIDI I/O module
│   ├── bridge-client.js          # Plugin WebSocket bridge client
│   └── v1-ssot-manifest.json     # Release manifest
├── instruments/
│   └── definitions/              # ← THE SINGLE SOURCE OF TRUTH
│       ├── studio_grand.json
│       ├── studio_violin.json
│       ├── celestial_harp.json
│       ├── studio_bongos.json
│       └── ... (6 more)
└── platform/
    ├── plugin/
    │   ├── bridge-contract.json  # Event protocol spec
    │   └── bridge-server.js      # Node.js WebSocket relay
    ├── mobile/
    │   └── entitlement-model.json
    └── schemas/
        ├── instrument.schema.json
        └── release-manifest.schema.json
```

## Updating an instrument

1. Edit the definition JSON (e.g., change a preset value, add a control, update the MIDI range)
2. Bump the `version` field
3. Push to `main`
4. Every outlet picks up the change within 5 minutes (or immediately on page refresh)

## Version

- Suite: v2.0.0
- Platform Blueprint: v2.0.0
- Definition Schema: v1.0.0

## TizWildin FREE sample packs

| Pack | Description |
|------|-------------|
| [**TizWildin-Aurora**](https://github.com/GareBear99/TizWildin-Aurora) | 3-segment original synth melody pack with loops, stems, demo renders, and neon/cinematic phrasing |
| [**TizWildin-Obsidian**](https://github.com/GareBear99/TizWildin-Obsidian) | Dark cinematic sample pack with choir textures, menu loops, transitions, bass, atmosphere, drums, and electric-banjo extensions |
| [**TizWildin-Skyline**](https://github.com/GareBear99/TizWildin-Skyline) | 30 BPM-tagged synthwave and darkwave loops with generator snapshot and dark neon additions |
| [**TizWildin-Chroma**](https://github.com/GareBear99/TizWildin-Chroma) | Multi-segment game synthwave loop sample pack from TizWildin Entertainment |
| [**TizWildin-Chime**](https://github.com/GareBear99/TizWildin-Chime) | Multi-part 88 BPM chime collection spanning glass, void, halo, reed, and neon synthwave lanes |
| [**Free Violin Synth Sample Kit**](https://github.com/GareBear99/Free-Violin-Synth-Sample-Kit) | Physical-model violin sample kit rendered from the Instrudio violin instrument |
| [**Free Dark Piano Sound Kit**](https://github.com/GareBear99/Free-Dark-Piano-Sound-Kit) | 88 piano notes + dark/cinematic loops and MIDI |
| [**Free 808 Producer Kit**](https://github.com/GareBear99/Free-808-Producer-Kit) | 94 hand-crafted 808 bass samples tuned to every chromatic key |
| [**Free Riser Producer Kit**](https://github.com/GareBear99/Free-Riser-Producer-Kit) | 115+ risers and 63 downlifters - noise, synth, drum, FX, cinematic |
| [**Phonk Producer Toolkit**](https://github.com/GareBear99/Phonk_Producer_Toolkit) | Drift phonk starter kit - 808s, cowbells, drums, MIDI, templates |
| [**Free Future Bass Producer Kit**](https://github.com/GareBear99/Free-Future-Bass-Producer-Kit) | Loops, fills, drums, bass, synths, pads, and FX |

### Related audio projects
- [**VF-PlexLab**](https://github.com/GareBear99/VF-PlexLab) - VocalForge PersonaPlex Lab starter repo for a JUCE plugin + local backend + HTML tester around NVIDIA PersonaPlex.
- [**PAP-Forge-Audio**](https://github.com/GareBear99/PAP-Forge-Audio) - Procedural Autonomous Plugins runtime for generating, branching, validating, and restoring plugin projects from natural-language sound intent.
