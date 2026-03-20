# Instrudio Electro Studio

> A browser-native instrument suite built on the Web Audio API. Six fully playable instruments, a cross-instrument score engine, and zero dependencies. Drop the folder on any static host and it runs.

---

## Contents

```
instrudio/
├── index.html               # Landing hub — instrument browser
├── piano.html               # Studio Grand piano
├── guitar.html              # Studio Guitar (6-string, 4 body types)
├── harp.html                # Celestial Harp (47 strings, pedal system)
├── violin.html              # Studio Violin (physical modelling)
├── bongo.html               # Electro Bongos (membrane synthesis)
├── saxophone.html           # Electro Saxophone (reed synthesis)
├── instrudio-suite.js       # Cross-instrument score engine
└── Instrudio_Score_Example.notes   # Example score file
```

Each instrument is a self-contained `.html` file. Open any one directly in a browser — no build step, no server required.

---

## Quick Start

```bash
# Option 1: open directly
open index.html

# Option 2: local server (recommended for some browsers)
npx serve .
python3 -m http.server 8080
php -S localhost:8080

# Option 3: GitHub Pages
# Push folder to repo → Settings → Pages → Deploy from branch
```

---

## Instruments

### 🎹 Studio Grand — `piano.html`

**Synthesis:** Inharmonic oscillator stack with per-register string stiffness constants.

Each partial is placed at its physically correct inharmonic frequency:

```
fₙ = n · f₀ · √(1 + B · n²)
```

where **B** is the inharmonicity constant, measured per register:

| Register | MIDI range | B constant |
|----------|-----------|------------|
| Low bass | < 36      | 0.00008    |
| Bass     | 36–47     | 0.00014    |
| Mid-low  | 48–59     | 0.00025    |
| Middle   | 60–71     | 0.00045    |
| Treble   | 72–83     | 0.00080    |
| High     | 84+       | 0.00140    |

**Stereo spread:** `StereoPannerNode` positions each note left-to-right matching concert grand layout (low notes left, high notes right).

**Hammer transient:** 25ms noise burst through a bandpass filter. Filter centre frequency scales with velocity — soft keystroke gives a dull thud, hard strike gives a bright crack.

**Dual-string unison:** Notes 36–84 receive a second oscillator at +0.4–1.5 cents detune (piano strings are double or triple wound; their beating is part of the characteristic tone).

**Tone profiles:**

| Profile | Character |
|---------|-----------|
| Concert Grand | Full harmonics, long sustain, natural decay |
| Bright | Enhanced upper partials, tighter decay |
| Warm | Suppressed upper harmonics, longer sustain |
| Upright | Shorter decay, richer harmonic content |
| Jazz | Fast decay, strong mid harmonics |

**Controls:** Volume · Reverb · Brightness (LP filter) · Tone profile · Octave selector · Sustain pedal

**Keyboard mapping:**

```
White keys: A W S E D F T G Y H U J K O L
Black keys: W E   T Y U   O
Octave down: hold Shift
Sustain: Space
```

---

### 🎸 Studio Guitar — `guitar.html`

**Synthesis:** Inharmonic harmonic stack with acoustic body resonance EQ and sympathetic string resonance.

**Inharmonicity:** Per-string B constants derived from string gauge:

| String | Note | B constant |
|--------|------|-----------|
| 1 (low E) | E2 | 0.00048 |
| 2 | A2 | 0.00036 |
| 3 | D3 | 0.00028 |
| 4 | G3 | 0.00022 |
| 5 | B3 | 0.00018 |
| 6 (high E) | E4 | 0.00014 |

**Body resonance EQ:** 6-band peaking filter chain tuned to measured acoustic guitar body modes (Rossing & Richardson):

| Mode | Frequency | Character |
|------|-----------|-----------|
| Main air resonance | 100 Hz | Low warmth |
| Main wood resonance | 200 Hz | Body |
| Top plate | 400 Hz | Midrange |
| Back plate | 600 Hz | Presence |
| Bridge hill | 1800 Hz | Definition |
| Upper resonance | 3500 Hz | Brightness |

