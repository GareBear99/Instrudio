# Instrudio v2.8.0 — Full Instrument Definition Runtime Pass

Instrudio is a browser-based instrument suite with 10 playable instrument pages, shared score import/playback, and a production-oriented platform blueprint for future plugin + mobile subscription integration.

## Included Now
- 10 instrument HTML pages
- homepage launcher
- shared playback / import engine
- MusicXML + note-text input
- info overlays and keyboard shortcuts
- deployment and QA docs
- release manifest and checksums

## Included For Next Stage
- platform schemas
- release manifest schema
- plugin bridge contract
- mobile entitlement model
- instrument catalog
- subscription tier model
- production roadmap

## Why this repo exists
This repository is intended to become the single source of truth for:
- free web demos
- desktop plugin instrument mapping
- mobile app connected play
- entitlement-aware update flow

## Production Positioning
The current package is production-ready as a static web release.
The platform folder defines the next production layer for plugin/mobile connected rollout.

## Version
- Static Suite: v2.8.0
- Platform Blueprint: v1.2.0


## V1 single source of truth core

The v1 core release is now centered on four canonical instruments:

- Studio Grand
- Studio Violin
- Celestial Harp
- Studio Bongos

Their shared metadata lives in `instruments/definitions/` and the release grouping lives in `core/v1-ssot-manifest.json`.

### Autoplay behavior
Studio Violin now preserves the player's selected technique during autoplay. Built-in songs no longer force Pizzicato or Bowed over the user's current selection.


## What changed in v2.7.0

- Added a live `core/definition-runtime.js` loader for the four v1 core instruments.
- Studio Grand, Studio Violin, Celestial Harp, and Studio Bongos now read canonical title, range, and autoplay-policy data from `instruments/definitions/`.
- Studio Bongos now preserves the currently selected technique during autoplay, matching Studio Violin.
- `core/v1-ssot-manifest.json` now points at the runtime used by the v1 core pages.


## Full definition-runtime coverage

All ten instrument pages now ship with shared definition metadata under `instruments/definitions/` and load through `core/definition-runtime.js`.

### V1 release core
- Studio Grand
- Studio Violin
- Celestial Harp
- Studio Bongos

### Extended SSOT coverage
- Studio Guitar
- Studio Saxophone
- Studio Accordion
- Studio Harmonica
- Studio Bagpipes
- Studio Triangle

Studio Saxophone now also preserves the player's currently selected articulation during autoplay, matching the manual-technique behavior already added for Studio Violin and Studio Bongos.


## Homepage Theme

The homepage now uses the Studio Bongos warm bronze/gold visual theme to match the v1 launch identity.
