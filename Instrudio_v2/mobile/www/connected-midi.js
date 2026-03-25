/**
 * Instrudio Connected MIDI — Mobile App Only
 *
 * This module is loaded ONLY in the Capacitor mobile app, NOT on the web HTML pages.
 * It handles:
 * 1. Subscription validation via Cloudflare Worker
 * 2. Session code generation/entry for pairing with the DAW plugin
 * 3. WebSocket connection to Cloudflare relay for MIDI bridge
 * 4. MIDI routing between the instrument and the DAW plugin
 *
 * Free tier: instruments are playable standalone (no MIDI out)
 * $0.99/mo: unlocks Connected MIDI mode
 */
(function() {
  'use strict';

  var RELAY_BASE = 'wss://instrudio-relay.workers.dev';
  var AUTH_URL = 'https://instrudio-relay.workers.dev/auth/validate';
  var SESSION_URL = 'https://instrudio-relay.workers.dev/session/create';

  var state = {
    subscribed: false,
    sessionCode: null,
    authToken: null,
    connected: false,
    ws: null
  };

  // ── Subscription check ──────────────────────────────────────
  async function checkSubscription() {
    // Get receipt from IAP plugin (cordova-plugin-purchase)
    var token = localStorage.getItem('instrudio_sub_token') || '';
    if (!token) {
      state.subscribed = false;
      return false;
    }
    try {
      var res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });
      var data = await res.json();
      state.subscribed = data.valid;
      state.authToken = token;
      return data.valid;
    } catch (e) {
      state.subscribed = false;
      return false;
    }
  }

  // ── Session code ────────────────────────────────────────────
  async function createSession() {
    try {
      var res = await fetch(SESSION_URL, { method: 'POST' });
      var data = await res.json();
      state.sessionCode = data.sessionCode;
      return data.sessionCode;
    } catch (e) {
      return null;
    }
  }

  function joinSession(code) {
    state.sessionCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').substr(0, 6);
    return state.sessionCode;
  }

  // ── WebSocket relay connection ──────────────────────────────
  function connectRelay() {
    if (!state.subscribed || !state.sessionCode || !state.authToken) {
      console.warn('[ConnectedMIDI] Cannot connect: subscription or session missing');
      return false;
    }
    if (state.ws && state.ws.readyState === WebSocket.OPEN) return true;

    var url = RELAY_BASE + '/relay/' + state.sessionCode +
      '?token=' + encodeURIComponent(state.authToken) +
      '&type=app';

    state.ws = new WebSocket(url);

    state.ws.onopen = function() {
      state.connected = true;
      console.log('[ConnectedMIDI] Connected to relay room: ' + state.sessionCode);
      // Send handshake
      state.ws.send(JSON.stringify({
        type: 'handshake',
        clientType: 'app',
        instrumentId: window.InstrudioBridge ? window.InstrudioBridge.instrument : 'unknown',
        version: '2.0.0'
      }));
      if (window._onConnectedMIDIStatus) window._onConnectedMIDIStatus('connected', state.sessionCode);
    };

    state.ws.onmessage = function(e) {
      // Receive MIDI from the plugin, route to the instrument
      try {
        var event = JSON.parse(e.data);
        var bridge = window.InstrudioBridge;
        if (!bridge) return;
        if (event.type === 'note-on' && bridge.playMidi) {
          bridge.playMidi(event.note, event.velocity || 0.8, event.duration || 800);
        } else if (event.type === 'note-off' && bridge.stopAll) {
          bridge.stopAll();
        }
      } catch (err) {}
    };

    state.ws.onclose = function() {
      state.connected = false;
      if (window._onConnectedMIDIStatus) window._onConnectedMIDIStatus('disconnected', null);
    };

    return true;
  }

  // ── Send MIDI to the relay (when user plays in the app) ────
  function sendNoteOn(note, velocity) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({
      type: 'note-on',
      note: note,
      velocity: velocity,
      instrumentId: window.InstrudioBridge ? window.InstrudioBridge.instrument : 'unknown',
      timestamp: Date.now()
    }));
  }

  function sendNoteOff(note) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify({
      type: 'note-off',
      note: note,
      velocity: 0,
      timestamp: Date.now()
    }));
  }

  function disconnect() {
    if (state.ws) { state.ws.close(); state.ws = null; }
    state.connected = false;
    state.sessionCode = null;
  }

  // ── Expose ──────────────────────────────────────────────────
  window.InstrudioConnectedMIDI = {
    checkSubscription: checkSubscription,
    createSession: createSession,
    joinSession: joinSession,
    connectRelay: connectRelay,
    sendNoteOn: sendNoteOn,
    sendNoteOff: sendNoteOff,
    disconnect: disconnect,
    getState: function() { return JSON.parse(JSON.stringify(state)); },
    isSubscribed: function() { return state.subscribed; },
    isConnected: function() { return state.connected; },
    getSessionCode: function() { return state.sessionCode; }
  };
})();