Gain values vary by body type (Acoustic / Electric / Classical / Bass). Per-string offsets shift the balance — bass strings are warmer, treble strings brighter.

**Sympathetic resonance:** When a played note is within 22 cents of an open string (or its octave), that open string rings at low amplitude for the note's natural decay time.

**Pick transient:** 35ms noise burst through a bandpass filter centred at 2.5× the fundamental.

**Body thump:** For acoustic and classical bodies, a sine wave drops from 0.5× to 0.22× the fundamental in 100ms — the characteristic air-column thud of an acoustic guitar body.

**Body types:** Acoustic · Electric · Classical · Bass  
**Modes:** Play (individual strings) · Chord mode  
**Controls:** Body type · Tone · Reverb · Volume · Strum direction

**Standard tuning:** E2 A2 D3 G3 B3 E4 (MIDI 40 45 50 55 59 64)

---

### 🪶 Celestial Harp — `harp.html`

**Synthesis:** 47-string concert harp with inharmonic decay, sympathetic resonance, and soundboard body EQ.

**String range:** C1 to G7 (standard concert harp tuning).

**Inharmonicity:** Per-register B constants (harp strings are longer and thinner than piano, producing different stiffness profiles):

| Register | String index | B constant |
|----------|-------------|-----------|
| Bass | 0–9 | 0.00042 |
| Mid | 10–24 | 0.00028 |
| Treble | 25–46 | 0.00016 |

**Per-harmonic decay:** Each overtone decays at a rate inversely proportional to its harmonic number — `τₙ = τ₁ / (1 + n·0.4)`. This matches the physics of a plucked string where higher partials dissipate faster.

**Sympathetic resonance:** Adjacent strings (±2 positions) that share a close pitch relationship ring at reduced amplitude when a string is plucked. Amplitude scales linearly with pitch proximity (zero at 30 cents separation).

**Soundboard body EQ:** 5-band peaking filter tuned to harp body resonances:

| Mode | Frequency | Register emphasis |
|------|-----------|-------------------|
| Soundboard main | 200 Hz | Bass strings boosted |
| Upper bout | 400 Hz | All strings |
| Bridge area | 800 Hz | Mid strings |
| Brilliance | 2500 Hz | Treble strings boosted |
| Sparkle | 4500 Hz | High treble |

**Pedal system:** 7 pedals (C D E F G A B), each with three positions: flat (−1), natural (0), sharp (+1). Pedal positions retune all strings of that note class simultaneously — the correct concert harp mechanism.

**Pluck transient:** 25ms noise burst through a bandpass filter at 3× fundamental — the fingernail-on-string sound.

**Controls:** Resonance (decay length) · Reverb · Volume · Brightness · 7 pedals  
**Glissando buttons:** Upward and downward sweeps across all strings

---

### 🎻 Studio Violin — `violin.html`

**Synthesis:** The most technically advanced instrument in the suite. Full physical modelling pipeline.

#### Helmholtz Waveform

The bowed string produces Helmholtz motion — not a sine wave, not a sawtooth, but an asymmetric waveform whose duty cycle depends on bow pressure. Synthesised using a `PeriodicWave` built from the Bessel/Rayleigh Fourier series:

```
bₙ = −(2 / (n²π²·D·(1−D))) · sin(n·π·D)
```

where **D** is the duty cycle: `D = 0.5 + bowPressure × 0.30`

At light bow pressure (D ≈ 0.5): symmetric waveform, thin tone.  
At heavy bow pressure (D ≈ 0.8): 70/30 asymmetry — the tone that makes a violin sound like a violin.

#### H2 Correction Oscillator

Measured violin spectra (Schelleng 1954, Woodhouse 2004) show H2/H1 ratio of 0.65. The Helmholtz waveform alone gives 0.27. A dedicated sine oscillator at 2× the fundamental with gain `injLevel × 0.38` brings the ratio to 0.648.

