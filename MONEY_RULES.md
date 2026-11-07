# Money and Wallet Rules

This document defines the mathematical, architectural, and operational rules governing all money, credits, and ledger operations across Troo (Cyprus Winter Dining Network).

---

## 1. Storage & Integer Arithmetic

- **Unit of Record:** All monetary amounts in application state, storage, and domain logic are represented strictly as **integer cents** (e.g., €12.50 is stored as `1250`).
- **No Floating-Point Storage:** Floats are never stored in `Wallet` or `LedgerEntry` models. The legacy fields `balanceCredits` and `amountCredits` are removed.
- **Credit Valuation:** `1 credit = €1.00 = 100 cents`. Credits and euros are 1:1.
- **Parsing:** `euroToCents(euros: number | string)` parses euro representations into integer cents. String inputs are preferred across all callers to avoid IEEE-754 precision issues. Strings are validated against `/^\d+(\.\d{1,2})?$/`, rejecting scientific notation (`1e2`), hex (`0x1A`), negatives (`-5`), and trailing fractions (`12.345`). Numbers are validated for whole-cent precision (`Math.abs(cents - Math.round(cents)) <= 1e-9`).

---

## 2. Limits and Caps

All transaction limits are enforced by a single validator `validateAmount(cents, kind)` in `src/lib/money.ts`:

| Boundary | Value in Cents | Value in Euros | Description |
|---|---|---|---|
| Minimum Transaction | `1` | €0.01 | Disallows €0.00, negative amounts, and non-integer amounts. |
| Maximum Single Top-Up | `50,000` | €500.00 | Prevents accidental or excessive single top-up operations. |
| Maximum Wallet Balance | `200,000` | €2,000.00 | Hard cap on total balance in the user's wallet. |

---

## 3. Bonus Rule and Commercial Rounding

- **Rate:** 10% promotional bonus credited on top-ups.
- **Formula:** Integer arithmetic `Math.round((topupCents * 10) / 100)`.
- **Rounding Standard:** Commercial **Round-Half-Up**.
  - Example: €2.55 (255 cents) top-up gives `Math.round(25.5) = 26` cents (€0.26 bonus).
  - Example: €25.00 (2,500 cents) top-up gives `250` cents (€2.50 bonus).
  - Example: €50.00 (5,000 cents) top-up gives `500` cents (€5.00 bonus).
  - Example: €100.00 (10,000 cents) top-up gives `1,000` cents (€10.00 bonus).
- **Separate Ledger Entry:** The bonus is recorded as an independent ledger entry of kind `'bonus'`, preserving transparency on receipts and historical audit trails.
- **Atomic Cap Check:** Before any top-up or bonus entry is committed, the total resulting balance `balanceCents + topupCents + bonusCents` is evaluated against `MAX_WALLET_BALANCE_CENTS`. If the total exceeds the cap, the entire operation is aborted atomically with no mutations to the wallet.

---

## 4. Idempotency & Replay Protection

- **Top-Up Operations:**
  - `processTopupWithBonus` accepts an `idempotencyKey`.
  - Upfront check evaluates both the base key `${key}` and the bonus key `${key}-bonus`.
  - If a replay is received with a matching key, both original entries (`topupEntry` and `bonusEntry`) are returned, and the balance remains unchanged.
  - If the base entry exists but the associated bonus is missing (corrupted state), an error is thrown.
- **Debits & Bookings:**
  - `debit()` checks for duplicate `idempotencyKey` before altering balance or prepending an entry.
- **Refunds:**
  - `processRefund()` accepts `options.idempotencyKey`. If an entry with the key already exists, the wallet is returned untouched.

---

## 5. Refunds & Cumulative Invariant

- **Target Entry:** Can only refund ledger entries where `kind === 'booking'`.
- **Cumulative Tracking:**
  $$\sum \text{refunds for booking} \le |\text{original charge}|$$
  - Previous refunds referencing `meta.originalEntryId` are summed.
  - Remaining refundable amount is `originalChargeCents - alreadyRefundedCents`.
- **Amount Rules:**
  - If `refundAmountCents` is omitted (`undefined`), the full remaining refundable amount is refunded.
  - If `refundAmountCents` is `0`, negative, or non-integer, an error is thrown.
  - If `refundAmountCents > remainingRefundableCents`, the request is rejected with a clear message stating the remaining refundable balance.
