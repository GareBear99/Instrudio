# Changelog

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