#### Inharmonicity Chorus

Two additional Helmholtz oscillators at ±2.5 cents with independent slow drift model string stiffness inharmonic beating. Per-string B constants:

| String | B constant |
|--------|-----------|
| G3 | 0.00035 |
| D4 | 0.00028 |
| A4 | 0.00022 |
| E5 | 0.00018 |

#### Stradivari Body Resonances

8-stage peaking filter chain tuned to measured Stradivari resonances (Jansson, Hutchins, Woodhouse):

| Mode | Frequency | Q | Character |
|------|-----------|---|-----------|
| A0 Helmholtz | 275 Hz | 4.2 | Main air resonance |
| A1 main air | 475 Hz | 5.1 | Air cavity |
| B1− main wood | 530 Hz | 4.8 | Top plate |
| B1+ top plate | 580 Hz | 5.5 | Back plate |
| Bridge hill | 2800 Hz | 6.5 | Critical violin character |
| Upper resonance | 4500 Hz | 5.0 | Air and brightness |
| Anti-resonance | 1100 Hz | 2.8 | Notch |
| Low warmth | 180 Hz | 2.0 | Fundamental support |

**Per-string offsets:** G string is warmer (−3 dB bridge hill, +4 dB A0). E string is brighter (+3 dB bridge hill, −4 dB A0).

#### Nonlinear Bow Coupling

Injection level (how strongly the waveform drives the resonator) uses tanh saturation:

```
injLevel = tanh(bowSpeed × bowPressure × 3.8) × 0.42 × bowPoint
```

This models real physics: pressing harder eventually stops adding volume and only changes tone.

#### Vibrato

Pressure-coupled vibrato depth: `effVibDepth = vDepth × (0.6 + bowPressure × 0.6)`. Light bow (flautando) naturally narrows vibrato. Heavy bow widens it. Vibrato applied as Hz deviation, not cents — `vibHz = freq × (2^(depth×50/1200) − 1)`.

#### Sympathetic Resonance

Four triangle oscillators run continuously at open string pitches (G3 195.998 Hz, D4 293.665 Hz, A4 440.000 Hz, E5 659.255 Hz). When a played note is within 20 cents of an open string or its octaves (1×, 2×, 4×), the corresponding oscillator rises with 300ms attack. Released with 1.5s decay. Amplitude: `(1 − cents/20) × 0.038`.

#### Additional Features

- **Attack scratch transient:** 20–60ms noise burst (pressure-dependent) at note start — bow hair catching string
- **Bow speed LFO:** 0.35–0.55 Hz triangle wave on injection gain ±10% — natural bow stroke acceleration
- **Speed-dependent release:** `0.10 + (1 − bowSpeed) × 0.28` seconds
- **Bow hair warmth filter:** High shelf at 3 kHz ramps −2 dB over 1.5s
- **Stereo early reflections:** 8ms L at −12 dB, 15ms R at −18 dB
- **Ensemble mode:** ±14 cent detuned copies with independent LFO rates
- **Interval-scaled pitch glide:** `glideTime = (18 + semitones × 4) ms`
- **Pitch approach:** New notes start 8 cents flat, ramp to pitch in 40ms

**Controls:** Bow Pressure · Bow Speed · Bow Point · Reverb · Volume · Character (Solo/Ensemble/Baroque/Sul Ponticello) · Vibrato Rate · Vibrato Depth · Attack · Brightness · Single Note toggle

**Modes:** Bowed · Pizzicato · Col Legno

**Keyboard:** Hold Z X C V = open strings G D A E · A S D F G H J = frets · Space = sustain

**Fingerboard:** Click/drag = continuous pitch glide. Drag across strings = string crossing with natural bow transition overlap.

---

### 🥁 Electro Bongos — `bongo.html`

**Synthesis:** Circular membrane physics using Bessel function modal frequency ratios.

A struck circular membrane vibrates at frequencies determined by the zeros of Bessel functions — not harmonic multiples. The first six modal ratios (normalised to the fundamental):

