# Instrudio Desktop App

Electron-based desktop client that wraps the same HTML instrument pages from the repo, adding native MIDI I/O with virtual port creation.

## How it works

- The app loads the exact same HTML pages as the web version
- Definitions are fetched from GitHub (same remote-first SSOT loader)
- A virtual MIDI output port is created that DAWs can see
- Incoming MIDI from external controllers routes to the instrument
- Notes played on the HTML instrument are sent out through the virtual port

**DAWs see "Instrudio Studio Violin" (or whichever instrument is loaded) as a MIDI device.**

## Setup

```bash
cd Instrudio_v2/app
npm install
npm start
```

## Requirements

- Node.js 18+
- On macOS: Xcode Command Line Tools (for the `midi` npm native module)
- On Windows: Windows Build Tools (`npm install --global windows-build-tools`)

## Switching instruments

Use the **Instrument** menu to switch between all 10 instruments. The virtual MIDI port name updates to match.

## DAW Integration

1. Start the Instrudio app
2. In your DAW, look for "Instrudio Studio Violin" in your MIDI input devices
3. Create a MIDI track and set its input to the Instrudio port
4. Play the instrument in the app — notes appear in your DAW
5. To send MIDI *into* the app from your DAW, set the DAW's MIDI output to any available port and the app will receive it

## Building for distribution

```bash
npm run build:mac    # Creates .dmg and .zip for macOS
npm run build:win    # Creates .exe installer for Windows
npm run build:linux  # Creates .AppImage for Linux
```

## Architecture

```
app/
├── main.js          # Electron main process — window, menu, IPC
├── preload.js       # Bridges renderer to native MIDI
├── midi-backend.js  # Node.js native MIDI via 'midi' package
└── package.json     # Dependencies and build config
```

The HTML pages are loaded from `../` (the parent Instrudio_v2 directory), so they're identical to what's served on GitHub Pages. The only difference is that `window.NativeMIDI` is available in the Electron context, providing OS-level MIDI port access instead of the browser's Web MIDI API.
