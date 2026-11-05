export type ImageRef = {
  src: string;
  alt: string;
};

export type Venue = {
  id: string;
  name: string;
  area: string;
  cuisine: string;
  rating?: number;
  ratingCount?: number;
  verified: boolean;
  fireplace: boolean;
  image: ImageRef;
  description?: string;
  phone?: string;
};

export type Event = {
  id: string;
  title: string;
  venueId: string;
  startsAt: string; // ISO 8601 with offset e.g. 2026-11-20T19:30:00+02:00
  priceEur: number | null; // null means free
  capacity: number;
  seatsLeft: number;
  verified: boolean;
  description?: string;
  image?: ImageRef;
};

export type Deal = {
  id: string;
  venueId: string;
  title: string;
  expiresAt: string; // ISO
  standing: boolean;
  discountNote?: string;
};

export type LedgerEntryKind = 'topup' | 'bonus' | 'booking' | 'refund';

export type LedgerEntry = {
  id: string;
  idempotencyKey?: string;
  kind: LedgerEntryKind;
  amountCents: number; // positive for topup/bonus/refund, negative for debit
  amountCredits: number; // euro/credits representation for backwards-compatibility (amountCents / 100)
  resultingBalanceCents: number;
  createdAt: string; // ISO 8601
  label: string;
  labelEl?: string; // Greek label for bilingual receipts
  reference: string;
  paymentMode?: 'wallet' | 'card' | 'qr';
  meta?: Record<string, unknown>;
  bonusCredits?: number;
};

export type Wallet = {
  balanceCents: number; // Integer cents (primary truth)
  balanceCredits: number; // balanceCents / 100
  entries: LedgerEntry[];
};

export type BookingGuardReason = 'insufficient_balance' | 'guests_out_of_range' | 'invalid_amount';

export type BookingGuardResult = {
  allowed: boolean;
  reason?: BookingGuardReason;
  shortfallCents: number;
  shortfall: number; // in euro/credits for backwards compatibility
  messageEn?: string;
  messageEl?: string;
};

export type TableBooking = {
  id: string;
  venueId: string;
  venueName: string;
  tableNumber: number;
  seatingZone: string;
  partySize: number;
  timeSlot: string;
  dateStr: string;
  dietarySync: string[];
  status: 'confirmed' | 'seated' | 'completed';
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  venueId: string;
  priceEur: number;
  deliveryTimeMins: string;
  deliveryFeeEur: number;
  minOrderEur: number;
  image: ImageRef;
};

export type CartItem = {
  item: MenuItem;
  quantity: number;
};
