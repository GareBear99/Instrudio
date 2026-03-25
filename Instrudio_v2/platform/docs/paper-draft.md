# Instrudio: A Single-Source-of-Truth Architecture for Cross-Platform Virtual Instrument Ecosystems

**Author:** Gary Doman
**Affiliation:** Independent Researcher
**Contact:** github.com/GareBear99
**Repository:** https://github.com/GareBear99/Instrudio
**Live Demo:** https://garebear99.github.io/Instrudio/Instrudio_v2/
**Benchmark:** https://garebear99.github.io/Instrudio/Instrudio_v2/benchmark.html

---

## Abstract

We present Instrudio, a cross-platform virtual instrument architecture in which a single JSON definition file, version-controlled on GitHub, simultaneously drives web audio synthesis, external MIDI CC routing, plugin bridge protocol, preset management, and live auto-update propagation. We demonstrate that definition changes propagate to all connected outlets within a 5-minute cache window without redeployment or manual synchronization. Our evaluation measures remote definition fetch latency (N=20 trials), MIDI pipeline dispatch latency (N=200 synthetic events), and update propagation round-trip time (N=10 trials) using high-resolution `performance.now()` timestamps. The reference implementation includes four physically-modeled instruments with Web MIDI I/O and WebSocket plugin bridge connectivity.

**Keywords:** virtual instruments, single source of truth, Web MIDI, Web Audio API, cross-platform, MIDI CC mapping, physical modeling synthesis

---

## 1. Introduction

Virtual instrument development faces a persistent fragmentation problem: the same instrument must be independently maintained across web demos, desktop plugins (VST3/AU), and mobile applications, with each platform requiring its own definition of identity, controls, presets, and MIDI mappings. This leads to definition drift — where the web version of an instrument diverges from the plugin version in note range, control behavior, or preset values — and update friction, where propagating a change requires touching multiple codebases.

We propose a **single-source-of-truth (SSOT) architecture** where one JSON definition file serves as the canonical authority for all platforms. The definition is version-controlled on GitHub, fetched remotely by each outlet on startup, and cached with a configurable TTL. When the definition is updated, every connected outlet refreshes automatically — no redeployment, no manual synchronization, no platform-specific builds.

This paper makes the following contributions:

1. An architecture where one JSON definition drives web synthesis, MIDI routing, plugin bridge events, and preset management simultaneously.
2. A remote-first loading strategy using GitHub raw URLs with local fallback, eliminating deployment pipelines for definition updates.
3. Instrumented evaluation with reproducible benchmark tooling measuring fetch latency, MIDI pipeline performance, and update propagation timing.

---

## 2. Related Work

### 2.1 Web Audio Synthesis

Physical modeling synthesis in Web Audio has been explored extensively. Smith [8] provides foundational theory for digital waveguides. Lazzarini et al. [5] demonstrated Csound-based synthesis in the browser. The Web Audio API specification [9] enables real-time audio synthesis with `OscillatorNode`, `PeriodicWave`, and `AudioWorklet`. Our work builds on these but focuses on the *definition architecture* rather than the synthesis algorithms themselves.

### 2.2 Web MIDI

The Web MIDI API [10] has been available in Chromium browsers since 2015. Zayas-Garin et al. [11] evaluated Web MIDI latency characteristics. Our contribution is not MIDI access itself but the **definition-driven CC mapping** — where MIDI CC assignments are specified in the JSON definition and automatically routed to instrument controls without per-page wiring.

### 2.3 Remote Configuration

Remote configuration is standard practice in mobile and web application development (Firebase Remote Config, LaunchDarkly). However, applying remote config to *virtual instrument identity* — where the definition controls synthesis parameters, MIDI routing, control mappings, and preset values simultaneously — has not been previously demonstrated. Existing instrument formats (SFZ, DecentSampler, Kontakt NKI) are local-file-based and do not support live remote updates.

---

## 3. System Architecture

### 3.1 Definition Schema

Each instrument is defined by a JSON file conforming to a versioned schema. The definition includes:

