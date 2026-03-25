/**
 * Instrudio Bridge Client — WebSocket transport for plugin connectivity
 * Sends/receives events per platform/plugin/bridge-contract.json
 * Auto-reconnects with exponential backoff.
 *
 * Depends on: InstrudioBridge (per-instrument)
 * Exposes: window.InstrudioBridgeClient
 */
(function () {
  'use strict';

  var ws = null;
  // Cloudflare relay (production) with localhost fallback (dev)
  var RELAY_BASE = 'wss://instrudio-relay.workers.dev';
  var url = RELAY_BASE;
  var sessionCode = '';
  var authToken = '';
  var reconnectMs = 1000;
  var maxReconnectMs = 30000;
  var reconnectTimer = null;
  var intentionalClose = false;
  var listeners = [];
  var statusCb = null;

  function bridge() { return window.InstrudioBridge || null; }

  function instrumentId() {
    var b = bridge();
    if (!b) return 'unknown';
    var def = b.ssotDefinition || (b.getSSOTDefinition ? b.getSSOTDefinition() : null);
    return (def && def.id) || b.instrument || 'unknown';
  }

  // ── Send ────────────────────────────────────────────────────
  function send(event) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    event.instrumentId = event.instrumentId || instrumentId();
    event.timestamp = event.timestamp || Date.now();
    ws.send(JSON.stringify(event));
    return true;
  }

  function sendNoteOn(note, velocity) {
    return send({ type: 'note-on', note: note, velocity: velocity });
  }

  function sendNoteOff(note) {
    return send({ type: 'note-off', note: note, velocity: 0 });
  }

  function sendControlChange(controlId, value) {
    return send({ type: 'control-change', controlId: controlId, value: value });
  }

  function sendPresetLoad(presetId) {
    return send({ type: 'preset-load', presetId: presetId });
  }

  // ── Receive ─────────────────────────────────────────────────
  function handleMessage(raw) {
    var event;
    try { event = JSON.parse(raw); } catch (e) { return; }
    // Notify listeners
    listeners.forEach(function (fn) { try { fn(event); } catch (e) { console.warn('[BridgeClient] Listener error:', e); } });

    // Route to InstrudioBridge
    var b = bridge();
    if (!b) return;

    switch (event.type) {
      case 'note-on':
        if (b.playMidi) b.playMidi(event.note, event.velocity || 0.8, event.duration || 800);
        break;
      case 'note-off':
        if (b.stopAll) b.stopAll();
        break;
      case 'control-change':
        // Dispatch to DOM element via controlId
        if (event.controlId && event.value != null) {
          var el = document.getElementById(event.controlId);
          if (el) { el.value = event.value; el.dispatchEvent(new Event('input', { bubbles: true })); }
        }
        break;
      case 'preset-load':
        // Trigger preset load if the page exposes it
        if (window._instrudioApplyPreset) window._instrudioApplyPreset(event.presetId);
        break;
      case 'transport-play':
        // Could trigger autoplay
        break;
      case 'transport-stop':
        if (b.stopAll) b.stopAll();
        break;
    }
  }

  // ── Connection ──────────────────────────────────────────────
  function connect(opts) {
    opts = opts || {};
    if (opts.url) url = opts.url;
    if (opts.sessionCode) sessionCode = opts.sessionCode;
    if (opts.authToken) authToken = opts.authToken;
    if (opts.onStatus) statusCb = opts.onStatus;
    intentionalClose = false;
    reconnectMs = 1000;

    doConnect();
  }

  function doConnect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    try {
      // Build relay URL with session code and auth
      var connectUrl = url;
      if (sessionCode) {
        connectUrl = RELAY_BASE + '/relay/' + sessionCode;
        var params = [];
        if (authToken) params.push('token=' + encodeURIComponent(authToken));
        var clientType = (typeof window !== 'undefined' && window.NativeMIDI) ? 'app' : 'plugin';
        params.push('type=' + clientType);
        if (params.length) connectUrl += '?' + params.join('&');
      }
      ws = new WebSocket(connectUrl);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = function () {
      reconnectMs = 1000;
      console.log('[BridgeClient] Connected to ' + url);
      if (statusCb) statusCb('connected');
      // Send handshake
      send({ type: 'handshake', clientType: 'web', instrumentId: instrumentId(), version: '1.0.0' });
    };

    ws.onmessage = function (e) {
      handleMessage(e.data);
    };

    ws.onclose = function () {
      console.log('[BridgeClient] Disconnected');
      if (statusCb) statusCb('disconnected');
      if (!intentionalClose) scheduleReconnect();
    };

    ws.onerror = function () {
      // onclose will fire after this
    };
  }

  function scheduleReconnect() {
    if (intentionalClose) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      doConnect();
    }, reconnectMs);
    // Exponential backoff
    reconnectMs = Math.min(maxReconnectMs, reconnectMs * 1.5);
  }

  function disconnect() {
    intentionalClose = true;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (ws) { ws.close(); ws = null; }
    if (statusCb) statusCb('disconnected');
  }

  function onEvent(fn) { listeners.push(fn); }
  function offEvent(fn) { listeners = listeners.filter(function (f) { return f !== fn; }); }
  function isConnected() { return ws && ws.readyState === WebSocket.OPEN; }

  // ── Expose global ───────────────────────────────────────────
  window.InstrudioBridgeClient = {
    connect: connect,
    disconnect: disconnect,
    send: send,
    sendNoteOn: sendNoteOn,
    sendNoteOff: sendNoteOff,
    sendControlChange: sendControlChange,
    sendPresetLoad: sendPresetLoad,
    onEvent: onEvent,
    offEvent: offEvent,
    isConnected: isConnected
  };
})();
