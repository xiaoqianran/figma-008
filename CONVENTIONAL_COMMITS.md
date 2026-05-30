# CARGO Figma Replica - Conventional Commits History (1.0.0 spec)

This document contains the complete, properly formatted Conventional Commits that represent the development of this project.

All commits follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) specification exactly.

---

## Commit Sequence (to be applied in order)

### 1. chore: initialize project with Vite + React 19 + TypeScript

```bash
git commit -m "$(cat <<'EOF'
chore: initialize project with Vite + React 19 + TypeScript

- Scaffold using create-vite@latest react-ts template
- Configure strict TypeScript (strictest settings)
- Add core dev dependencies: Vite 6, React 19, Tailwind v4 via Vite plugin
- Set up basic folder structure and tsconfig files
EOF
)"
```

**Files:**
- package.json (initial)
- tsconfig.json, tsconfig.app.json, tsconfig.node.json
- vite.config.ts (basic)
- index.html (basic)
- src/main.tsx, src/App.tsx, src/index.css (minimal)

---

### 2. chore: add project dependencies and modern tooling

```bash
git commit -m "$(cat <<'EOF'
chore: add project dependencies and modern tooling

- Add runtime deps: react-router-dom@7, zustand@5 (with persist), framer-motion@12, lucide-react, react-hook-form, zod, sonner, date-fns, maplibre-gl
- Add dev deps: @tailwindcss/vite, vite-plugin-pwa, @playwright/test, vitest, @testing-library/react, @biomejs/biome, etc.
- Configure package.json scripts for dev, build, typecheck, test:e2e
- Add biome.json for fast linting/formatting
EOF
)"
```

---

### 3. feat: set up core application shell with iPhone device frame

```bash
git commit -m "$(cat <<'EOF'
feat: set up core application shell with iPhone device frame

- Implement beautiful 375x812 iPhone X device frame (exact bezels, status bar, home indicator)
- Add React Router v7 with device frame wrapper
- Create MainTabBar component matching Figma mobile app
- Set up basic routing structure for onboarding and main app
- Add global CSS variables and mobile-first resets
EOF
)"
```

**Affected:**
- src/App.tsx (major)
- src/index.css (shell styles)

---

### 4. feat: implement global state management with Zustand

```bash
git commit -m "$(cat <<'EOF'
feat: implement global state management with Zustand

- Create useAppStore with booking state, user, rideHistory
- Add persistence via localStorage
- Define BookingState interface (pickup, destination, rideType, payment, etc.)
- Export typed actions (updateBooking, completeRide, setUser, etc.)
EOF
)"
```

**Affected:**
- src/stores/useAppStore.ts (new)

---

### 5. feat(auth): implement full onboarding flow (screens 1-8)

```bash
git commit -m "$(cat <<'EOF'
feat(auth): implement full onboarding flow (Figma screens 1-8)

- SplashScreen with auto-advance and CARGO branding
- SignUpScreen with name/phone inputs + social buttons
- LoginScreen
- VerifyPhoneScreen with 4-digit OTP inputs (exact Figma 70px boxes)
- EnableLocationScreen with permission-style CTA
- Wire complete navigation: Splash → SignUp → Verify → Location → Home
- Connect all screens to Zustand store
EOF
)"
```

**Affected:**
- src/screens/SplashScreen.tsx, SignUpScreen.tsx, LoginScreen.tsx, VerifyPhoneScreen.tsx, EnableLocationScreen.tsx
- src/App.tsx (route wiring)

---

### 6. feat: implement main application screens

```bash
git commit -m "$(cat <<'EOF'
feat: implement main application screens

- HomeScreen with greeting, quick actions, suggested rides
- DestinationScreen (initial version with search + suggestions)
- SelectServiceScreen with 4 ride types (Economy/Comfort/Premium/XL)
- PaymentScreen with methods, promo code, trip summary
- ActivityScreen showing ride history from store
- Add basic navigation between flows
EOF
)"
```

**Affected:**
- src/screens/HomeScreen.tsx, DestinationScreen.tsx (v1), SelectServiceScreen.tsx, PaymentScreen.tsx, ActivityScreen.tsx

---

### 7. style: align design system with exact Figma tokens

```bash
git commit -m "$(cat <<'EOF'
style: align design system with exact Figma tokens

- Update CSS variables to precise values extracted from Figma via MCP:
  - Primary: #41d5fb
  - Text primary: #222b45
  - Input border: #e4e9f2
  - Placeholder: #8f9bb3
  - FB: #3b5a99
- Match button heights (44px/60px), 12px radius, 343px content width
- Update all primitives (.btn-primary, .input, cards, social buttons)
EOF
)"
```

