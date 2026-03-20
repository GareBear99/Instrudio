# Instrudio Electro Studio v2.3.0

Instrudio Electro Studio is a static, browser-based instrument suite built for fast local use, GitHub Pages deployment, and clean public demos.

## Included instruments
- Guitar
- Harp
- Piano
- Violin
- Bongos
- Saxophone
- Accordion
- Harmonica
- Bagpipes
- Triangle

## Core package contents
- `index.html` — branded homepage / launcher
- `guitar.html`
- `harp.html`
- `piano.html`
- `violin.html`
- `bongo.html`
- `saxophone.html`
- `accordion.html`
- `harmonica.html`
- `bagpipes.html`
- `triangle.html`
- `instrudio-suite.js` — shared score import, autoplay, launch routing, instrument dock, runtime messaging, and release helpers
- `Instrudio_Score_Example.notes` — simple note-text example import
- `CHANGELOG.md`
- `DEPLOYMENT.md`
- `QA_CHECKLIST.md`
- `release-manifest.json`
- `SHA256SUMS.txt`
- `.nojekyll`

## What is complete in this build
- Homepage launcher for all 10 instruments
- **Info button on every homepage instrument card**
- Instrument-specific homepage info modal content for all 10 instruments
- Shared homepage Score Console
- Built-in autoplay song library
- Drag-and-drop score import on instrument pages
- Note-text and MusicXML import support
- Shared silent playback engine that routes into each instrument page
- Runtime toast / error feedback for import and playback actions
- Audio unlock / resume helpers for browsers that suspend Web Audio until interaction
- Versioned release badge and release metadata
- Accessibility upgrades on shared controls via labels, status regions, and aria attributes
- Static-host-friendly structure for GitHub Pages or any simple web host

## Built-in songs
- Ode to Joy
- Für Elise
- Canon in D
- Swan Lake Theme
- Minuet in G

## Supported score inputs
### 1) Simple note text
Format examples:
- `E4/1 F#4/0.5 G4/2`
- `C4/1 E4/1 G4/1 C5/2`
- `R/1 C4/1 D4/1 E4/1`

Rules:
- Use note name + octave, then `/duration`
- `R` or `REST` means rest
- Duration is in beats
- `.txt` and `.notes` are supported

### 2) MusicXML
Supported file extensions:
- `.musicxml`
- `.xml`

Instrudio detects MusicXML automatically when XML score content is present and falls back to note-text parsing for plain text input.

## Quick start
### Local use
1. Unzip the package
2. Open `index.html` in a modern browser
3. Click an instrument card or use the homepage Score Console
4. On first interaction, browser audio unlocks and playback becomes available

### GitHub Pages
1. Create a repo
2. Upload all files from this package to the repo root
3. Enable GitHub Pages for the main branch
4. Use `index.html` as the landing page

## Homepage behavior
Each homepage card includes:
- `Open <Instrument>` button
- `Info` button

The homepage Info button opens an instrument-specific modal with:
- play style
- best use cases
- page extras
- why to open that instrument

The homepage Score Console includes:
- instrument selector
- built-in song selector
- file import
- pasted note-text import
- runtime validation / feedback messages

## Instrument-page behavior
Each instrument page includes the Instrudio Score Dock with:
- song select
- tempo
- transpose
- loop toggle
- autoplay
- stop button
- drag-and-drop import zone
- file import
- note-text paste box
- back-to-homepage link
- runtime feedback message area

Where an instrument page does not already place a visible info trigger itself, the shared suite layer injects one automatically when `#infoOverlay` exists.

## Production hardening added in v2.3.0
- Global runtime toast for success / error feedback
- Shared error handling for runtime and async failures
- Audio context registration + first-interaction resume helpers
- Input validation path that rejects empty scores and unsupported imports cleanly
- Improved mobile layout behavior for shared Score Console / Score Dock controls
- Shared aria labels and live status regions on generated UI
- Release version string surfaced in the shared UI

## Suggested next expansion ideas
- MIDI export / import
- per-instrument preset save/load
- mobile touch optimization pass inside each individual instrument page
- unified visual theme control panel
- deeper keyboard-navigation pass inside each standalone instrument UI
- waveform / note activity mini visualizer per instrument
- session save / restore for imported scores

## Package status
This build is packaged as a production-ready static web suite and is ready for:
- GitHub upload
- local demo use
- static hosting showcase
- release archiving
- further feature expansion
