# Instrudio Electro Studio v2.2

Instrudio Electro Studio is a static browser-based instrument suite built as a GitHub-friendly package.

## Included pages
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
- `instrudio-suite.js` — shared score import, autoplay, launch routing, and per-page score dock engine
- `Instrudio_Score_Example.notes` — simple note-text example import

## What is complete in this package
- Homepage with clickable launch cards for all 10 instruments
- **Info button on every homepage instrument option/card**
- Instrument-specific info modal content for all 10 instruments
- Shared score console on the homepage
- Built-in classical autoplay song library
- Drag-and-drop score import on instrument pages
- Note-text and MusicXML import support
- Silent shared engine that routes playback into each instrument page
- Static-hosting-friendly structure for GitHub Pages or any simple web host

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

## Quick start
### Local use
1. Unzip the package
2. Open `index.html` in a modern browser
3. Click an instrument card or use the homepage score console

### GitHub Pages
1. Create a repo
2. Upload all files from this package to the repo root
3. Enable GitHub Pages for the main branch
4. Use `index.html` as the landing page

## Homepage behavior
Each homepage card includes:
- `Open <Instrument>` button
- `Info` button

The info button opens an instrument-specific modal with:
- play style
- best use cases
- page extras
- why to open that instrument

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

## Suggested next expansion ideas
- MIDI export / import
- per-instrument preset save/load
- mobile touch optimization pass
- unified visual theme control panel
- accessibility and keyboard-navigation pass
- waveform / note activity mini visualizer per instrument

## Package status
This build is packaged as a strong static-web suite and is ready for:
- GitHub upload
- local demo use
- static hosting showcase
- further polish iteration


## Production release hardening added in v2.2
- `.nojekyll` for GitHub Pages compatibility
- `release-manifest.json` inventory with version/build metadata
- `SHA256SUMS.txt` integrity hashes for the shipped files
- `DEPLOYMENT.md` for local and GitHub Pages setup
- `QA_CHECKLIST.md` for release verification
