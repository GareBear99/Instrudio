# Instrudio — Connected Instrument Ecosystem

Cross-platform instrument suite where web demos, plugins, and the mobile app all share the same live-updating instrument core.

**Live:** [garebear99.github.io/Instrudio/Instrudio_v2/](https://garebear99.github.io/Instrudio/Instrudio_v2/)

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
