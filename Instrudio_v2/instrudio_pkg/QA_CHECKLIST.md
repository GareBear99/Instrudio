# Instrudio Electro Studio QA Checklist

## Core suite
- [x] Homepage loads
- [x] 10 instrument cards present
- [x] Every instrument card has an **Info** button
- [x] Shared score console is present on homepage
- [x] All 10 instruments are mapped in `instrudio-suite.js`

## Playback workflows
- [x] Built-in song autoplay is available
- [x] Tempo control is present
- [x] Transpose control is present
- [x] Loop toggle is present
- [x] Stop button is present

## Import workflows
- [x] MusicXML import supported
- [x] Note-text import supported
- [x] Drag-and-drop import zone present on instrument pages
- [x] Example note file included

## Release packaging
- [x] README included
- [x] CHANGELOG included
- [x] Deployment guide included
- [x] Release manifest included
- [x] SHA256 checksums included
- [x] `.nojekyll` included for GitHub Pages

- Verify `404.html` loads the same launcher surface as `index.html`.
- Press `Esc` while an info overlay is open and confirm it closes.
- Press `Space` and confirm playback launches. On instrument pages press `S` to stop.
