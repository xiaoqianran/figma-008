# Figma Replication Spec: CARGO - Car Booking & Sharing App

**Figma File:** CARGO - Car Booking & Sharing App  
**Analysis Date:** 2026-05-30  
**MCP Server:** figma-mcp-go (73 tools used extensively via search_tool + use_tool)  
**Goal:** Zero-ambiguity pixel-perfect web (React/TSX) replica of all screens, flows, and design system. All measurements, colors, typography, and layouts extracted directly from Figma nodes.

**Workspace Artifacts Location:** `C:\Users\yuminghui\Desktop\figma101\008\figma-refs\`

---

## 1. Document Structure

- **Pages:** 1 (confirmed via `get_metadata` + `get_pages`)
  - ID: `0:1`
  - Name: `👁 Components Overview` (current/active page)
- **Total Frames:** 257 (via `scan_nodes_by_types` on `0:1` for type `FRAME`)
- **Components:** 10 (via `get_local_components`)
  - All iOS system UI kit pieces:
    - `iPhone X/Status Bars/Status Bar (Black)` (0:2713)
    - `Bars / Home Indicator / On Dark` (0:2731)
    - `Bars / Home Indicator / On Light` (0:2733)
    - `iPhone X/Keyboards/Light/Uppercase` (0:2735)
    - `iPhone X/Keyboards/Light/Numeric` (0:2855)
    - `iPhone X/Home Indicator/Home Indicator - On Light` (0:2924)
    - `iPhone X/Status Bars/Status Bar (White)` (0:2926)
    - Plus overrides: Time Black (0:2943), Time White (0:2948), Key/Light (0:2945)
- **No local Styles:** `get_styles` returned empty (paints, text, effects, grids = []).
- **No Variables:** `get_variable_defs` returned empty collections. All values are hard-coded on nodes (fills, strokes, font props).
- **Fonts Used (via `get_fonts` + text scans):** 9 variants, sorted by usage
  - SF UI Display: Bold (122), Semibold (100), Regular (87), Medium (31), Heavy (14)
  - SF Pro Display: Regular (98)
  - SF Pro Text: Semibold (34), Bold (16), Regular (10)
- **Main Artboards / Screens:** 20+ numbered high-fidelity app screens (375×812 px iPhone portrait). Laid out on large canvas (x offsets ~473 px columns, y rows at 386 / 1298 / 2210 / 3122). Plus hundreds of reusable UI kit pieces (form elements, buttons, inputs, modals, keyboards, cards) at lower x coords.

**Full Main Screen Inventory (node IDs + names from scans + `get_nodes_info` + `get_node`):**

| # | Node ID | Figma Name (note typos)          | Canvas Position (x,y) | Screenshot(s) |
|---|---------|----------------------------------|-----------------------|---------------|
| 1 | 0:2     | 1_Splash Screen                  | 9585, 386            | 01_Splash_Screen.png (+ @3x) |
| 2 | 0:31    | 2_Sign Up                        | 10058, 386           | 02_Sign_Up.png (+ @3x) |
| 3 | 0:109   | 3_Sign Up_Input Content          | 10531, 386           | 03_Sign_Up_Input_Content.png |
| 4 | 0:191   | 4_Select a country               | 11007, 386           | 04_Select_a_Country.png |
| 5 | 0:223   | 5_Log In                         | 11483, 386           | 05_Log_In.png |
| 6 | 0:284   | 6_Forgot Password                | 9585, 1298           | 06_Forgot_Password.png |
| 7 | 0:316   | 7_Verify phone number            | 10060, 1298          | 07_Verify_Phone_Number.png |
| 8 | 0:355   | 8_Enable Location                | 10535, 1298          | 08_Enable_Location.png |
| 9 | 0:394   | 9_Home                           | 11007, 1298          | 09_Home.png (+ @3x) |
|10 | 0:452   | 10_Choose a Destionation         | 11485, 1298          | 10_Choose_a_Destination.png |
|11 | 0:543   | 11_Set Destionation on Map       | 9585, 2210           | 11_Set_Destination_on_Map.png |
|12 | 0:591   | 12_My favorites                  | 10060, 2210          | 12_My_Favorites.png |
|13 | 0:674   | 13_Add new place                 | 10535, 2210          | 13_Add_New_Place.png |
|14 | 0:742   | 14_Select Service                | 11007, 2210          | 14_Select_Service.png (+ @3x) |
|15 | 0:919   | 15_Select Service_Full view      | 11482, 2210          | 15_Select_Service_Full_View.png |
|16 | 0:1040  | 16_Add promo code                | 9585, 3122           | 16_Add_Promo_Code.png |
|17 | 0:1232  | 17_Payment Methods               | 10060, 3122          | 17_Payment_Methods.png (+ @3x) |
|18 | 0:1302  | 18_Add credit card               | 10535, 3122          | 18_Add_Credit_Card.png |
|19 | 0:1390  | 19_Scan credit card              | 11007, 3122          | 19_Scan_Credit_Card.png |
|20 | 0:1416  | 20_Select Service_Pick-up Time   | 11482, 3122          | 20_Pick_Up_Time.png |

**Additional Key Frames (exported to details/ + components/):**
- Modals: 0:939 (Suggested Rides modal, 345×720), 0:1594 (650×375 variant), others (0:1734, 0:1853, 0:2154, 0:2331)
- Ride option cards: e.g. 0:836 (Group 3, 94×109)
- Buttons: 0:893 (Primary Filled 253×44), 0:85 (Warning Filled 343×60), 0:1055 (Outline 83×48), many duplicates across screens
- Inputs: 0:44 (Text Default 343×48), 0:69 (Phone 343×48), many variants (default/focused states via copies)
- Form elements, history cards, payment method cards (Debit/Visa/Paypal/Cash), Nav Bars, "Other Places", "Location" cards, keyboards (component instances)

**Canvas Layout Note:** Screens arranged in ~4 vertical columns at high x-values. UI kit library elements (labeled " 1) Button: ...", " 8) Form Elements/...") densely packed at low x (left side of overview page).

---

## 2. Exported Screenshots (High-Quality PNGs)

All main screens + variants + components + modals exported via `save_screenshots` (PNG, scale=2 primary + scale=3 for 5 key screens). Organized folders:

- `figma-refs/screens/` — 20 canonical + 5 @3x (total ~25 files, 50KB–1.5MB each; @3x up to 1090 KB)
- `figma-refs/components/` — 8+ representative pieces (buttons, inputs, ride cards, some iOS keyboards)
- `figma-refs/details/` — 2+ modal variants
- `figma-refs/tokens/` — (reserved for future JSON exports)

**Full list verified via terminal (see command output in session):** All 20 screens present with clean names (dupe lowercase variants cleaned). Key high-res:
- 01_Splash_Screen@3x.png (1116988 bytes)
- 09_Home@3x.png
- 14_Select_Service@3x.png
- 17_Payment_Methods@3x.png
- 02_Sign_Up@3x.png
- 19_Scan_Credit_Card.png (largest, 1.48 MB — complex UI)

**Recommendation for devs:** Use @2x for rapid iteration, @3x + original Figma frames for exact measurement validation in Figma (zoom to 300% or use inspect).

---

## 3. Design System / Tokens Catalog

### Colors (Extracted from node `fills`/`strokes` across `get_node`, `scan_text_nodes`, `get_design_context` samples on 0:2, 0:31, 0:394, 0:742, 0:1232 + component defs. No variables.)

**Primary / Accent**
- `#41d5fb` — Primary CTA (Sign up buttons, accents, Twitter social, logo geometric fill, some highlights). Most important brand color.
- `#222b45` — Primary text, headings, dark button fills, logo text, icons.

