# Instrudio Update Flow

## Goal
All products should update from a shared release truth without becoming separate drifting apps.

## Flow
1. Developer updates instrument definitions.
2. Developer updates or regenerates manifests.
3. Repo tags a release.
4. Web deploy picks up updated static build.
5. Plugin fetches manifest and compares versions.
6. Mobile app fetches manifest and compares versions.
7. Entitlement service decides whether subscriber-only features unlock.

## Product Behavior

### Web
- Public demos always available.
- Can reflect latest static release immediately.

### Plugin
- Reads compatible instrument/control/preset definitions.
- Warns if plugin version is below minimum compatible version.

### Mobile
- Reads instrument metadata and available connected features.
- Enables remote/plugin-linked mode only for active subscribers.

## Upgrade Prompt Rules
- If product version is below minimum required version, show required update prompt.
- If product is compatible but behind latest, show optional update prompt.
- If an instrument asset changed but product is still compatible, allow silent asset refresh where possible.

## Subscription Gating Rule
The subscription gates:
- plugin linking
- external MIDI mode
- premium presets
- connected mobile play

The subscription does not gate the existence of free web demos.