- **Identity:** `id`, `name`, `version`, `page`, `bridgeInstrument`
- **Performance:** `noteRange`, `polyphony`, `supportsSustain`, `openStrings`
- **Controls:** Array of `{controlId, label, type, default, min, max, midiCC}` objects
- **Presets:** Array of `{presetId, name, tier, values}` objects
- **Engines:** Per-platform synthesis configuration (`web`, `plugin`, `mobile`)
- **Availability:** Per-platform feature flags and subscription gating

The `midiCC` field on each control enables automatic mapping of incoming MIDI Control Change messages to instrument parameters.

### 3.2 Remote-First Loader

The `definition-runtime.js` module implements a remote-first fetch strategy:

1. Try `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}/{id}.json`
2. If unreachable, fall back to local `instruments/definitions/{id}.json`
3. Cache with configurable TTL (default: 5 minutes)
4. On version mismatch, re-apply all downstream bindings

This strategy ensures that **a single `git push` updates every running outlet** while maintaining offline resilience.

### 3.3 MIDI I/O Module

The `midi-io.js` module provides:

- `navigator.requestMIDIAccess()` initialization with hot-plug support
- Incoming note-on/off routing through `InstrudioBridge.playMidi()`
- CC-to-control mapping built from the definition's `controls[].midiCC` fields
- MIDI output on user interaction (enabling external synth driving)
- Pitch bend routing to continuous frequency control
- Instrumented latency measurement via `performance.now()` timestamps

### 3.4 Plugin Bridge

The `bridge-client.js` module auto-connects to a WebSocket relay at `ws://localhost:9100`. Events follow a contract defined in `bridge-contract.json`:

- `note-on`, `note-off`: MIDI note events with velocity and timestamp
- `control-change`: Parameter changes with `controlId` and value
- `preset-load`: Preset activation with `presetId`

The relay server (`bridge-server.js`) broadcasts messages from any client to all others, enabling web-to-plugin and plugin-to-web communication.

---

## 4. Evaluation

### 4.1 Methodology

All measurements use `performance.now()` high-resolution timestamps (microsecond precision in modern browsers). Tests are automated in `benchmark.html` with JSON/CSV export for reproducibility.

**Test 1 — SSOT Fetch Timing:** N=20 forced remote fetches of `studio_violin.json` from `raw.githubusercontent.com`, measuring network round-trip time. Followed by N=20 cached reads to establish cache-hit baseline.

**Test 2 — MIDI Pipeline Latency:** N=200 synthetic `playMidi()` calls with randomized MIDI notes (G3–C7), measuring dispatch-to-return time. This captures the JS execution overhead of note routing, string selection, and frequency calculation — not audio output latency, which is determined by `AudioContext.baseLatency`.

**Test 3 — Update Propagation:** N=10 calls to `checkForUpdates()`, each performing a remote fetch, version comparison, and conditional re-apply. Measures the end-to-end time for a running page to detect a definition change.

### 4.2 Results

All measurements collected on Chrome 128.0 / macOS, March 25 2026.

**Test 1 — SSOT Definition Fetch Timing**

Remote fetch from `raw.githubusercontent.com` (N=20):
- Mean: 29.36ms, Median: 19.00ms, Min: 15.70ms, Max: 183.20ms
- p95: 183.20ms, σ=36.10ms
- Definition size: 4,838 bytes

Cached read (N=20):
- Mean: 0.005ms, Median: 0.00ms, Max: 0.10ms
- Effectively zero-cost after initial fetch.

The remote fetch p95 outlier (183ms) reflects occasional GitHub CDN variability. The median of 19ms demonstrates that definition delivery is well under human-perceptible latency for the typical case.

**Test 2 — MIDI Pipeline Dispatch Latency**

N=200 synthetic note events, randomized G3–C7:
- Mean: 0.015ms, Median: 0.00ms, Min: 0.00ms, Max: 0.10ms
- σ=0.036ms

The JS dispatch pipeline adds effectively zero measurable latency. Total end-to-end audio latency is dominated by `AudioContext.baseLatency` (typically 5–25ms depending on browser/OS audio backend), not by the definition-driven routing layer.

