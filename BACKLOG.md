# Phase 2 Product Backlog & Technical Specification

The following capabilities are planned for Phase 2 post-MVP launch. For each feature, the required data models and backend REST/GraphQL API specifications are defined below:

---

## 1. Restaurant Partner Shift Dashboard

Real-time back-of-house operations management for tavern managers and kitchen teams (as previewed in `to_patriko_taverna_partner_shift_dashboard_dietary_synced`).

### Core Features
- Live shift status toggle ("Service Active" / "Shift Closed").
- Real-time **"Hearth Lit"** fireplace toggle that broadcasts immediate atmospheric updates to consumer discovery feeds.
- Real-time cover count, gross revenue tracking, and open table availability.
- Guest booking schedule with synced dietary restrictions & allergen warnings (e.g. Gluten-Free, Shellfish, Nut allergy).
- Kitchen pacing and course delivery progress indicators.

### Data Fields
- `shiftId: string`
- `venueId: string`
- `serviceStatus: 'active' | 'paused' | 'closed'`
- `hearthLit: boolean`
- `activeCovers: number`
- `maxCapacity: number`
- `currentShiftRevenueEur: number`
- `reservations: Array<{ reservationId: string; tableNumber: number; partySize: number; timeSlot: string; dietaryNotes: string[]; status: 'seated' | 'confirmed' | 'completed' | 'cancelled' }>`

### Backend Endpoints
- `GET /api/v1/partner/venues/:venueId/shifts/current`: Retrieve live shift telemetry and table reservations.
- `PATCH /api/v1/partner/venues/:venueId/hearth`: Toggle fireplace status (`{ hearthLit: boolean }`).
- `PATCH /api/v1/partner/reservations/:reservationId/status`: Update seating progress (`{ status: 'seated' | 'completed' }`).
- `POST /api/v1/partner/venues/:venueId/shifts/close`: Reconcile shift revenue and generate end-of-day settlement.

---

## 2. Real Payment Gateway & Contactless POS Integration

Transition from simulated credit deductions and card stubs to real payment processing via Stripe / Viva Wallet (a prominent Cyprus/SEPA card acquirer).

### Core Features
- Direct SEPA card payments (Apple Pay, Google Pay, Visa, Mastercard).
- Automated wallet top-ups with instant credit allocation.
- In-venue QR code billing and table settlement.
- Configurable gratuity calculation and automated fiscal receipt generation under Cypriot tax law.

### Data Fields
- `paymentIntentId: string`
- `amountEur: number`
- `currency: 'EUR'`
- `paymentMethod: 'card' | 'wallet_credit' | 'apple_pay' | 'google_pay'`
- `tipAmountEur: number`
- `vatRate: number` (e.g., 9% for hospitality, 19% standard)
- `taxInvoiceNumber: string`

### Backend Endpoints
- `POST /api/v1/payments/create-intent`: Initialize a payment session for reservations or top-ups.
- `POST /api/v1/payments/webhook`: Webhook listener for asynchronous payment settlement from Stripe/Viva.
- `POST /api/v1/ledger/reconcile`: Create verified transaction receipt and deduct wallet credits.

---

## 3. Real User Authentication & Pass Synchronization

Replace mock development profiles with multi-device user authentication (passkeys, SMS OTP, or email magic links).

### Core Features
- Passkey (WebAuthn) and Apple/Google OAuth sign-in.
- Cross-device wallet balance synchronization.
- Saved venue bookmarks and reservation history sync across mobile web and native wrappers.
- Notification opt-in for booking reminders and emergency weather/hearth updates.

### Data Fields
- `userId: string`
- `email: string`
- `phone: string`
- `displayName: string`
- `savedVenues: string[]`
- `dietaryPreferences: string[]`
- `emergencyContact?: string`

### Backend Endpoints
- `POST /api/v1/auth/magic-link`: Request passwordless authentication email.
- `POST /api/v1/auth/verify`: Verify token and generate secure JWT session.
- `GET /api/v1/users/me`: Fetch authenticated profile, pass status, and dietary sync flags.
- `PATCH /api/v1/users/me/dietary`: Update allergen profile for automatic kitchen syncing.

---

## 4. Multi-Region Cyprus Expansion

Expand venue curation from Limassol Old Town and Larnaca villages to nationwide coverage (Paphos Old Town, Troodos Mountain Villages, Nicosia Walled City, and Ayia Napa Winter Hearth).

### Core Features
- Region selector dropdown with geo-location proximity sorting.
- Mountain weather advisory tags (e.g. "Snow in Troodos — 4WD recommended").
- Regional culinary festival passes.

### Data Fields
- `regionId: string` (e.g., `'troodos'`, `'limassol'`, `'paphos'`, `'nicosia'`)
- `geoCoordinates: { latitude: number; longitude: number }`
- `altitudeMeters: number`
- `weatherCondition: 'clear' | 'rain' | 'mountain_snow'`

### Backend Endpoints
- `GET /api/v1/regions`: List supported dining districts with active venue counts.
- `GET /api/v1/venues?region=:regionId`: Filter venues by geographic region.

---

## 5. QR Payment — One-Time Expiring Token (A3)

The QR code shown on the Pass screen is currently a **preview only** (disabled via `VITE_PILOT_QR_ENABLED`).

Before pilot launch, implement server-side generation of a one-time, expiring payment token that is:
- Bound to a specific amount and transaction ID.
- Valid for a single scan at the in-venue terminal.
- Generated server-side; never constructed in the browser.
- Rotated or invalidated if unused after a configurable TTL (suggested: 60 seconds).

Enable with `VITE_PILOT_QR_ENABLED=true` once implemented and security-reviewed.

---

## 6. English / Ελληνικά Language Toggle (C9)

Add a full localisation system:
- Implement a locale context (e.g., React context with `'en'` | `'el'` values).
- Translate all customer-facing strings using a resource file (e.g. `src/i18n/el.ts`).
- All strings currently marked `[PLACEHOLDER: Greek translation — verify before pilot]` must be translated and verified by a native speaker before pilot launch.
- Language toggle control must be accessible (keyboard, screen-reader labelled).

---

## 7. Partner Form Submission Endpoint (C8)

The partner enquiry form (`/partner`) currently saves locally only (`setSubmitted(true)`). No data is sent.

Before pilot:
- Add `POST /api/v1/partner/enquiries` endpoint.
- Form `onSubmit` must `fetch()` to this endpoint and handle success/error states.
- Remove the "[PLACEHOLDER: submission endpoint — add before pilot]" notice from the success card once the endpoint is live.
- Review privacy policy requirement: add link to `[PLACEHOLDER: privacy policy link]` in the form.
