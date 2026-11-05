# Cyprus winter dining MVP plan

## Status

Planning only. Implementation is blocked pending the six product decisions in the brief. No product copy, visual direction, payments, delivery, bonus, or trust claims will be assumed.

## Reference review

The provided repository export is present in this workspace. Before UI design begins, inspect every referenced `code.html` and `DESIGN.md`, map it to the routes below, and record deviations or ambiguous content in `SOURCE_NOTES.md`.

## Route plan

| Route | Purpose | Reference source |
| --- | --- | --- |
| `/discover` | Deals, venue filters, list/map preview, bookmarks | `home_discover_cypriot_hearth_radar*` |
| `/discover` booking sheet | Shared accessible reservation dialog | `home_discover_reservation_modal_open` |
| `/taste` | Editorial destination and reservable dishes | `kouzina_cultural_taste_unified_dining`, `cypriot_hearth_living`, `warm_mediterranean_hearth` |
| `/kouzina` | Delivery and cart, only if approved | `kouzina_cultural_taste_unified_dining` |
| `/pass` | Wallet, top-up, and account-aware pass | `pass_wallet_my_pass_1`, `pass_wallet_my_pass_2` |
| `/pass/ledger` | Wallet ledger tab | `pass_wallet_my_pass_1` ledger reference |
| `/pass/ledger/:id` | Receipt details | `to_patriko_taverna_post_dining_settlement_receipt` |
| `/events` | Filterable events and reservations | `winter_events_curated_hearthside_experiences` |
| `/partner` | Partner sign-up/contact MVP stub | `to_patriko_taverna_partner_shift_dashboard_dietary_synced` |

## Build slices

1. Project foundation: Vite, strict TypeScript, local Tailwind, Router, lint/test/e2e tooling, tokens, shell, responsive safe areas.
2. Domain: fixture-only data, domain types, Nicosia date utilities, wallet reducer/store, booking guard, shared controls.
3. Discover: filters, counts, map preview, saved venues, states, and accessibility.
4. Shared booking sheet: focus management, payment paths, guard, wallet debit, ledger write, feedback states.
5. Pass: wallet hero, tabs, top-up workflow, ledger and receipt routes, account-aware state.
6. Events: derived dates/prices, filters, capacity-aware reservation entry.
7. Taste: verified-only labels, editorial destination, dishes and reservation actions.
8. Partner: MVP sign-up/contact and explicit Phase 2 dashboard backlog.
9. Optional Kouzina: only if delivery is approved; search, cart, checkout stub, delivery facts.
10. Verification and documentation: unit, Playwright, axe, responsive screenshots, Lighthouse, source/image/design/fix/readme documentation.

## Planned component boundaries

- `AppShell`, `Header`, `WalletBalance`, `BottomNav`, `SubpageHeader`
- `BookingSheet`, `TopUpSheet`, `Dialog`, `Toast`, `Receipt`
- `VenueCard`, `DealCard`, `EventCard`, `DishCard`, `FilterChips`, `MapPreview`
- `PassTabs`, `LedgerList`, `PartnerSignupForm`
- `useAppStore` plus date, money, booking, and wallet utilities

## Planned files

- `src/domain/types.ts`, `src/fixtures/*`, `src/lib/{dates,money,booking,wallet}.ts`
- `src/store/app-store.ts`, `src/components/*`, `src/pages/*`, `src/routes/*`
- `src/test/*`, `e2e/*`, `playwright.config.ts`, `vitest.config.ts`
- `DECISIONS.md`, `SOURCE_NOTES.md`, `DESIGN_SYSTEM.md`, `IMAGES.md`, `FIX_LOG.md`, `README.md`, `docs/screens/*`, `BACKLOG.md`

## Validation gates

- Strict build and lint with no errors or new warnings.
- Unit coverage for date/weekday derivation, booking guard, and wallet credit/debit.
- Playwright modal, filtering, receipt, and overspend checks; axe AA scans on every route.
- Screenshots at 390×844, 768×1024, and 1440×900 for each slice; responsive overflow/safe-area checks.
- Lighthouse mobile targets: performance 85+ and accessibility 95+.