- **Refund Balance Cap Decision:**
  - **Rule:** Refunds enforce the `MAX_WALLET_BALANCE_CENTS` (€2,000.00 / 200,000 cents) ceiling. Refunds do **not** bypass the wallet balance cap.
  - **Rationale:** In compliance with regulatory e-money ceilings, a wallet can never hold more than €2,000.00 under any condition. If a user tops up near the cap, an attempted refund that would cause `wallet.balanceCents + refundAmountCents > MAX_WALLET_BALANCE_CENTS` is rejected atomically before writing to the ledger.
  - **Named Support Role:** [PLACEHOLDER — replace with actual support team name and email before pilot launch] (`[PLACEHOLDER: support email]`) / Operations Desk.
  - **Support Procedure:** When a refund is rejected because it exceeds the €2,000 wallet limit, the host or guest escalates to [PLACEHOLDER: named support role]. Support issues a direct manual payout to the customer's original payment method (card or SEPA bank account) within [PLACEHOLDER: SLA to be defined] business days. Once settled, an administrative adjustment entry is logged in the back-office ledger referencing the original booking.
  - **Customer Rejection Message (Bilingual):**
    - English (`en`): `Refund exceeds the €2,000 wallet limit. Please contact [PLACEHOLDER: support email] for direct payout.`
    - Greek (`el`): `Η επιστροφή υπερβαίνει το όριο των 2.000 € του πορτοφολιού. Επικοινωνήστε με την [PLACEHOLDER: support email] για απευθείας πληρωμή.`

---

## 6. Booking Guard (`canBook`)

- **Parameters:**
  ```ts
  canBook(
    balanceCents: number,
    totalCents: number,
    options: {
      guests: number;
      paymentMethod?: 'wallet' | 'card' | 'qr' | 'cash';
    }
  ): BookingGuardResult
  ```
- **Requirements:**
  1. `guests` is strictly required and must be an integer from 1 to 4 inclusive.
  2. Non-wallet payment methods (`'card'`, `'qr'`, `'cash'`) bypass the wallet balance check.
  3. Exact balance is permitted (`balanceCents >= totalCents`).
  4. Shortfall is calculated in integer cents: `totalCents - balanceCents`.
  5. Bilingual customer-facing messages (`messageEn`, `messageEl`) format amounts with Cyprus currency conventions.
- **Shortfall Top-Up and Bonus Policy Decision:**
  - **Decision:** Shortfall is calculated before bonus (`totalCents - balanceCents`); the 10% promotional bonus applies to the top-up amount, leaving the customer with leftover credits after booking.
  - **Status:** `PENDING OWNER APPROVAL` and `PENDING LEGAL REVIEW`.
  - **Open Question for Counsel:** Whether a promotional bonus credited on a top-up made to cover a specific booking is permitted under Cyprus consumer and e-money rules, and whether the €2,000 wallet balance cap interacts with bonus credits.
  - **Customer Copy for Review:**
    - English Alert (`canBook.messageEn`): `This needs {total}. You have {balance}. Top up {shortfall} to continue.` (e.g. `This needs €48.00. You have €27.50. Top up €20.50 to continue.`)
    - English Bonus Breakdown (`App.tsx`): `A 10% bonus (+{bonus}) applies to this top-up, leaving {leftover} in wallet credits after booking.` (e.g. `A 10% bonus (+€2.05) applies to this top-up, leaving €2.05 in wallet credits after booking.`)
    - Greek Alert (`canBook.messageEl`): `Απαιτούνται {total}. Έχετε {balance}. Συμπληρώστε {shortfall} για να συνεχίσετε.` (e.g. `Απαιτούνται 48,00 €. Έχετε 27,50 €. Συμπληρώστε 20,50 € για να συνεχίσετε.`)
  - **Rationale for Proposed Option:**
    1. *Transparency:* Requesting the raw deficit avoids confusing reverse discount fractions (e.g. asking for €18.64 instead of €20.50).
    2. *Separation of Concerns:* `canBook()` evaluates balance sufficiency against cost; top-up promotional policy remains strictly encapsulated within the deposit engine.
    3. *Guest Retention:* Receiving the 10% bonus leaves a surplus ending balance (€2.05 in the standard QA scenario) in the guest's wallet, encouraging return bookings.

---

## 7. Display Formatting (Cyprus Locale)

- **Single Formatter Rule (P1-6):** `formatCents(cents: number, locale: 'en-CY' | 'el-CY')` in `src/lib/money.ts` is the sole place where `Intl.NumberFormat` is instantiated in the entire application.
- `euro(amount, isCents)` is a thin wrapper that delegates directly to `formatCents()`.
- Cyprus English locale (`en-CY`) renders `€XX.XX`.
- Cyprus Greek locale (`el-CY`) renders `XX,XX €`.

---

## 8. Ledger Integrity Invariant

At all times, the wallet balance must strictly equal the sum of all ledger entry amounts:
$$\text{Wallet.balanceCents} \equiv \sum_{e \in \text{entries}} e.\text{amountCents}$$
This invariant is asserted after every financial operation via `verifyWalletInvariant(wallet)`.
