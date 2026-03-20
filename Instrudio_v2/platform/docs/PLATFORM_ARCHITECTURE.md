# Instrudio Platform Architecture

## Mission
Create a repo-driven instrument platform where web demos, desktop plugins, and the mobile app all share one canonical instrument authority.

## Non-Negotiable Rules
1. Instrument IDs must never drift between products.
2. Controls are defined once and mapped per engine.
3. Preset IDs are stable across web, plugin, and mobile.
4. Release manifest is the truth for update state.
5. Entitlement gates connected features, not the existence of public demos.

## Canonical Data Flow

```text
Repo Definitions -> Release Manifest -> Product Clients -> User Experience
```

### Repo Definitions
Contains instrument definitions, presets, mappings, and assets.

### Release Manifest
Contains release versions, compatibility, changed assets, and feature flags.

### Product Clients
- Web reads definitions to build instrument pages.
- Plugin reads definitions for UI/preset/control parity.
- Mobile reads definitions for app UI and remote surface generation.

## Why This Works
This model allows one change to propagate through the whole stack safely.

For example:
- add a new preset to xylophone
- bump xylophone version
- update release manifest
- web displays it
- plugin can fetch it if compatible
- mobile can unlock it if entitlement allows

## First Canonical Conversion Target
Convert Xylophone first, then use the same schema pipeline for:
- violin
- piano
- saxophone
- accordion
- triangle

Once one instrument is fully schema-driven, the rest can follow the same pattern.