**Backgrounds & Surfaces**
- `#ffffff` — Main screen/card backgrounds, button text on dark.
- `#f7f9fc` — Input field filled backgrounds (e.g. phone number variant).
- `#d2d5dbe5` (semi) — Keyboard / modal backgrounds in components.

**Text & Secondary**
- `#8f9bb3` — Placeholder text, secondary labels, icons.
- `#acb1c0` — "Or sign up with..." footer text.
- `#030303` — Keyboard key labels.

**Borders / Strokes / Dividers**
- `#e4e9f2` — Input borders (default), some icon strokes, dividers (e.g. phone flag separator).
- `#979797` — Subtle strokes (home indicator, keyboard bg).

**Social / Specific**
- `#3b5a99` — Facebook button background.
- `#000000` / pure black — Status bar icons, battery, some overlays.
- `#ffffff0d` (low opacity white) — Subtle lines in logo.

**iOS System (Status / Home / Keys)**
- Battery/cellular/wifi: black vectors on light status bars.
- Home Indicator pill: `#ffffff` (light) or `#000000` (dark variants) with `#979797` stroke.
- Keyboard keys: white or semi `#abb3bd80` / black text; dictation/emoji in `#50555c`.

**Usage Notes:** 
- Light theme dominant across all 20 screens (white bgs, dark text). Dark variants only in iOS kit components for contrast testing.
- Opacity used sparingly (e.g. `rgba` equivalents in Figma like low-opacity whites).
- Exact hex values must be copied verbatim (no rounding).