```
[1.000, 1.593, 2.136, 2.296, 2.653, 2.917]
```

These come from Bessel function zeros: J₀(2.405), J₁(3.832), J₀(5.520), J₁(7.016)... divided by the first zero (2.405).

**Per-mode decay:** Each mode decays at a rate inversely proportional to its order:

```
τₘ = τ₁ × [1.0, 0.55, 0.35, 0.28, 0.18, 0.12]
```

Higher modes dissipate energy faster — physically correct behaviour for a struck membrane.

**Strike position:** Changes which modes are excited. Centre strike: symmetric modes dominant (mode 1 strongest). Edge strike: asymmetric modes boosted (modes 2, 3, 4 rise relative to mode 1). Implemented as a linear interpolation between two amplitude profiles.

**Kill on retrigger:** Each drum (high/low) tracks its active voice. Rapid playing properly kills the previous note before starting the next — no voice stacking.

**Rim shot:** When striking within the outer 28% of the drum radius, or in slap mode, a high-frequency sine oscillator fires at 4.8× (high drum) or 3.9× (low drum) the fundamental.

**Head noise:** Bandpass-filtered noise burst models skin impact. Filter frequency varies by articulation:
- Open: 1600 Hz centre
- Slap: 2800 Hz centre (more finger snap)
- Mute: 1000 Hz centre (damped)

**Drums:** Hembra (low, ~157 Hz) · Macho (high, ~215 Hz) — tunable ±7 semitones

**Articulations:** Open · Mute · Slap

**Controls:** Room reverb · Tone · Volume · Tuning · Accent

---

### 🎷 Electro Saxophone — `saxophone.html`

**Synthesis:** Reed instrument modelling using `PeriodicWave` with correct bore acoustics, vibrato LFO, formant EQ, and portamento.

**Reed waveform:** A saxophone is a conical-bore instrument. Conical bore = open pipe = even harmonics present. Cylindrical bore = closed pipe = odd harmonics dominant. The saxophone sits between: predominantly odd harmonics with weak even harmonics. Encoded as a `PeriodicWave`:

```
Harmonic amplitudes:
H1:  1.00  H2:  0.28  H3:  0.52  H4:  0.16
H5:  0.34  H6:  0.10  H7:  0.22  H8:  0.07
H9:  0.14  H10: 0.04
```

**Portamento:** In legato mode, consecutive notes glide from the previous pitch. Glide time scales with interval: `glideTime = |semitones| × 8ms`, minimum 20ms.

**Signal chain:**

```
Reed oscillator (PeriodicWave)
  + Octave (triangle × 2)
  + Sub (sine × 0.5)
  + Growl LFO (square, 32–68 Hz)
→ Body filter (lowpass, breath-controlled cutoff)
→ Formant EQ (peaking, character-specific frequency)
→ Amplitude envelope
→ Reverb send
```

**Air noise:** Looping bandpass noise models breath turbulence. Air filter centre frequency: `2200 + breath × 1200 Hz`.

**Formant frequencies by character:**

| Character | Formant |
|-----------|---------|
| Soprano | 2200 Hz |
| Alto | 1600 Hz |
| Tenor | 1100 Hz |
| Baritone | 800 Hz |

**Vibrato:** LFO at `4.8 + vibrato × 2.4 Hz` applied to body oscillator frequency. Jazz mode uses wider depth (18 cents vs 10 cents).

**Growl:** Square wave sub-oscillator at 32–68 Hz feeds into the formant filter for that rough, overblown tone.

**Controls:** Breath · Vibrato · Growl · Reverb · Volume · Character (Soprano/Alto/Tenor/Baritone) · Mode

**Playing modes:** Legato · Staccato · Jazz

**Built-in phrases:** Fall · Lift · Trill · Blue lick

**Keyboard:** A–K maps C4–C5 · Shift = octave up · Space = breath accent

---

## Score Engine — `instrudio-suite.js`

