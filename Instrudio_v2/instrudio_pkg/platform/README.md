# Instrudio Platform SSOT Blueprint

Version: 1.0.0

This package defines the **single-source-of-truth architecture** for Instrudio so the following products can all update from one shared instrument authority:

- Web HTML instrument demos
- Desktop plugins (VST3/AU later)
- Mobile app (subscription-gated)
- Shared updater / entitlement layer

The goal is to prevent drift between products by making the repo the canonical source for:

- instrument identity
- control schema
- preset schema
- asset versioning
- compatibility rules
- release/update manifests

## Core Product Model

### Free tier
- public HTML demos
- limited presets / songs
- no plugin-phone bridge
- no premium connected mode

### Paid tier ($0.99/month target)
- full mobile instrument access
- plugin connection / remote control
- external MIDI mode
- entitlement to synced instrument updates
- access to premium presets / future connected features

## Architecture Layers

### 1. Instrument Identity Layer
Defines what an instrument is.

Examples:
- name
- note range
- pads/keys layout
- available controls
- presets
- supported products
- current version

### 2. Engine Layer
Defines how that instrument is rendered in each environment.

Targets:
- web audio engine
- plugin DSP engine
- mobile playback engine

### 3. Transport / Control Layer
Defines how products communicate.

Examples:
- MIDI input/output
- app-to-plugin bridge
- entitlement checks
- manifest update checks

## Repo Layout

```text
/instruments/
  definitions/
    xylophone.instrument.json
    violin.instrument.json
    bongo.instrument.json
  presets/
    xylophone.presets.json
  mappings/
    xylophone.midi.json
/assets/
  instruments/
    xylophone/
      icon.png
      hero.png
      preview.mp3
/schemas/
  instrument.schema.json
  preset-pack.schema.json
  release-manifest.schema.json
/manifests/
  release-manifest.json
  compatibility-matrix.json
/web/
  index.html
  instruments/
/plugin/
  bridge-contract.json
/mobile/
  entitlement-model.json
/docs/
  PLATFORM_ARCHITECTURE.md
  UPDATE_FLOW.md
```

## Release Truth

Every product reads from the shared release manifest.

The manifest decides:
- latest platform version
- latest instrument versions
- which products are compatible
- which assets changed
- which features require subscription

## Update Flow

1. Repo publishes a tagged release.
2. `release-manifest.json` updates.
3. Web build deploys static changes.
4. Plugin checks manifest on launch.
5. Mobile app checks manifest on launch.
6. Entitlement layer decides whether connected features unlock.
7. Products prompt user to update or silently refresh compatible assets.

## Subscription Rule

Do not sell access to HTML pages alone.

Sell access to the **connected ecosystem**:
- phone to plugin control
- remote instrument mode
- external MIDI routing
- synced premium presets
- premium/connected features while subscribed

## Recommended Build Order

### Phase 1 — Lock the schema
- finalize instrument schema
- finalize release manifest schema
- finalize compatibility matrix

### Phase 2 — Convert existing HTML suite
- each instrument page loads from JSON definition
- page-specific hardcoded drift is reduced

### Phase 3 — Plugin bridge
- plugin consumes same instrument IDs / control IDs / preset IDs
- plugin checks manifest compatibility

### Phase 4 — Mobile app
- sign-in + entitlement state
- connect to plugin
- browse/play instruments
- remote MIDI mode

### Phase 5 — Billing and updater
- subscription gating
- update prompts
- release compatibility enforcement

## What “Complete” Means

The platform is complete when:
- one instrument definition can drive web + plugin + mobile consistently
- update manifests cleanly describe current truth
- entitlement logic separates free vs connected features
- instrument IDs never drift across products
- presets and controls remain compatible across versions

## Immediate Next Build Target

Start with **one canonical instrument** and make it the testbed for the whole system.

Recommended first instrument:
- **Xylophone**

Why:
- simple visible mapping
- easy mobile control surface
- easy plugin mirroring
- ideal for proving the schema

See:
- `schemas/instrument.schema.json`
- `schemas/release-manifest.schema.json`
- `examples/xylophone.instrument.json`
- `docs/PLATFORM_ARCHITECTURE.md`
- `docs/UPDATE_FLOW.md`
