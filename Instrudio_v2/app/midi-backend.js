/**
 * Instrudio Native MIDI Backend
 * Uses the 'midi' npm package for OS-level MIDI port access.
 * Creates a virtual MIDI output port that DAWs can see as an instrument.
 */
const midi = require('midi');

let input = null;
let output = null;
let virtualOutput = null;
let onMessageCallback = null;
let instrumentName = 'Instrudio';
let selectedInputPort = -1;

// ── Init ──────────────────────────────────────────────────────
function init(onMessage) {
  onMessageCallback = onMessage;

  // Create input for receiving from external controllers
  input = new midi.Input();
  input.on('message', (deltaTime, message) => {
    if (onMessageCallback) {
      onMessageCallback('midi-message', {
        data: Array.from(message),
        timestamp: Date.now(),
        deltaTime: deltaTime
      });
    }
  });

  // Create output for sending to other apps/DAWs
  output = new midi.Output();

  // Create virtual output port — DAWs will see this as "Instrudio Studio Violin" etc.
  virtualOutput = new midi.Output();
  try {
    virtualOutput.openVirtualPort(instrumentName);
    console.log('[MIDI Backend] Virtual output port created: ' + instrumentName);
  } catch (e) {
    console.warn('[MIDI Backend] Could not create virtual port:', e.message);
    virtualOutput = null;
  }

  // Auto-connect to first available input
  if (input.getPortCount() > 0) {
    selectInput(0);
  }
}

// ── Port management ──────────────────────────────────────────
function getPorts() {
  var inputs = [];
  var outputs = [];

  if (input) {
    for (var i = 0; i < input.getPortCount(); i++) {
      inputs.push({ index: i, name: input.getPortName(i) });
    }
  }
  if (output) {
    for (var i = 0; i < output.getPortCount(); i++) {
      outputs.push({ index: i, name: output.getPortName(i) });
    }
  }

  return {
    inputs: inputs,
    outputs: outputs,
    virtualOutput: virtualOutput ? instrumentName : null
  };
}

function refreshPorts() {
  // Ports are enumerated fresh each call
  return getPorts();
}

function selectInput(portIndex) {
  if (!input) return;
  try {
    if (selectedInputPort >= 0) input.closePort();
    input.openPort(portIndex);
    selectedInputPort = portIndex;
    console.log('[MIDI Backend] Listening on input: ' + input.getPortName(portIndex));
  } catch (e) {
    console.warn('[MIDI Backend] Failed to open input port ' + portIndex + ':', e.message);
  }
}

// ── Send MIDI out ────────────────────────────────────────────
function sendNoteOn(note, velocity, channel) {
  var msg = [0x90 | ((channel || 0) & 0x0f), note & 0x7f, Math.round((velocity || 0.8) * 127) & 0x7f];
  if (virtualOutput) virtualOutput.sendMessage(msg);
  if (output && output.isPortOpen && output.isPortOpen()) output.sendMessage(msg);
}

function sendNoteOff(note, channel) {
  var msg = [0x80 | ((channel || 0) & 0x0f), note & 0x7f, 0];
  if (virtualOutput) virtualOutput.sendMessage(msg);
  if (output && output.isPortOpen && output.isPortOpen()) output.sendMessage(msg);
}

function sendCC(cc, value, channel) {
  var msg = [0xb0 | ((channel || 0) & 0x0f), cc & 0x7f, value & 0x7f];
  if (virtualOutput) virtualOutput.sendMessage(msg);
  if (output && output.isPortOpen && output.isPortOpen()) output.sendMessage(msg);
}

// ── Virtual port management ──────────────────────────────────
function setInstrumentName(name) {
  instrumentName = 'Instrudio ' + name;
  // Recreate virtual port with new name
  if (virtualOutput) {
    try { virtualOutput.closePort(); } catch (e) {}
    try {
      virtualOutput.openVirtualPort(instrumentName);
      console.log('[MIDI Backend] Virtual port renamed: ' + instrumentName);
    } catch (e) {
      console.warn('[MIDI Backend] Could not recreate virtual port:', e.message);
    }
  }
}

function enableVirtualOutput() {
  if (virtualOutput) return;
  virtualOutput = new midi.Output();
  try {
    virtualOutput.openVirtualPort(instrumentName);
  } catch (e) {
    virtualOutput = null;
  }
}

function disableVirtualOutput() {
  if (!virtualOutput) return;
  try { virtualOutput.closePort(); } catch (e) {}
  virtualOutput = null;
}

// ── Cleanup ──────────────────────────────────────────────────
function cleanup() {
  if (input) { try { input.closePort(); } catch (e) {} }
  if (output) { try { output.closePort(); } catch (e) {} }
  if (virtualOutput) { try { virtualOutput.closePort(); } catch (e) {} }
}

module.exports = {
  init, getPorts, refreshPorts, selectInput,
  sendNoteOn, sendNoteOff, sendCC,
  setInstrumentName, enableVirtualOutput, disableVirtualOutput,
  cleanup
};
