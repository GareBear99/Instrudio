/**
 * Instrudio Cloudflare Worker — MIDI Relay + Auth
 *
 * Routes:
 *   GET  /health                → 200 OK
 *   POST /auth/validate         → validates subscription token
 *   GET  /relay/:sessionCode    → WebSocket upgrade → MidiRelay Durable Object
 *
 * The MidiRelay Durable Object manages a "room" identified by a 6-digit session code.
 * Both the mobile app and the DAW plugin connect to the same room.
 * MIDI messages from either side are broadcast to the other.
 *
 * Subscription gating: the WebSocket upgrade checks for a valid auth token.
 * Free users can play instruments standalone but cannot connect MIDI.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'instrudio-relay', version: '2.0.0' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Subscription validation
    if (url.pathname === '/auth/validate' && request.method === 'POST') {
      return handleAuthValidate(request, env);
    }

    // Generate session code (app calls this to start a session)
    if (url.pathname === '/session/create' && request.method === 'POST') {
      const code = generateSessionCode();
      return jsonResponse({ sessionCode: code, expiresIn: 3600 });
    }

    // WebSocket relay — /relay/:sessionCode
    const relayMatch = url.pathname.match(/^\/relay\/([A-Z0-9]{6})$/);
    if (relayMatch) {
      const sessionCode = relayMatch[1];
      return handleRelayUpgrade(request, env, sessionCode);
    }

    return new Response('Instrudio Relay — Use /relay/:sessionCode for WebSocket', { status: 404 });
  },
};

// ── Auth ──────────────────────────────────────────────────────
async function handleAuthValidate(request, env) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return jsonResponse({ valid: false, error: 'Missing token' }, 400);
    }

    // TODO: Validate against App Store / Google Play receipt
    // For now, accept any non-empty token as valid (stub)
    // In production: verify receipt with Apple's verifyReceipt API
    // or Google Play Developer API

    // Stub validation — replace with real receipt verification
    const isValid = token.length > 10;

    return jsonResponse({
      valid: isValid,
      features: isValid ? ['connected-midi', 'plugin-link', 'external-midi-mode'] : [],
      tier: isValid ? 'subscriber' : 'free',
    });
  } catch (e) {
    return jsonResponse({ valid: false, error: 'Invalid request' }, 400);
  }
}

// ── Session code generator ───────────────────────────────────
function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Relay WebSocket upgrade ──────────────────────────────────
async function handleRelayUpgrade(request, env, sessionCode) {
  // Check for auth token in query string or header
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('Authorization')?.replace('Bearer ', '');

  // For the relay to work, subscription must be active
  // Stub: allow connections with any token for now
  // In production: validate token here before allowing upgrade
  if (!token) {
    return new Response('Subscription required for connected MIDI. Get the app for $0.99/mo.', {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Route to Durable Object
  const id = env.MIDI_RELAY.idFromName(sessionCode);
  const relay = env.MIDI_RELAY.get(id);
  return relay.fetch(request);
}

// ── Durable Object: MidiRelay ────────────────────────────────
export class MidiRelay {
  constructor(state, env) {
    this.state = state;
    this.sessions = new Map(); // ws → {type: 'app'|'plugin', connectedAt}
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    const url = new URL(request.url);
    const clientType = url.searchParams.get('type') || 'unknown'; // 'app' or 'plugin'

    this.sessions.set(server, {
      type: clientType,
      connectedAt: Date.now(),
    });

    console.log(`[Relay] ${clientType} connected (${this.sessions.size} total in room)`);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    // Broadcast to all OTHER connections in the room
    for (const [peer, info] of this.sessions) {
      if (peer !== ws) {
        try {
          peer.send(message);
        } catch (e) {
          // Dead connection — will be cleaned up on close
        }
      }
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    this.sessions.delete(ws);
    console.log(`[Relay] Client disconnected (${this.sessions.size} remaining)`);
  }

  async webSocketError(ws, error) {
    this.sessions.delete(ws);
  }
}

// ── Helpers ──────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
