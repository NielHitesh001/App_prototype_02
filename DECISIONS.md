# Product Decisions

These product decisions were confirmed by the Product Owner and govern the implementation across all screens and copy:

1. **Brand Name:** **Troo**
   - Applied consistently across the app: logo lockup, headers, navigation, pass card, and editorial copy.
   - Replaces conflicting references like "Troo" or "Kouzina" as top-level brand names (Kouzina remains strictly the name of the delivery destination under `/kouzina`).

2. **Visual Palette:** **Terracotta & Cream (Stitch System)**
   - Primary: `#9A4A3A` (Warm Terracotta / Fired Clay)
   - Background Canvas: `#FBF5EE` (Warm Sandstone Cream)
   - Text Primary: `#2B2118` (Near-Black Espresso Brown, WCAG AAA on cream)
   - Secondary / Accent: `#4F5B45` (Deep Olive Grove)
   - Tertiary / Highlight: `#F3D9A0` (Raw Amber Honey)
   - Surface / Card: `#FFFFFF` (with warm ambient tint and rounded pill/container radii)

3. **Delivery (Kouzina):** **In Scope for MVP**
   - The `/kouzina` route is included in the MVP navigation and experience.
   - Includes real search (`type="search"` with visible accessible label).
   - Card items display delivery time (e.g. 25–35 min), delivery fee (e.g. €2.50), and minimum order amount (e.g. €15.00) before adding to cart.
   - Interactive cart management: item quantity adjustments, sticky cart bar showing item count and subtotal, and a dedicated checkout dialog.

4. **Tap to Pay:** **Web QR Code Handoff**
   - NFC is not supported in mobile web browsers and is strictly removed.
   - Table payment and pass redemption use a responsive, accessible Web QR code modal designed for mobile-to-staff scanning.

5. **Trust & Marketing Claims:** **Removed**
   - All unverified claims have been removed:
     - "Zero commission" / "Platform commission €0.00"
     - "Cryptographically signed ledger"
     - "Limassol Tourism Guild funding"
     - Blanket "Verified host" badges (badges only appear when `verified: true` in real domain data)
   - Copy is kept honest, direct, and focused on genuine food and event experiences.

6. **Wallet Top-Up Bonus:** **10% Credit Bonus**
   - Top-up selections (+€25, +€50, +€100) receive a 10% credit bonus (+€2.50, +€5.00, +€10.00 in wallet credits).
   - No early-bird discount rule is applied in MVP.
   - 1 credit = €1. Currency is presented in euros (€).