A cross-instrument score engine that parses note text, schedules playback with tempo, and routes notes to whichever instrument page is open.

### Score Format

Notes are written as `NOTE/DURATION` tokens separated by spaces. Bars are separated by `|` (optional, for readability).

```
E4/1 E4/1 F4/1 G4/1 | G4/1 F4/1 E4/1 D4/1
```

**Note names:** Standard scientific pitch notation — C, C#, D, D#, E, F, F#, G, G#, A, A#, B followed by octave number.

**Duration values:** Beat multipliers relative to the tempo's quarter note.

| Value | Duration |
|-------|----------|
| `4` | Whole note (4 beats) |
| `2` | Half note |
| `1` | Quarter note |
| `0.5` | Eighth note |
| `0.25` | Sixteenth note |
| `1.5` | Dotted quarter |

**Example — Ode to Joy:**
```
E4/1 E4/1 F4/1 G4/1 | G4/1 F4/1 E4/1 D4/1 | C4/1 C4/1 D4/1 E4/1 | E4/1.5 D4/0.5 D4/2
```

### Built-in Songs

| Song | Tempo | Arrangements |
|------|-------|--------------|
| Ode to Joy | ♩=104 | Violin, Saxophone, Bongo |
| Für Elise | ♩=112 | Violin (pizz), Saxophone, Guitar, Bongo |
| Canon in D | ♩=92 | Harp, Violin, Saxophone, Bongo |
| Swan Lake Theme | ♩=84 | Violin, Saxophone, Piano, Bongo |
| Minuet in G | ♩=96 | Piano, Violin, Harp |

Each arrangement includes instrument-specific transposition and technique flags (bow/pizz/legato/staccato).

### JavaScript API

Each instrument page exposes `window.InstrudioBridge`:

```javascript
InstrudioBridge.instrument   // 'piano' | 'guitar' | 'harp' | 'violin' | 'bongo' | 'saxophone'
InstrudioBridge.minMidi      // lowest playable MIDI note
InstrudioBridge.maxMidi      // highest playable MIDI note
InstrudioBridge.init()       // initialise AudioContext (call after user gesture)
InstrudioBridge.playMidi(midi, velocity, durationMs)  // play a note
InstrudioBridge.stopAll()    // silence all active voices
```

The suite engine accesses this bridge to drive playback.

### Playing a Custom Score

```javascript
// Parse note text
const events = InstrudioSuite.parseNoteText('C4/1 E4/1 G4/1 C5/2');

// Schedule playback at 120 BPM
InstrudioSuite.schedulePlayback(events, 120);

// Stop
InstrudioSuite.stopPlayback();
```

### `.notes` File Format

Score files use the same token format as inline text. Import by pasting content into the score dock UI (shown on each instrument page when `instrudio-suite.js` is loaded).

---

## Browser Requirements

| Feature | Required for |
|---------|-------------|
| Web Audio API | All instruments |
| `AudioContext` / `webkitAudioContext` | All instruments |
| `PeriodicWave` | Violin (Helmholtz), Saxophone (reed) |
| `StereoPannerNode` | Piano (stereo spread) |
| `createConvolver` | Reverb (all instruments) |
| `PointerEvents` | Fingerboard / drum pads |

**Supported:** Chrome 66+, Firefox 76+, Safari 14.1+, Edge 79+

No polyfills needed. No build tools. No npm.

---

## Architecture

### Audio Initialisation Pattern

All instruments use lazy AudioContext initialisation — the context is created on the first user gesture (click, tap, keydown). This is required by browser autoplay policy.

```javascript
function initAudio() {
  if (actx) return;              // already initialised
  actx = new AudioContext();     // created on user gesture
  // ... build graph
}
```

### Signal Chain (Generic)

```
Oscillator(s)
  → WaveShaper (distortion/saturation)
  → Gain (note envelope)
  → Body EQ filters (peaking chain)
  → Master gain
  → Dry gain ──────────────────────→ Destination
  → Convolver (reverb) → Wet gain → Destination
```

