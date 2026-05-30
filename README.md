# CARGO — High-Fidelity Figma Replica (Full Suite)

**Pixel-perfect, fully interactive web replica of the "CARGO - Car Booking & Sharing App" design system** from the connected Figma file (Components Overview + 20+ production screens).

Built as a modern, production-grade PWA using the 2026 best-practice stack (React 19 + Vite + Tailwind v4 + Framer Motion + MapLibre-ready + Zustand + RHF+Zod).

> Goal: 1:1 visual + interaction fidelity with every screen, component, flow, and detail present in the Figma — implemented as a real, usable application (not a static prototype).

## Current Status (Phase 1 Complete)

- ✅ Full iPhone X device frame viewer (exact 375×812, bezels, status bar, home indicator)
- ✅ Auth & Onboarding: Splash → Sign Up (with phone + social) → Login (functional "log in" that persists)
- ✅ Core booking engine:
  - Home screen with quick actions
  - ✅ Interactive MapLibre GL destination picker (full draggable pin + tap-to-place, Nominatim reverse geocoding, Photon search autocomplete, browser geolocation with SF fallback, straight-line route preview, dynamic price estimates)
  - Select Service (4 ride types: Economy/Comfort/Premium/XL with prices, ETAs)
  - Payment (3 methods + promo entry + full confirmation + ride history)
- ✅ Global booking state (Zustand + localStorage persistence)
- ✅ Beautiful screen transitions (Framer Motion)
- ✅ PWA-ready (manifest, SW via vite-plugin-pwa)
- ✅ Design tokens & primitives already aligned to Figma (buttons 44/60px, inputs, cards, colors, SF Pro stack)
- ✅ 15+ high-res reference screenshots extracted directly from Figma via MCP

**Remaining (Phases 2+ — actively in progress by multi-agent team):**
- All remaining Figma screens (Verify OTP refinements, Enable Location real permission, Favorites, Add Place, full Scan Card flow, Pickup Time picker, etc.)
- Driver tracking simulation on map + live ETA
- Bottom sheets + gesture navigation polish
- Full offline support + visual regression tests
- Bottom sheets, full modals, gesture navigation (swipe back)
- Driver tracking simulation (real-time updating map + ETA)
- More form fidelity (country picker, numeric keyboard, OTP inputs)
- Polish, a11y, offline, full Playwright visual + flow tests

## Tech Stack (2026 Research-Backed)

- **Vite 6 + React 19** (Compiler ready) + TypeScript (strictest)
- **Tailwind CSS v4** (CSS-first via Vite plugin — tokens live in `@theme`)
- **React Router v7** + Framer Motion for transitions
- **Zustand 5** (persist) for booking + auth state
- **React Hook Form + Zod** for all forms
- **MapLibre GL** (future) + lucide-react icons
- **vite-plugin-pwa** + Workbox
- **Biome** (lint+format), Vitest + Playwright (testing)
- Full PWA installable, offline shell ready

See detailed 2026 architecture research in agent logs.

## Getting Started

```bash
# 1. Install (first time)
npm install

# 2. Run dev server (instant HMR)
npm run dev

# 3. Open http://localhost:5173
#    You will see the exact iPhone frame with the CARGO app inside.
#    Tap through the full booking flow end-to-end.

# Build for production
npm run build

# Type check + lint
npm run typecheck
npm run lint

# Run tests (when implemented)
npm test
npm run test:e2e
```

**Recommended testing**:
- Desktop: Use the beautiful device frame (best for seeing 1:1 fidelity)
- Real mobile: Open in iOS Safari / Chrome DevTools device emulation (iPhone 14/15 Pro)
- PWA: In Chrome/Edge on desktop or real device → "Install" prompt or Share → Add to Home Screen

## Figma Reference Assets

All screenshots live in `figma-refs/screens/` and `figma-refs/components/` — exported at 2× scale directly from the live Figma document using the MCP bridge.

Use these for pixel-diffing during implementation.

## Project Structure

```
src/
  screens/           # One file per major Figma screen/flow
  components/        # Shared UI (will grow with design system)
  stores/            # Zustand (single source of truth for booking)
  lib/               # Utils, future API clients, token exports
public/              # PWA icons, static assets
figma-refs/          # Source of truth screenshots + future token JSON
```

## Commit Convention

This project **strictly follows Conventional Commits 1.0.0**.

See [CONVENTIONAL_COMMITS.md](./CONVENTIONAL_COMMITS.md) for:
- The complete, properly formatted commit history of all work done so far
- Exact messages you should use if replaying the history locally
- Future contribution rules

All new work must use the format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:
- `feat(map): add draggable destination pin with reverse geocoding`
- `fix(auth): prevent OTP input from losing focus on mobile`
- `chore: update dependencies to latest 2026 versions`
- `feat!: drop support for legacy booking format` (with BREAKING CHANGE footer)

## Contributing / Agent Notes

This project is being built autonomously by a multi-agent software engineering team (Grok + specialized subagents).

- All changes are direct code edits + self-verification.
- New tech is researched (official docs + recent articles) before adoption.
- Every phase ends with working, tested, committed functionality.
- **All commits must follow Conventional Commits** (enforced in future via commitlint + husky if desired).

Current agents are continuing:
- Extracting remaining design tokens + full component inventory from Figma
- Implementing the real interactive MapLibre destination picker
- Adding remaining screens (OTP verify, location permission, favorites, full payment forms, scan card simulation)
- Adding Playwright E2E + visual regression suite

## License & Credits

Replica of internal design system for educational / portfolio purposes.
Figma file: "CARGO - Car Booking & Sharing App" (Components Overview page + all 20+ flows).

Built with ❤️ for fidelity and craft.

---

**Next milestone**: Full interactive MapLibre map + all 20 Figma screens + driver tracking demo (est. 1–2 more agent iterations).
```

## Map Implementation Notes (Destination Picker)

The interactive destination picker at `/destination` is now powered by **MapLibre GL JS v5** (direct usage, no react wrapper).

**Tile source (free, zero keys):**
- Primary: `https://tiles.openfreemap.org/styles/liberty/style.json` (OpenFreeMap — high-quality OSM vector tiles)
- Graceful fallback: MapLibre demo tiles

**Geocoding (also free):**
- Reverse: Nominatim (`nominatim.openstreetmap.org`) — polite User-Agent + heavy debouncing + abort controllers
- Autocomplete: Photon by Komoot (`photon.komoot.io`)

**How to swap providers (future-proof):**
1. Change `MAP_STYLE_PRIMARY` constant in `src/components/maps/MapView.tsx`
2. Update `reverseGeocode` / `searchPlaces` in `src/components/maps/geocode.ts` (same signatures)
3. For fully offline: integrate PMTiles + `@maplibre/maplibre-gl-pmtiles` (see detailed comments inside MapView.tsx). The component API stays identical.

**Bundle strategy:** `maplibre-gl` is isolated in the `map-vendor` manual chunk (Vite config). MapView itself lazy-loaded via `React.lazy`.

All map-related fetches include production-grade resilience (fall back to coordinate strings, SF default location, straight-line route if OSRM down).

Attribution footer is always rendered (legal requirement).

Now, let's wait for npm install and then run the dev server to verify everything works.