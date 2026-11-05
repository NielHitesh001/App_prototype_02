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

export type LedgerEntry = {
  id: string;
  kind: 'topup' | 'booking' | 'refund';
  amountCredits: number;
  createdAt: string;
  label: string;
  reference: string;
  bonusCredits?: number;
};

export type Wallet = {
  balanceCredits: number;
  entries: LedgerEntry[];
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