### Voice Management

Each instrument tracks active voices in a dictionary (`activeNotes[midi]`) or array (`activeVoices`). Notes are killed before retrigger, and all audio nodes are disconnected after release to prevent memory leaks.

```javascript
// Pattern used by all instruments
function stopNote(midi, immediate = false) {
  const note = activeNotes[midi];
  if (!note) return;
  // Envelope release
  const t = actx.currentTime;
  note.gain.exponentialRampToValueAtTime(0.0001, t + releaseTime);
  // Stop oscillators
  note.oscs.forEach(o => o.stop(t + releaseTime + 0.05));
  // Disconnect nodes (garbage collection)
  setTimeout(() => note.gain.disconnect(), (releaseTime + 0.1) * 1000);
  delete activeNotes[midi];
}
```

### Inharmonicity Pattern

Used by Piano, Guitar, Harp, Violin. Each harmonic `n` is placed at its physically correct frequency:

```javascript
const hf = freq * n * Math.sqrt(1 + B * n * n);
```

where `B` is the string inharmonicity constant (experimentally measured, instrument-specific).

---

## Deployment

### GitHub Pages

1. Push the folder contents to the root of a repository (or a `/docs` subfolder)
2. Go to **Settings → Pages**
3. Set source to your branch, root or `/docs`
4. Access at `https://username.github.io/repo-name/`

All instruments will be accessible at their direct paths (`/piano.html`, `/violin.html`, etc.).

### Netlify / Vercel

Drag the folder into the Netlify dashboard or run:

```bash
npx netlify deploy --dir . --prod
```

No build command needed. Publish directory is the folder root.

### Self-Hosted

Copy all files to any directory served by Apache, Nginx, or any HTTP server. No server-side processing is used. The only external resource is Google Fonts, loaded via CDN in each instrument's `<head>`.

---

## File Sizes

| File | Size | Notes |
|------|------|-------|
| `violin.html` | 47 kb | Largest — full physical modelling pipeline |
| `guitar.html` | 31 kb | Fretboard canvas + chord system |
| `harp.html` | 30 kb | 47-string layout + particle system |
| `bongo.html` | 27 kb | Membrane synthesis + visual canvas |
| `saxophone.html` | 27 kb | Reed model + fingering diagram |
| `piano.html` | 18 kb | Keyboard layout + tone profiles |
| `instrudio-suite.js` | 24 kb | Score engine + song library |
| `index.html` | 14 kb | Landing hub |
| **Total** | **~218 kb** | **No external JS dependencies** |

---

## Physics References

The synthesis models in this suite draw on the following research:

**Violin / bowed strings**
- Schelleng, J.C. (1973). *The bowed string and the player.* Journal of the Acoustical Society of America.
- Woodhouse, J. (2004). *Bowed string simulation using a thermal friction model.* Acustica.
- Jansson, E.V. (2002). *Acoustics for Violin and Guitar Makers.* KTH Royal Institute of Technology.
- Smith, J.O. (2010). *Physical Audio Signal Processing.* CCRMA Stanford. (Helmholtz waveform Fourier series)

**Piano**
- Conklin, H.A. (1996). *Design and tone in the mechanoacoustic piano.* Journal of the Acoustical Society of America. (inharmonicity constants)

**Guitar**
- Rossing, T.D. & Richardson, B.E. (1992). *Numerical models of the acoustic guitar.* Journal of the Guitar Acoustics Society. (body mode frequencies)

**Bongo / percussion membranes**
- Morse, P.M. & Ingard, K.U. (1968). *Theoretical Acoustics.* Princeton University Press. (Bessel function membrane modes)

**Saxophone / reed instruments**
- Benade, A.H. (1976). *Fundamentals of Musical Acoustics.* Oxford University Press. (conical bore harmonics)

---

## Licence

MIT. Use freely, modify freely, ship freely.

---

*Built with the Web Audio API. No frameworks. No bundlers. No dependencies.*
