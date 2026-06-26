# @assetwell/product

Shared Assetwell product/domain data used by both the desktop app and the public website.

- `src/placements.ts` is the canonical placement-size registry: dimensions, labels, availability, and unavailable copy.
- `src/downloads.ts` is the canonical public download-platform registry and release asset selector.
- `assets/fonts/grifter-bold.woff` is the shared Grifter display font asset used by Assetwell surfaces. Grifter is credited in app CSS as a free font by Hanson Method; keep this single copy here instead of duplicating it per app.
