## v2.8.0
- Added SSOT definition files for Studio Guitar, Studio Saxophone, Studio Accordion, Studio Harmonica, Studio Bagpipes, and Studio Triangle.
- Wired the remaining six instrument pages through `core/definition-runtime.js`.
- Expanded `core/v1-ssot-manifest.json` to include all shared instrument definitions while preserving the four-instrument v1 release core.
- Updated Studio Saxophone autoplay to preserve the user's selected articulation during autoplay.
- Updated release metadata, README, and checksums for the full 10-instrument definition-runtime pass.

## v2.7.0
- Added `core/definition-runtime.js` and wired the four v1 core pages through it.
- Enriched the v1 SSOT definition files with canonical page title, headline, range, and autoplay metadata.
- Updated Studio Grand, Studio Violin, Celestial Harp, and Studio Bongos to apply SSOT metadata at page load.
- Added autoplay technique resolver support in the shared score dock.
- Fixed Studio Bongos autoplay so it preserves the currently selected mode instead of force-switching patterns.
- Updated manifests and docs for the live v1 SSOT runtime.

## v2.6.0
- Added V1 SSOT core manifest for Studio Grand, Studio Violin, Celestial Harp, and Studio Bongos.
- Added canonical instrument definition files under `instruments/definitions/`.
- Updated suite labels to reflect V1 product names.
- Fixed Studio Violin autoplay so it respects the currently selected technique instead of force-switching to Pizzicato/Bowed from song metadata.
- Updated release manifest for the new SSOT core grouping.

# Changelog

## v2.4.0
- Added `404.html` fallback for static hosting and GitHub Pages friendly routing.
- Added MIT `LICENSE` file.
- Added homepage metadata (`description` and `theme-color`).
- Added shared Escape-to-close overlay behavior for instrument pages.
- Added shared keyboard shortcuts: `Space` to play and `S` to stop.
- Tightened parser auto-detection for raw pasted XML score content.

## v2.3.0
- Added shared production hardening pass for the release package.
- Added version constant and surfaced release version in shared UI.
- Added runtime toast feedback for success / error messages.
- Added global runtime + async error handling in the shared suite layer.
- Added shared audio unlock / resume helpers for browser interaction gating.
- Added automatic fallback info-button injection on instrument pages that expose `#infoOverlay` but do not visibly place their own button.
- Improved shared import parsing with empty-input rejection and automatic MusicXML detection.
- Added more aria labels and live status regions to generated homepage / score-dock controls.
- Improved shared mobile behavior for the homepage Score Console and per-page Score Dock.
- Updated the README to reflect the hardening pass and current release behavior.

## v2.2.0
- Added production metadata files for static release packaging.
- Added `.nojekyll`, `release-manifest.json`, `SHA256SUMS.txt`, `DEPLOYMENT.md`, and `QA_CHECKLIST.md`.
- Finalized 10-instrument homepage routing through the shared suite engine.
- Added homepage info buttons across all instrument cards.


## v2.5.0
- merged static release with platform SSOT blueprint
- added shared instrument catalog
- added subscription tier manifest and example update endpoints
- added production notes and product roadmap
- updated README for web + plugin + mobile direction

- Homepage theme updated to the Studio Bongos warm bronze/gold visual system.