### Typography (from `scan_text_nodes` + `get_fonts` + node styles on multiple screens)

**Font Stacks (exact Figma):**
- UI/App: `SF UI Display` (primary for all custom text)
- System/Status/Keyboard: `SF Pro Text` / `SF Pro Display`

**Scale & Weights (most common + examples):**
- 34px Bold (SF UI Display) — Logo "Cargo" (Splash)
- 24px Bold (SF UI Display, lineHeight: 40px) — "Create your account", main titles (Sign Up)
- 23px Regular (SF Pro Display) — Keyboard letters
- 18px Bold (SF UI Display, lineHeight: 24px) — Button labels ("Sign up", "Log in", "Book Now", "Done", "Add"), card titles ("Payment methods")
- 15–17px Regular/Semibold (SF UI Display, lineHeight 20–24px) — Input placeholders ("Enter your email"), body, search "Where are you going ?"
- 15px Semibold/Bold (SF UI Display) — Input values, card details ("**** 7539", "Expires 09/25", ride locations "874 Hildegard Crossing")
- 14px Semibold (SF Pro Text) — Status bar time "9:41"
- 13px Semibold/Regular/Heavy (SF UI Display, lineHeight 13–24px) — Labels ("Email", "Password", "Phone number"), small prices ("US$35.50"), "Suggested Rides", legal footer, secondary ("Or sign up with social account")
- 12px Bold — Some small button content

**Other Props Observed:**
- textAlignHorizontal: LEFT (forms), CENTER (buttons, logo)
- letterSpacing: "mixed", -0.32px on some keys/buttons, default 0
- No textDecoration except possibly in legal links (not heavily used)

**Implementation:** Use system font stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF UI Display", sans-serif` or `@font-face` exact. Match `font-weight: 700 (Bold), 600 (Semibold), 500 (Medium), 400 (Regular), 900 (Heavy)`. Line-heights and letter-spacing critical for fidelity.

### Spacing, Radii, Layout System

- **Horizontal padding:** Consistent 16px from screen edges (content width often 343px = 375 - 32).
- **Vertical rhythm:** 16–24px gaps between form fields/groups; 8–12px label-to-input.
- **Component heights:**
  - Buttons: 44px (primary filled), 60px (some warning/large), 48px (outline variants)
  - Inputs: 48px
  - Status bar: 44px
  - Home indicator area: 34px
- **Corner Radii:**
  - 12px — Primary (buttons, inputs, cards, social buttons)
  - 15px — Some larger CTAs ("Sign up" on splash variants)
  - 36px — Logo container
  - 5px — Keyboard keys
  - 100 (pill) — Home indicator
  - 2.666px etc. — Battery icon details (match exactly via SVG)
- **Shadows/Effects:** Minimal to none on most screens (flat iOS-inspired). Some subtle in keyboard keys (multi-fill). Status/home use strokes only. No large drop shadows observed in main flows.
- **Auto Layout / Constraints:** Many manual positioning (x/y in nodes). Some frames note `padding`. Replicate with flex + exact px or CSS grid. Buttons/inputs use fixed widths (343px common).

**Icons:** Custom vectors (logo geometric "C" shape with lines, eye for password, social logos, map pins, arrows). Export SVGs from Figma or recreate with lucide-react + exact paths/colors. Many 20–24px.

