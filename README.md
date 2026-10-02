# vandida

Turn your story into jewelry. An AI-assisted custom jewelry creation and creator-commerce MVP.

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + React Router + lucide-react.

## Run locally

```bash
npm install
npm run dev
```

Demo mode is on by default (`VITE_DEMO_MODE=true` in `.env`) — the whole product journey
(Create → generate → Studio → Preview → Make Mine / Sell This Design → Creator storefront)
works with no API keys or backend.

## Build

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

## Deploy (Vercel)

```bash
vercel deploy --prod
```

`vercel.json` rewrites all routes to `index.html` so client-side routes like `/studio` or
`/creator/luna-studio` work on a hard refresh.

## Architecture

- `src/types` — `JewelryDesign`, `CharmInstance`, `AttachmentPoint`, creator/collection types.
  Kept independent of rendering so the SVG studio can be swapped for a Three.js/GLB renderer later.
- `src/data` — charm SVG shapes + material gradients, hoop attachment-point geometry, demo content.
- `src/services` — `ai.ts` (mock concept/charm generation), `pricing.ts`, `manufacturing.ts`
  (validation), `analytics.ts`, `storage.ts` (localStorage abstraction, swappable for a real backend).
- `src/context/DesignContext.tsx` — the single source of truth for the design being edited.
- `src/components/studio` — the interactive hoop canvas (pointer-based drag/snap to attachment
  points), charm library, material picker, AI charm modal.
- `src/pages` — one file per route.