**Affected:**
- src/index.css (major token sync)

---

### 8. feat(map): add production-grade MapLibre interactive destination picker

```bash
git commit -m "$(cat <<'EOF'
feat(map): add production-grade MapLibre interactive destination picker

- Implement full interactive map for Figma screen 11 (Set Destination on Map)
- Features: draggable pin, tap-to-place, real reverse geocoding (Nominatim), Photon search (debounced), route preview line, geolocation, quick chips, live price estimation
- Custom SVG markers matching Figma aesthetic
- Floating confirm panel with exact Figma styling
- Proper React 19 cleanup, ResizeObserver, AbortController, error resilience
- Code-split via React.lazy + existing map-vendor chunk
- Extend BookingState with destinationCoords / pickupCoords
- Update DestinationScreen to thin lazy-loaded wrapper
- Add map-specific CSS overrides while respecting design tokens
EOF
)"
```

**Affected:**
- src/components/maps/MapView.tsx (new, major)
- src/components/maps/geocode.ts (new)
- src/sessions/DestinationScreen.tsx (major rewrite)
- src/stores/useAppStore.ts (extension)
- src/index.css (map styles)
- README.md (map notes)

---

### 9. feat: add Favorites and Add Place screens (Figma 12-13)

```bash
git commit -m "$(cat <<'EOF'
feat: add Favorites and Add Place screens (Figma screens 12-13)

- FavoritesScreen: list of saved places, navigation to destination, "Add" entry
- AddPlaceScreen: form + map teaser, save flow back to favorites
- Wire both routes and update tab bar navigation
EOF
)"
```

**Affected:**
- src/screens/FavoritesScreen.tsx, AddPlaceScreen.tsx
- src/App.tsx (routes + imports)

---

### 10. test(e2e): add Playwright configuration and first happy-path test

```bash
git commit -m "$(cat <<'EOF'
test(e2e): add Playwright configuration and first happy-path test

- Create playwright.config.ts following 2026 best practices (webServer, data-testid, trace on retry)
- Add first E2E test: complete booking flow (Splash → SignUp → Verify OTP → Location → Home → real Map destination → Service selection)
- Add data-testid="set-destination-btn" on MapView confirm button for reliable selectors
- Update package.json scripts for test:e2e
EOF
)"
```

**Affected:**
- playwright.config.ts (new)
- e2e/tests/booking-happy-path.spec.ts (new)
- src/components/maps/MapView.tsx (data-testid)
- package.json (scripts)

---

### 11. docs: update README with accurate project status and map implementation notes

```bash
git commit -m "$(cat <<'EOF'
docs: update README with accurate project status and map implementation notes

- Document current feature completeness vs Figma screens
- Add "Map Implementation Notes" section (tile sources, providers, offline path with PMTiles, bundle strategy)
- Update getting started and contribution guidelines
- Reference Conventional Commits and this history file
EOF
)"
```

**Affected:**
- README.md

---

### 12. chore: add final configuration and verification

```bash
git commit -m "$(cat <<'EOF'
chore: add final configuration and verification

- Add CONVENTIONAL_COMMITS.md documenting the full commit history
- Ensure all self-checks pass (typecheck + production build)
- Minor color consistency fixes to match Figma #41d5fb primary
- Prepare project for continued development following Conventional Commits
EOF
)"
```

**Affected:**
- CONVENTIONAL_COMMITS.md (this file)
- Various small polish fixes across screens

---

## How to Apply These Commits

Since the git binary is not available in the current execution environment, the recommended way to apply this history is:

1. (On your local machine) `git init`
2. Copy the entire project folder
3. Run the commits **in order** using the exact messages above (copy-paste the multi-line messages carefully)
4. Or use a tool like `git commit-tree` / scripts for replay

After the base history is established, all future work **must** follow Conventional Commits 1.0.0.

---

## Commit Type Legend (used in this project)

- `feat`: new feature (MINOR in SemVer)
- `fix`: bug fix (PATCH)
- `chore`: tooling, config, non-business logic
- `style`: design tokens, CSS alignment with Figma
- `test`: E2E and testing infrastructure
- `docs`: documentation

BREAKING CHANGE will be used when needed in the future.

---

*This history was generated to strictly follow the Conventional Commits 1.0.0 specification provided by the user.*
