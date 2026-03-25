/**
 * Instrudio Preload — Bridges the HTML renderer to native MIDI via Electron IPC.
 * Exposes window.NativeMIDI which the instrument pages can detect and use
 * instead of (or alongside) the Web MIDI API.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('NativeMIDI', {
  // Send MIDI output (when user plays notes on the HTML instrument)
  sendNoteOn: (note, velocity, channel) => ipcRenderer.send('midi-note-on', note, velocity, channel),
  sendNoteOff: (note, channel) => ipcRenderer.send('midi-note-off', note, channel),
  sendCC: (cc, value, channel) => ipcRenderer.send('midi-cc', cc, value, channel),

  // Get available MIDI ports
  getPorts: () => ipcRenderer.invoke('midi-get-ports'),

  // Select which input port to listen on
  selectInput: (portIndex) => ipcRenderer.send('midi-select-input', portIndex),

  // Listen for incoming MIDI messages from native ports
  onMessage: (callback) => {
    ipcRenderer.on('native-midi-message', (_, event, data) => {
      callback(data);
    });
  },

  // Listen for port list updates
  onPortsUpdated: (callback) => {
    ipcRenderer.on('midi-ports-updated', (_, ports) => {
      callback(ports);
    });
  },

  // Check if we're running in the Electron app
  isElectron: true,
});

// Also override InstrudioMIDI's init to prefer native MIDI when available
contextBridge.exposeInMainWorld('__instrudioElectron', {
  version: '2.0.0',
  platform: process.platform,
});
