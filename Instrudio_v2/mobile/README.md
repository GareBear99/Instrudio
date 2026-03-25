# Instrudio Mobile App

Capacitor-based iOS/Android app wrapping the same HTML instruments.

## Tiers

**Free (App Store download):**
- All 10 instruments playable standalone
- Same synthesis engines as the web version
- Score import and autoplay

**$0.99/month subscription:**
- **Connected MIDI** — phone becomes a MIDI controller for the DAW plugin
- Session code pairing (6-digit code, shown in both app and plugin)
- MIDI events relayed via Cloudflare Durable Objects (global, low latency)
- Real-time note and CC forwarding between app and DAW

## How Connected MIDI works

1. User subscribes ($0.99/mo via App Store IAP)
2. App calls `/auth/validate` on the Cloudflare Worker with the receipt token
3. App generates a session code via `/session/create`
4. User enters the 6-digit code in the DAW plugin
5. Both connect to `wss://instrudio-relay.workers.dev/relay/{CODE}`
6. MIDI messages flow both directions through the Cloudflare relay
7. User plays the instrument on their phone → notes appear in the DAW

## Setup

```bash
cd mobile
npm install
npm run build    # copies HTML pages into www/
npx cap add ios
npx cap add android
npm run sync
npm run ios      # opens Xcode
npm run android  # opens Android Studio
```

## Architecture

```
mobile/
├── package.json
├── capacitor.config.json
└── www/
    ├── connected-midi.js    # Subscription + relay + session pairing
    └── (HTML pages copied from parent during build)
```

The app loads the same HTML instrument pages. The only additional module is `connected-midi.js` which handles subscription validation and Cloudflare relay WebSocket connections.
