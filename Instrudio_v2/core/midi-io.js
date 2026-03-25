/**
 * Instrudio MIDI I/O — Shared Web MIDI module
 * Reads CC mappings from the SSOT definition, routes external MIDI to InstrudioBridge,
 * and sends MIDI output when the user plays the HTML instrument.
 *
 * Depends on: InstrudioBridge (per-instrument), InstrudioSSOTRuntime (optional)
 * Exposes: window.InstrudioMIDI
 */
(function () {
  'use strict';

  let midiAccess = null;
  let selectedOutputId = null;
  let ccMap = {};          // midiCC → {controlId, min, max, el, setter}
  let statusCb = null;     // optional UI callback
  let channel = 0;         // listen/send channel (0-based, 0 = omni receive)
  const activeNotes = {};  // midi → true (for note-off tracking)

  // ── Helpers ──────────────────────────────────────────────────
  function bridge() { return window.InstrudioBridge || null; }

  function clampMidi(note) {
    const b = bridge();
    if (!b) return note;
    const lo = b.minMidi ?? 0, hi = b.maxMidi ?? 127;
    return Math.max(lo, Math.min(hi, note));
  }

  function ccToNorm(value, min, max) {
    return min + (value / 127) * (max - min);
  }

  // ── Build CC map from SSOT definition ───────────────────────
  function buildCCMap() {
    ccMap = {};
    const def = bridge()?.ssotDefinition || bridge()?.getSSOTDefinition?.();
    if (!def?.controls) return;
    def.controls.forEach(function (ctrl) {
      if (ctrl.midiCC == null) return;
      ccMap[ctrl.midiCC] = {
        controlId: ctrl.controlId,
        min: ctrl.min ?? 0,
        max: ctrl.max ?? 1,
        step: ctrl.step ?? 0.01
      };
    });
    // Always map sustain pedal CC64
    if (!ccMap[64]) ccMap[64] = { controlId: '_sustain', min: 0, max: 1 };
  }

  // ── Control setters (maps controlId → DOM input + internal var) ──
  // This is instrument-agnostic: it finds the HTML input by ID pattern and dispatches 'input' event
  function applyCC(controlId, normValue) {
    // Special: sustain pedal
    if (controlId === '_sustain') {
      const b = bridge();
      if (b) b._midiSustain = normValue >= 0.5;
      return;
    }
    // Try common ID patterns: exact controlId, or camelCase variants
    const ids = [controlId, controlId.replace(/([A-Z])/g, function (m) { return m.toLowerCase(); })];
    // Map from definition controlId to known HTML element IDs for violin
    const htmlIdMap = {
      bowPressure: 'bowPress', bowSpeed: 'bowSpeed', bowPoint: 'bowPoint',
      reverb: 'revCtrl', volume: 'volCtrl', vibRate: 'vibRate',
      vibDepth: 'vibDepth', attack: 'atkCtrl', brightness: 'briCtrl',
      character: 'charSelect'
    };
    const elId = htmlIdMap[controlId] || controlId;
    const el = document.getElementById(elId);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      // For select, map 0-127 to option index
      const opts = el.options;
      const idx = Math.round(normValue * (opts.length - 1));
      el.selectedIndex = Math.max(0, Math.min(opts.length - 1, idx));
    } else {
      el.value = normValue;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── MIDI Input Handler ──────────────────────────────────────
  function onMIDIMessage(e) {
    const data = e.data;
    if (!data || data.length < 2) return;
    const status = data[0] & 0xf0;
    const ch = data[0] & 0x0f;
    // Channel filter (0 = omni)
    if (channel > 0 && ch !== channel - 1) return;

    const b = bridge();
    if (!b) return;

    if (status === 0x90 && data[2] > 0) {
      // Note On
      const note = clampMidi(data[1]);
      const vel = data[2] / 127;
      activeNotes[note] = true;
      if (b.playMidi) b.playMidi(note, vel, 800);
      if (statusCb) statusCb('note-on', note, vel);
    } else if (status === 0x80 || (status === 0x90 && data[2] === 0)) {
      // Note Off
      const note = clampMidi(data[1]);
      delete activeNotes[note];
      if (b.stopAll && !Object.keys(activeNotes).length) b.stopAll();
      if (statusCb) statusCb('note-off', note, 0);
    } else if (status === 0xb0) {
      // Control Change
      var cc = data[1], val = data[2];
      var mapping = ccMap[cc];
      if (mapping) {
        var norm = ccToNorm(val, mapping.min, mapping.max);
        applyCC(mapping.controlId, norm);
        if (statusCb) statusCb('cc', cc, val);
      }
    } else if (status === 0xe0) {
      // Pitch Bend (14-bit)
      var bend = ((data[2] << 7) | data[1]) - 8192;
      var bendNorm = bend / 8192; // -1 to +1
      if (b._onPitchBend) b._onPitchBend(bendNorm);
      if (statusCb) statusCb('pitch-bend', bendNorm, 0);
    }
  }

  // ── MIDI Output ─────────────────────────────────────────────
  function getOutput() {
    if (!midiAccess) return null;
    if (selectedOutputId) return midiAccess.outputs.get(selectedOutputId) || null;
    // First available output
    var it = midiAccess.outputs.values();
    var first = it.next();
    return first.done ? null : first.value;
  }

  function sendRaw(bytes) {
    var out = getOutput();
    if (out) out.send(bytes);
  }

  function sendNoteOn(note, vel, ch) {
    sendRaw([0x90 | ((ch || 0) & 0x0f), note & 0x7f, Math.round((vel || 0.8) * 127) & 0x7f]);
  }

  function sendNoteOff(note, ch) {
    sendRaw([0x80 | ((ch || 0) & 0x0f), note & 0x7f, 0]);
  }

  function sendCC(cc, val, ch) {
    sendRaw([0xb0 | ((ch || 0) & 0x0f), cc & 0x7f, val & 0x7f]);
  }

  // ── Init ────────────────────────────────────────────────────
  function connectInputs() {
    if (!midiAccess) return;
    midiAccess.inputs.forEach(function (input) {
      input.onmidimessage = onMIDIMessage;
    });
    // Watch for hot-plug
    midiAccess.onstatechange = function () {
      midiAccess.inputs.forEach(function (input) {
        if (!input.onmidimessage) input.onmidimessage = onMIDIMessage;
      });
      if (statusCb) statusCb('state-change', 0, 0);
    };
  }

  function init(options) {
    options = options || {};
    if (options.channel != null) channel = options.channel;
    if (options.onStatus) statusCb = options.onStatus;
    buildCCMap();
    if (!navigator.requestMIDIAccess) {
      console.warn('[InstrudioMIDI] Web MIDI API not available in this browser.');
      if (statusCb) statusCb('unavailable', 0, 0);
      return Promise.resolve(false);
    }
    return navigator.requestMIDIAccess({ sysex: false }).then(function (access) {
      midiAccess = access;
      connectInputs();
      console.log('[InstrudioMIDI] Ready — ' + access.inputs.size + ' input(s), ' + access.outputs.size + ' output(s)');
      if (statusCb) statusCb('ready', access.inputs.size, access.outputs.size);
      return true;
    }).catch(function (err) {
      console.warn('[InstrudioMIDI] Access denied:', err);
      if (statusCb) statusCb('denied', 0, 0);
      return false;
    });
  }

  function getInputs() {
    if (!midiAccess) return [];
    var arr = [];
    midiAccess.inputs.forEach(function (inp) { arr.push({ id: inp.id, name: inp.name, manufacturer: inp.manufacturer }); });
    return arr;
  }

  function getOutputs() {
    if (!midiAccess) return [];
    var arr = [];
    midiAccess.outputs.forEach(function (out) { arr.push({ id: out.id, name: out.name, manufacturer: out.manufacturer }); });
    return arr;
  }

  function setOutput(id) { selectedOutputId = id; }
  function setChannel(ch) { channel = ch; }
  function isAvailable() { return !!midiAccess; }

  // ── Expose global ───────────────────────────────────────────
  window.InstrudioMIDI = {
    init: init,
    getInputs: getInputs,
    getOutputs: getOutputs,
    setOutput: setOutput,
    setChannel: setChannel,
    sendNoteOn: sendNoteOn,
    sendNoteOff: sendNoteOff,
    sendCC: sendCC,
    isAvailable: isAvailable,
    rebuildCCMap: buildCCMap
  };
})();
