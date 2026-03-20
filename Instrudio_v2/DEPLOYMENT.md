# Instrudio Electro Studio Deployment Guide

## Local demo
1. Unzip the release.
2. Open `index.html` in a modern browser.
3. Click any instrument card or use the homepage Score Console.

## GitHub Pages
1. Create a new GitHub repository.
2. Upload all release files to the repository root.
3. Commit and push.
4. In GitHub repository settings, enable **Pages** for the default branch root.
5. Visit the published URL.

## Recommended browsers
- Chrome / Chromium
- Edge
- Safari
- Firefox

## Release validation
- `index.html` is the homepage entrypoint.
- `.nojekyll` is included for GitHub Pages friendliness.
- `release-manifest.json` contains the versioned file inventory.
- `SHA256SUMS.txt` contains integrity hashes for every shipped file.

- `404.html` is included as a fallback entry for simple GitHub Pages deployments.
