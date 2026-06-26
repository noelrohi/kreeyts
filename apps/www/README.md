# Assetwell website

Public TanStack Start site for Assetwell.

## Development

From the repo root:

```bash
bun install
bun run dev:www
```

Open `http://localhost:3000`.

## Download routes

The public CTA links to `/download`, where visitors pick a platform. Platform availability and release-asset matching live in `@assetwell/product/downloads`.

`/api/download?platform=macos` redirects to the latest matching macOS release asset. Windows and Linux are marked coming soon, so the API does not resolve assets for them yet.

## Social previews

Favicons, app icons, and the Open Graph image live in `public/`.

Set `VITE_SITE_URL` in production so canonical and Open Graph URLs are absolute:

```bash
VITE_SITE_URL=https://your-domain.example
```