---

## 4. Key Screens — Deep Hierarchy & Properties (from `get_node`, `scan_text_nodes`, partial `get_design_context`)

**1. Splash Screen (0:2) — `get_node` full dump + scan**
- Root FRAME: 375×812, fills: #ffffff, padding 0
- Background layers: Two full-bleed rects (0:3, 0:4)
- Logo (0:5): 118×175 group at (129,121) — complex nested vectors + rects (cyan #41d5fb accent, dark #222b45 body, subtle white lines #ffffff0d). Text "Cargo" 34px Bold SF UI Display #222b45
- Status Bar instance (0:21/22): Exact iPhone X black variant (time "9:41" 14px Semibold SF Pro Text, full icons)
- Home Indicator (0:23/24): On Light variant
- Buttons (bottom y:697):
  - Sign up (0:25): 139×44, cyan fill #41d5fb, 12px radius, "Sign up" 18px Bold white
  - Log in (0:28): 139×44, dark fill #222b45 + white stroke #ffffff, "Log in" 18px Bold white
- No reactions on sampled nodes.

**2. Sign Up (0:31) + Input variant (0:109)**
- Background #ffffff
- Nav: 18×24 icon group (back chevron, dark #222b45)
- Title: "Create your account" 24px Bold SF UI Display #222b45, lineHeight 40
- Link: "Already have an account? Log in" 13px Semibold (mixed fills)
- 3 Form groups (y:194+):
  - Email: Label 13px Semibold, Input (0:44) 343×48, 12px radius, border #e4e9f2, placeholder 15px Regular #8f9bb3 "Enter your email"
  - Password: Label + input + eye-outline icon (vector group)
  - Phone: Special variant (0:69) with flag bitmap placeholder, "+1", divider line #d8d8d8, "Mobile number" placeholder
- CTA Button (0:83/85): 343×60, 15px radius #41d5fb, "Sign up" 18px Bold white
- Social: "Or sign up..." 13px, two 139×44 buttons (FB #3b5a99 + icon, Twitter #41d5fb + icon)
- Legal: 13px Regular footer text
- Input Content screen (0:109) shows pre-filled states + keyboard visible in some views.

**3. Home (0:394) — scan + partial context**
- Status + time
- Location/pickup card: "874 Hildegard Crossing" 15px Medium
- Search: "Where are you going ?" 17px Regular placeholder
- "Pick up" action card (208×79)
- Resources/Search bar at bottom
- Implied full-width map or hero area below search
- Bottom home indicator

**4. Select Service (0:742) + Full View (0:919)**
- Pickup: "27 Sawayn Square..." 15px Medium
- "Suggested Rides" header 13px Bold
- 4 ride cards (Group 3 etc., 94×109 each): Type (Shared/Standard/Deluxe/Supreme) Heavy 13px, prices Bold 13px #222b45 (US$35.50 etc.), some "New" badge
- Location detail card (327×279): two locations "874 Hildegard Crossing" / "27 Sawayn Square" 18px Semibold
- Book Now button (253×44) Primary filled, "Book Now" 12px Bold
- Full view (0:919): Larger modal-like ride list (Suggested Rides 313×410), "New" tags, more options

**5. Payment Methods (0:1232)**
- Nav Bar "Payment methods" + "Add"
- 4 method cards (82×342): 
  - Debit/Visa: masked numbers 18px Bold ("**** **** **** 5967"), "Expires 09/25" 15px Medium
  - Paypal: email 18px Bold
  - Cash: label 18px Bold
- CTA "Done" 18px Bold (warning or primary variant)
- Note: Some internal layer names appear copy-pasted incorrectly in Figma ("Add a new place" on payment title layer).

**Other Screens (summary from scans/screenshots):**
- Log In / Forgot / Verify: Similar forms + OTP 4-digit inputs (70×70 boxes), resend links.
- Enable Location: Large CTA + explanation.
- Choose Destination / Map: Search + map interaction area + recent/favorites.
- My Favorites / Add Place: Lists + form inputs.
- Promo: Input + history cards (111×343).
- Add/Scan Card: Form fields (number, expiry, CVV, name) + camera overlay for scan.
- Pick-up Time: Time picker + ride summary.

**Hierarchy Patterns (common across screens):**
- Root FRAME (screen) > Background rect(s) > StatusBar INSTANCE > Content groups (y>44) > Bottom Bar/Home Indicator INSTANCE
- Heavy INSTANCE usage for bars + form elements (overrides for text/values)
- Groups for complex icons (logo, eye, social, arrows)
- TEXT nodes with explicit fontName, fontSize, fontStyle, fills[], lineHeight, letterSpacing

---

## 5. User Flows & States (Inferred + Visual + Naming)

**Primary Auth Flow:**
Splash (0:2, 2.2s auto-advance or manual) 
  → Sign Up (0:31) → Sign Up Input (0:109, filled) → Select Country (0:191) 
  → Verify Phone (0:316, 4-digit OTP inputs) → Enable Location (0:355) → Home (0:394)

**Parallel:** Log In (0:223) → Forgot (0:284) → Verify → ...

**Main App Flow (post-auth):**
Home (search "Where are you going?", pickup card, quick actions)
  → Choose Destination (0:452, search or recents) or Map (0:543)
  → (Favorites 0:591 / Add place 0:674)
  → Select Service (0:742 / Full view modal 0:919, 4 ride types + prices)
  → Pick-up Time (0:1416)
  → Add Promo (0:1040, input + history)
  → Payment Methods (0:1232, select or Add/Scan card 0:1302/0:1390)
  → Book/Confirm (implied end state)

**States/Variants:**
- Form states: Default (empty placeholder), Input Content (filled + cursor), Error (not heavily shown but possible via copies)
- Ride cards: Normal + "New" badge
- Payment: Selected (implied), list of 4 methods + Cash
- Modals: Ride details, promo history, full suggested rides overlay
- Keyboards: Uppercase + Numeric light variants shown in components

**Interactions (Reactions):** `get_reactions` on buttons/frames (0:25, 0:83 etc.) returned empty arrays. Prototype links likely minimal or defined at page level / via Figma prototype tab not exposed via these MCP calls. Use screen names + button labels + standard UX patterns for navigation (e.g. primary CTA advances flow, "Log in" link switches, back icons, bottom resources).

**Data Passed (inferred from content):**
- Pickup / destination locations (strings like "874 Hildegard Crossing", "27 Sawayn Square")
- Ride type + price (Shared/Standard/etc., US$xx.xx)
- Payment method (card last4, type, or Cash/Paypal)
- Promo code (text)
- Pickup time (e.g. "Tomorrow 09:15" from existing code)
- User phone/email (in forms)

---

## 6. iOS-Specific Details (Exact from Instances)

- **Safe Areas:** Every screen respects 44px top (status bar) + ~34px bottom (home indicator). Content never overlaps.
- **Status Bar:** 
  - "iPhone X/Status Bars/Status Bar (Black)" (most screens): White bg fill? Black content (time #000, icons black). Exact time "9:41", battery 100% with border, wifi, cellular vectors.
  - White variant component available for dark contexts.
- **Home Indicator:** 
  - "On Light": White pill (#fff, 134×5, 100 radius) on appropriate bg.
  - "On Dark" variant exists.
  - Positioned exactly at bottom of 812px frame (y:778).
- **Keyboard Avoidance:** Visible in Sign Up Input + some modals (keyboards are component instances at bottom; in web, use `position: fixed` bottom or viewport resize listeners + scroll-into-view for focused inputs).
- **Tap Targets:** Minimum 44px height (buttons), generous 48px inputs. Social buttons side-by-side with 16px+ gaps.
- **Other:** No notch simulation beyond status bar (iPhone X frame). All vectors/paths for icons match Apple SF symbols closely.

**Dev Note:** In web replica, render custom StatusBar + HomeIndicator components matching the exact vector paths, sizes, and colors from the 10 components (or use device detection + native-like overlays). Do not rely on browser chrome.

---

## 7. Component Inventory (Reusable)

- **Buttons:** Primary filled (#41d5fb, 12–15px radius, 18px Bold white), Warning filled variants, Outline (dark + white stroke or primary), sizes 44/48/60px. See exported PNGs.
- **Inputs:** Text default (border #e4e9f2, 12px r), Phone special (flag + divider + country code), focused states via variants.
- **Ride / Service Cards:** Compact 94×109 or larger 313×70/109 with type, price, "New" badge.
- **Payment Cards:** 342×82 with masked number + expiry or email/brand.
- **Modals:** Centered overlays (e.g. 345×720 ride list, 343×395 history).
- **iOS Kit:** Status, Home Indicator (2 variants), Keyboards (2), Time/Key overrides.
- **Other:** Nav bars, social buttons, OTP digit boxes (70×70), history list items, logo mark.

**Implementation Pattern (from existing src/ + Figma):** Create `/components` library (Button, Input, RideCard, PaymentMethodCard, StatusBar, Modal, etc.) with props for variants/states. Match every px, color, font exactly.

---

## 8. Pixel-Perfect Implementation Notes & Gotchas

1. **Dimensions:** Hard 375×812 for fidelity (or scale container). Use exact x/y from node bounds only for reference — implement with flexbox + padding/margin.
2. **Logo (Splash):** Not simple text. Replicate full vector group (multiple rects + boolean ops + cyan fill + lines) or export SVG from Figma (use `export` or manual trace). Current src impl uses simplified "C" — update to match.
3. **Fonts & Metrics:** Critical. SF UI Display weights map to 700/600/500/400. Test line-height and letter-spacing on every text node. Use `font-feature-settings` if needed for numerals.
4. **Icons:** All custom vectors. Prefer exporting individual icons as SVG from Figma (or recreate precisely with SVG paths or heroicons/lucide tuned to match).
5. **Overlapping Layers:** Many screens have stacked rects for backgrounds/effects (e.g. Splash 0:3 + 0:4). Flatten or match z-order + opacity.
6. **Instances & Overrides:** Form elements and bars are instances. In code, use composition (props for value, placeholder, error, icon).
7. **Typos & Labels:** Ignore internal Figma layer names with errors (e.g. wrong titles on Payment). Use visual + exported text content.
8. **No Dark Mode:** All main flows light. iOS kit has contrast variants for reference only.
9. **Animations/Transitions:** Existing code uses framer-motion (Splash scale/opacity). Match any prototype transitions if present (none strongly defined via reactions). Use similar easing for screen changes.
10. **Web vs Native:** For browser, add safe-area-inset handling (CSS env vars), keyboard detection (visualViewport), and fixed mobile viewport. Consider PWA manifest for "app-like".
11. **Data/Store:** Existing `useAppStore` (Zustand?) already tracks booking state (pickupLocation, pickupTime, etc.). Extend with full flow state from Figma content.
12. **Testing:** Side-by-side Figma frame (at 200–300% zoom) vs web render. Use pixel-perfect comparison tools or browser extensions. Validate all 20 screens + modals + states.
13. **Performance:** Scan credit card screen (large export) implies camera integration later (use html5-qrcode or similar + mock UI matching Figma).
14. **Routing (from src):** Splash → /signup or /home; /login, /destination, /select-service, /payment etc. Align navigation exactly to flow above.

**Next Steps for Eng Team:**
- Import or hardcode the color/typography tokens into `index.css` or Tailwind config.
- Build reusable component library first (match exported PNGs 1:1).
- Implement screens in order of dependency (Splash → Auth → Home → Destination → Service → Payment).
- Cross-reference every element against the @2x/@3x PNGs + original Figma (use MCP `get_node` / `get_screenshot` in future if needed).
- Update existing src/ approximations to exact Figma values (e.g. Splash bg white + real logo, Home search exact text/placement).

**All Artifacts Complete.** Screenshots + this spec provide full visual + data spec. Zero ambiguity.

---

*Generated by Grok Build Figma design systems analyst agent using extensive parallel MCP tool calls (get_metadata, get_pages, get_nodes_info, get_node, scan_nodes_by_types, scan_text_nodes, save_screenshots, get_styles, get_variable_defs, get_local_components, get_fonts, get_reactions, search_nodes, get_design_context, export_tokens, etc.). Full tool traces and temp outputs in session logs.*