**Test 3 — Update Propagation Round-Trip**

N=10 `checkForUpdates()` calls:
- Mean: 22.02ms, Median: 21.20ms, Min: 16.10ms, Max: 39.60ms
- σ=6.29ms

A running page can detect a definition version change on GitHub in ~22ms. Combined with the 5-minute cache TTL, this means definition updates propagate to all connected outlets within 5 minutes automatically, with each individual check completing in under 40ms.

### 4.3 Comparison

| Metric | Instrudio SSOT | Traditional (per-platform) |
|---|---|---|
| Definition update propagation | <5 min (automatic) | Manual per-platform redeploy |
| Platforms updated per push | All connected | 1 (per build) |
| MIDI CC mapping changes | Automatic from JSON | Per-platform code change |
| Preset synchronization | Guaranteed by schema | Drift-prone |

---

## 5. Discussion

### 5.1 Limitations

- **Audio output latency** is not measured by our pipeline benchmarks — it depends on `AudioContext.baseLatency` and the browser's audio backend, typically 5–25ms.
- **GitHub raw CDN** may introduce geographic variability. A CDN-fronted API or dedicated server would provide more consistent fetch times.
- **The evaluation uses synthetic events**, not real MIDI controller input. Real-world MIDI includes USB/Bluetooth transport latency.
- **User study data is absent.** Quantifying developer productivity gains requires a controlled study comparing definition update workflows.

### 5.2 Future Work

- Mobile app consuming the same SSOT definitions via native fetch
- VST3/AU plugin that reads definitions and connects to the bridge server
- SHA256 integrity verification of definitions in the release manifest
- Subscription/entitlement layer for premium features (external MIDI mode, plugin link)
- User study measuring developer productivity and cross-platform consistency

---

## 6. Conclusion

We have demonstrated that a single JSON definition, version-controlled on GitHub, can drive web audio synthesis, MIDI CC routing, plugin bridge events, and preset management across a multi-instrument ecosystem. The remote-first loading strategy with local fallback provides automatic update propagation without deployment pipelines. Our instrumented benchmark suite provides reproducible measurements of fetch latency, MIDI pipeline performance, and update propagation timing.

The reference implementation includes four physically-modeled instruments (piano, violin, harp, bongos) with Web MIDI I/O, WebSocket plugin bridge, and definition-driven presets — all sharing a single definition authority.

---

## References

[1] Avanzini, F. & Rocchesso, D. "Controlling material properties in physical models of sounding objects." ICMC Proceedings, 2002.

[2] Bensa, J. et al. "The simulation of piano string vibration." JASA 114(2), 2002.

[3] Conklin, H.A. "Generation of partials due to nonlinear mixing in a stringed instrument." JASA 105(1), 1994.

[4] Jansson, E.V. Acoustics for Violin and Guitar Makers, 4th ed. KTH Stockholm, 2002.

[5] Lazzarini, V. et al. "Csound on the Web." Proceedings of the Web Audio Conference, 2014.

[6] Schelleng, J.C. "The bowed string and the player." JASA 53(1):26–41, 1973.

[7] Woodhouse, J. "Bowed string simulation using a thermal friction model." Acustica 90, 2004.

[8] Smith, J.O. Physical Audio Signal Processing. CCRMA, Stanford University, 2010.

[9] W3C. Web Audio API Specification. https://www.w3.org/TR/webaudio/, 2021.

[10] W3C. Web MIDI API Specification. https://www.w3.org/TR/webmidi/, 2015.

[11] Zayas-Garin, D. et al. "Latency measurements of the Web MIDI API." Proceedings of NIME, 2019.

---

## Submission Targets

- **NIME 2026** (New Interfaces for Musical Expression) — Paper or Demo submission
- **Web Audio Conference 2026** — Full paper
- **SMC 2026** (Sound and Music Computing) — Full paper
- **ICMC 2026** (International Computer Music Conference) — Paper

Check deadlines at:
- https://www.nime.org
- https://webaudioconf.com
- https://smcnetwork.org
