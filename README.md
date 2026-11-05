# Troo — Cyprus Winter Dining Network

A mobile-first web application for winter culinary experiences, village hearths, and cultural dining in Cyprus (Limassol, Paphos, Larnaca, and Troodos).

---

## 1. Quick Start & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# The app will be available at http://localhost:5173 (or http://127.0.0.1:5173)

# Build for production with strict TypeScript check
npm run build

# Run linter
npm run lint

# Run unit tests (Vitest)
npm run test

# Run end-to-end integration tests (Playwright)
npm run test:e2e

# Run automated accessibility checks (axe-core)
npm run test:a11y
```

---

## 2. Product Decisions in Effect

The following decisions were confirmed by the Product Owner and are codified in `DECISIONS.md`:

1. **Brand Name:** **Troo** — Applied consistently across headers, logos, pass cards, receipts, and copy.
2. **Color Palette:** **Terracotta & Cream (Stitch System)**:
   - Primary: `#9A4A3A` (Warm Terracotta / Fired Clay)
   - Canvas: `#FBF5EE` (Warm Sandstone Cream)
   - Text Primary: `#2B2118` (Espresso Black, passes AAA on canvas)
   - Accent Olive: `#4F5B45`
   - Accent Amber: `#F3D9A0`
3. **Delivery (Kouzina):** **In Scope for MVP** — Full `/kouzina` delivery destination with search, menu items (delivery fee, min order, prep time), add-to-cart stepper, sticky cart bar, and checkout dialog.
4. **Tap to Pay:** **Web QR Code Handoff** — Mobile-friendly QR code modal for table redemption; hardware NFC was removed.
5. **Marketing Claims:** **Excised** — Unsubstantiated claims ("zero commission", "cryptographically signed ledger", "Limassol Guild funding") removed in favor of honest culinary copy.
6. **Wallet Top-Up Bonus:** **10% Credit Bonus** — Every credit top-up receives an instant 10% credit bonus (+€2.50 on €25, +€5 on €50, +€10 on €100).

---

## 3. Route to Reference Folder Mapping

| Route | Destination / Feature | Source Reference in `NielHitesh001/App_prototype_02` |
|---|---|---|
| `/discover` | Table discovery, filters (`All`, `Fireplace`, `Deals`, `Quiet`), deals carousel | `home_discover_cypriot_hearth_radar` |
| `/discover` (Map) | Static accessible map preview with external launch | `home_discover_cypriot_hearth_radar_interactive` |
| Shared Sheet | Accessible booking dialog with guest stepper & guard | `home_discover_reservation_modal_open` |
| `/taste` | Cultural heritage stories and reservable dishes | `kouzina_cultural_taste_unified_dining` |
| `/taste/story` | Editorial guide on slow clay oven cooking | `kouzina_cultural_taste_unified_dining` / `cypriot_hearth_living` |
| `/kouzina` | Hearth food delivery with search, cart, and checkout | `kouzina_cultural_taste_unified_dining` |
| `/pass` | Winter pass card, wallet balance hero, tabs, top-up modal | `pass_wallet_my_pass_1`, `pass_wallet_my_pass_2` |
| `/pass/table/:id` | Tonight's table reservation details with synced dietary alerts | `pass_wallet_tonight_s_table_details` |
| `/pass/ledger/:id` | Electronic transaction receipt | `to_patriko_taverna_post_dining_settlement_receipt` |
| `/events` | Curated workshops, wine tastings, and feasts | `winter_events_curated_hearthside_experiences` |
| `/partner` | Restaurant partner onboarding inquiry form | `to_patriko_taverna_partner_shift_dashboard_dietary_synced` (Phase 2 stub) |

---

## 4. Key Architectural Highlights

- **Vite + React 19 + TypeScript (strict mode):** Pure typed components with zero `any`.
- **Local Tailwind CSS v4:** Locally bundled utility styles without any runtime CDN dependencies.
- **Accessible Focus-Trapped Dialogs:** Compliant `role="dialog"` with `aria-modal="true"`, focus returns to trigger element, backdrop click dismiss, and Escape key listeners.
- **Dynamic Date & Weekday Formatting:** Uses `Intl.DateTimeFormat` with `timeZone: 'Europe/Nicosia'`. No hardcoded weekdays or fixed calendar years.
- **Booking Overspend Guard:** Real-time computation via `canBook(balance, total)`. Confirms disable and informs the user of the exact shortfall required when overspending.
- **Zero Google-Hosted Images:** All imagery sourced from royalty-free Unsplash photography with context-specific `alt` attributes (`IMAGES.md`).
- **Comprehensive Quality Gates:** 100% test pass on Vitest, Playwright e2e flows, and axe-core accessibility checks.

---

## 5. Project Deliverables

- `DECISIONS.md`: Authoritative record of confirmed product decisions.
- `SOURCE_NOTES.md`: Folder-by-folder audit notes against original exports.
- `DESIGN_SYSTEM.md`: Contrast ratios and WCAG AA/AAA verification table.
- `IMAGES.md`: Asset registry, source licensing, and alt-text policy.
- `FIX_LOG.md`: Defect resolution mapping for each audit finding.
- `BACKLOG.md`: Detailed Phase 2 roadmap (partner shift dashboard, Stripe/Viva payments, multi-device auth, nationwide expansion) with required data models and API endpoints.
- `docs/screens/`: High-resolution responsive screenshot pairs at 390×844, 768×1024, and 1440×900 across all destinations.
