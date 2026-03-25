#!/usr/bin/env node
/**
 * Instrudio Bridge Server — WebSocket relay for plugin connectivity
 *
 * Run:  node bridge-server.js [port]
 *
 * Web pages and DAW plugins both connect to this server.
 * Messages from any client are broadcast to all other connected clients.
 * Protocol follows platform/plugin/bridge-contract.json.
 */

const PORT = parseInt(process.argv[2], 10) || 9100;

let WebSocketServer;
try {
  WebSocketServer = require('ws').Server;
} catch (e) {
  // Fallback: try to use built-in (Node 22+)
  try {
    const { WebSocketServer: WSS } = require('node:ws');
    WebSocketServer = WSS;
  } catch (e2) {
    console.error('Error: "ws" module not found. Install it with: npm install ws');
    process.exit(1);
  }
}

const wss = new WebSocketServer({ port: PORT });
const clients = new Map(); // ws → {id, type, instrument}
let nextId = 1;

wss.on('listening', () => {
  console.log(`[Instrudio Bridge] Listening on ws://localhost:${PORT}`);
  console.log('[Instrudio Bridge] Waiting for connections from web pages and plugins...');
});

wss.on('connection', (ws) => {
  const id = nextId++;
  clients.set(ws, { id, type: 'unknown', instrument: 'unknown' });
  console.log(`[Bridge] Client #${id} connected (${clients.size} total)`);

  ws.on('message', (raw) => {
    let event;
    try { event = JSON.parse(raw.toString()); } catch (e) { return; }

    // Handle handshake
    if (event.type === 'handshake') {
      const info = clients.get(ws);
      if (info) {
        info.type = event.clientType || 'unknown';
        info.instrument = event.instrumentId || 'unknown';
      }
      console.log(`[Bridge] Client #${id} identified: ${event.clientType} / ${event.instrumentId}`);
      // Send ack
      ws.send(JSON.stringify({ type: 'handshake-ack', serverId: 'instrudio-bridge', version: '1.0.0', clients: clients.size }));
      return;
    }

    // Broadcast to all other clients
    const msg = raw.toString();
    for (const [client, info] of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    }

    // Log activity
    if (event.type === 'note-on' || event.type === 'note-off') {
      // Quiet for note events (too noisy)
    } else {
      console.log(`[Bridge] #${id} → ${event.type}${event.instrumentId ? ' (' + event.instrumentId + ')' : ''}`);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Bridge] Client #${id} disconnected (${clients.size} remaining)`);
  });

  ws.on('error', (err) => {
    console.error(`[Bridge] Client #${id} error:`, err.message);
  });
});

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Bridge] Port ${PORT} is already in use. Another bridge server may be running.`);
  } else {
    console.error('[Bridge] Server error:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[Bridge] Shutting down...');
  wss.close();
  process.exit(0);
});
