# Assetwell

Assetwell is an early desktop app for creating image and video ad assets with the Higgsfield CLI, plus a small public marketing/download site. The desktop app wraps the pinned `@higgsfield/cli` package in an Electron + React interface and streams generation output back into the app.

## Status

This project is **very early**. Expect rough edges, missing persistence, incomplete flows, and frequent changes without migration guarantees.

Assetwell is public for visibility, but it is **not open to external contributions right now**. Please do not open PRs or issues expecting support. That may change later once the product direction and architecture settle.

## Development

This repo uses Bun.

```bash
bun install
bun run dev:desktop
bun run dev:www
```

Useful checks:

```bash
bun run fmt:check
bun run test
bun run typecheck
```

## Notes

- Desktop app source lives in `apps/desktop`.
- Public website source lives in `apps/www`; set `VITE_SITE_URL` for production canonical and Open Graph URLs.
- Shared product/domain registries live in `packages/product`.
- The Electron host invokes the bundled Higgsfield CLI first, with global CLI fallback only when needed.
- Higgsfield credentials are managed through the CLI and stored in the app's local data area.
