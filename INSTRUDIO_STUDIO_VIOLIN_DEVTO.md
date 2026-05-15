---
title: Studio Violin: Building a Physically Modelled Bowed-String Instrument in Instrudio
published: false
description: Studio Violin is the flagship Instrudio instrument: Helmholtz bowed-string synthesis, H2 correction, Stradivari body EQ, sympathetic resonance, MIDI control, and a single-source-of-truth JSON runtime.
tags: music,webdev,audio,javascript
canonical_url: https://github.com/GareBear99/Instrudio
---

# Studio Violin: Building a Physically Modelled Bowed-String Instrument in Instrudio

I’m building **Instrudio**, a browser-based virtual instrument ecosystem, and the flagship instrument right now is **Studio Violin**.

Studio Violin is a physically modelled bowed-string instrument built around Helmholtz motion synthesis, H2 harmonic correction, inharmonicity modelling, Stradivari-style body resonances, sympathetic open-string resonance, and live MIDI control.

The goal is not just to make a violin-like web instrument. The goal is to prove that a single version-controlled instrument definition can drive synthesis, UI, MIDI routing, plugin bridge behavior, presets, and live update propagation from one source of truth.

## What Studio Violin does

Studio Violin models the behavior of a bowed violin string using a synthesis chain designed around acoustic measurements and practical browser audio constraints.

The instrument includes:

- Helmholtz bowed-string waveform synthesis
- H2 correction oscillator
- Inharmonicity chorus per string
- 8-band Stradivari-style body EQ
- Per-string tonal offsets
- Sympathetic open-string resonance
- Nonlinear bow coupling
- Pressure-coupled vibrato
- Interval-scaled portamento
- Bow-pressure, bow-speed, bow-point, character, brightness, attack, and vibrato controls
- External MIDI routing through the Instrudio app

## Synthesis model

The Helmholtz waveform uses a Fourier-style bowed-string model:

```text
bₙ = −(2 / (n²π²D(1−D))) · sin(nπD)
D = 0.5 + bowPressure × 0.30
```

The H2 correction oscillator is used to bring the second harmonic closer to the target H2/H1 balance measured in bowed-string acoustic research.

Studio Violin also includes per-string inharmonicity spread:

```text
G = 0.00035
D = 0.00028
A = 0.00022
E = 0.00018
```

The result is a sound engine that behaves less like a static sample trigger and more like a continuously controlled bowed instrument.

## Stradivari-style body resonances

The body EQ model uses eight resonance bands:

```text
A0: 275 Hz
A1: 475 Hz
B1−: 530 Hz
B1+: 580 Hz
Bridge hill: 2800 Hz, Q = 6.5
Upper resonance: 4500 Hz
Notch: 1100 Hz
Warmth: 180 Hz
```

There are also per-string offsets:

```text
G string: warmer, reduced bridge hill
E string: brighter, boosted bridge hill
```

This lets the instrument react differently across the G, D, A, and E strings instead of applying one flat tone curve to the whole range.

## Sympathetic resonance

Studio Violin includes sympathetic resonance using four triangle oscillators tuned to the open strings.

```text
Amplitude = (1 − cents / 20) × 0.038
```

The closer the played note is to an open-string relationship, the stronger the sympathetic contribution becomes.

## Expressive controls

The instrument exposes controls for:

- Bow pressure
- Bow speed
- Bow point
- Vibrato rate
- Vibrato depth
- Attack
- Brightness
- Reverb
- Volume
- Playing character

Character modes include:

- Solo
- Bowed
- Pizzicato
- Col Legno
- Tremolo
- Spiccato

It also includes scale helpers such as G Major, D Major, A Minor, and Chromatic.

## Signal chain

The current signal chain is:

```text
PeriodicWave oscillator
→ H2 oscillator
→ chorus oscillators
→ WaveShaper
→ injection gain
→ warm shelf
→ 8 peaking body EQ bands
→ master output
```

## Single-source-of-truth instrument architecture

The bigger architecture behind Instrudio is the part I’m most excited about.

Studio Violin is driven by a single JSON definition file. That one definition can drive:

1. The web audio synthesis engine
2. The instrument UI
3. External MIDI CC routing
4. Note mapping
5. Plugin bridge event protocol
6. Preset management
7. Live auto-update propagation across connected outlets

The runtime uses a remote-first fetch strategy, so definition changes pushed to GitHub can propagate to connected running instances within the cache TTL window.

The default TTL is currently 5 minutes.

## Runtime metrics

Instrudio also includes live evaluation metrics for the single-source-of-truth runtime.

The metrics panel can display:

- SSOT fetch latency
- Definition apply time
- Remote source availability
- MIDI pipeline latency

These are captured with high-resolution timing through `performance.now()`.

Metrics are also available programmatically through:

```text
InstrudioSSOTRuntime.getMetrics()
InstrudioMIDI.getLatencyMetrics()
```

## Why this matters

A lot of virtual instruments are either sample libraries, closed plugin binaries, or isolated web toys.

Instrudio is aiming for something different:

- web-first instruments
- version-controlled definitions
- measurable runtime behavior
- MIDI-aware performance
- bridgeable plugin architecture
- open development
- fast iteration without redeploying every outlet manually

Studio Violin is the flagship proof-of-concept for that architecture.

## Repo

https://github.com/GareBear99/Instrudio

## Feedback wanted

I’m looking for feedback from:

- audio developers
- Web Audio developers
- musicians
- violinists
- producers
- plugin developers
- MIDI users
- people interested in physical modelling

Useful feedback includes:

- browser and OS
- MIDI device behavior
- latency
- tone realism
- UI feel
- control response
- broken notes or stuck notes
- console errors
- ideas for the next instrument model

Studio Violin is the flagship instrument in Instrudio, and I’m building it in public.
