import type { Deal, Event, MenuItem, TableBooking, Venue, Wallet } from '../domain/types';

// Development-only mock data. Label clearly as development preview in the UI.
const photo = (name: string, alt: string) => ({ src: `/images/${name}.svg`, alt });

export const venues: Venue[] = [
  {
    id: 'patriko',
    name: 'To Patriko Taverna',
    area: 'Old Town, Limassol',
    cuisine: 'Traditional Cypriot',
    verified: false,
    fireplace: true,
    rating: 4.8,
    ratingCount: 126,
    phone: '+357 25 341200',
    description: 'Slow-cooked earthenware hearth dining in the stone heart of Limassol.',
    image: photo('patriko', 'A warmly lit dining table by the stone hearth at To Patriko Taverna')
  },
  {
    id: 'dionysus',
    name: 'Dionysus Stone Cellar',
    area: 'Agios Athanasios',
    cuisine: 'Wine bar and small plates',
    verified: false,
    fireplace: true,
    rating: 4.6,
    ratingCount: 74,
    phone: '+357 25 723490',
    description: 'Natural commandaria vintages, cured lountza, and barrel-aged village cheeses.',
    image: photo('dionysus', 'Restaurant table prepared for dinner with wine glasses')
  },
  {
    id: 'kafeneio',
    name: 'Kafeneio 1920',
    area: 'Old Town, Limassol',
    cuisine: 'Cypriot coffee and meze',
    verified: false,
    fireplace: false,
    phone: '+357 25 365820',
    description: 'Unrushed morning coffee, wild mountain greens, and quiet afternoon tables.',
    image: photo('kafeneio', 'Sharing plates and fresh pita on a rustic wooden table')
  },
  {
    id: 'troodos',
    name: 'Troodos Foothill Kitchen',
    area: 'Troodos Foothills',
    cuisine: 'Seasonal village cooking',
    verified: false,
    fireplace: true,
    phone: '+357 25 813044',
    description: 'Clay-oven sourdough loaves, warm trahanas soup, and slow mountain braises.',
    image: photo('troodos', 'Warm earthen bowl of seasonal village stew')
  }
];

export const deals: Deal[] = [
  {
    id: 'd1',
    venueId: 'patriko',
    title: 'Winter tasting menu',
    expiresAt: '2026-12-01T22:00:00+02:00',
    standing: false,
    discountNote: '20% off hearth menu'
  },
  {
    id: 'd2',
    venueId: 'dionysus',
    title: 'Wine flight with small plates',
    expiresAt: '2026-12-31T23:59:00+02:00',
    standing: true,
    discountNote: 'Standing winter offer'
  }
];

export const events: Event[] = [
  {
    id: 'e1',
    title: 'Old Commandaria and kleftiko night',
    venueId: 'patriko',
    startsAt: '2026-11-06T19:30:00+02:00',
    priceEur: 32,
    priceCents: 3200,
    capacity: 24,
    seatsLeft: 8,
    verified: false,
    description: 'Four vintage barrel tastings paired with 8-hour parchment-wrapped clay oven lamb.',
    image: photo('patriko', 'Traditional clay oven braised lamb served with village wine')
  },
  {
    id: 'e2',
    title: 'Sourdough and halloumi workshop',
    venueId: 'dionysus',
    startsAt: '2026-11-07T11:00:00+02:00',
    priceEur: 18,
    priceCents: 1800,
    capacity: 16,
    seatsLeft: 3,
    verified: false,
    description: 'Hands-on morning woodfire bake, hand-pinched sourdough and fresh mint goat halloumi.',
    image: photo('dionysus', 'Freshly baked artisanal bread near a wood-fired hearth')
  },
  {
    id: 'e3',
    title: 'Natural wine and smoked lountza',
    venueId: 'kafeneio',
    startsAt: '2026-11-17T18:00:00+02:00',
    priceEur: null,
    priceCents: null,
    capacity: 30,
    seatsLeft: 12,
    verified: false,
    description: 'Free community tasting of low-intervention Cypriot wines and house-cured meats.',
    image: photo('kafeneio', 'Glass of amber wine next to cured meats on marble counter')
  },
  {
    id: 'e4',
    title: 'Commandaria Cellar Barrel Tasting',
    venueId: 'patriko',
    startsAt: '2026-11-20T20:00:00+02:00',
    priceEur: 48.1,
    priceCents: 4810,
    capacity: 18,
    seatsLeft: 5,
    verified: true,
    description: 'Rare commandaria vintages paired with four artisan bites.',
    image: photo('dionysus', 'Cellar wine tasting with oak barrels')
  }
];

export const menuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Troodos Clay Pot Kleftiko',
    description: 'Slow-cooked lamb shank, mountain oregano, bay leaf, and lemon-crusted village potatoes.',
    venueId: 'patriko',
    priceEur: 18.5,
    priceCents: 1850,
    deliveryTimeMins: '30–40 min',
    deliveryFeeEur: 2.5,
    deliveryFeeCents: 250,
    minOrderEur: 15.0,
    minOrderCents: 1500,
    image: photo('patriko', 'Clay pot kleftiko lamb with wild herbs')
  },
  {
    id: 'm2',
    name: 'Halloumi & Sourdough Hearth Box',
    description: 'Grilled sheep halloumi, wild carob molasses, pickled caper leaves, and warm crusty bread.',
    venueId: 'troodos',
    priceEur: 14.0,
    priceCents: 1400,
    deliveryTimeMins: '25–35 min',
    deliveryFeeEur: 2.0,
    deliveryFeeCents: 200,
    minOrderEur: 12.0,
    minOrderCents: 1200,
    image: photo('dionysus', 'Grilled halloumi with honey and warm sourdough')
  },
  {
    id: 'm3',
    name: 'Wild Winter Mountain Meze',
    description: 'Eight-course selection: smoked lountza, tahini, beetroot skordalia, and wood-fired mushrooms.',
    venueId: 'patriko',
    priceEur: 22.0,
    priceCents: 2200,
    deliveryTimeMins: '35–45 min',
    deliveryFeeEur: 2.5,
    deliveryFeeCents: 250,
    minOrderEur: 20.0,
    minOrderCents: 2000,
    image: photo('kafeneio', 'Full Mediterranean meze spread')
  },
  {
    id: 'm4',
    name: 'Charcoal Pork Souvla',
    description: 'Traditional spit-roasted pork chunks with lemon wedges, pickled peppers, and village salad.',
    venueId: 'dionysus',
    priceEur: 16.5,
    priceCents: 1650,
    deliveryTimeMins: '30–40 min',
    deliveryFeeEur: 2.5,
    deliveryFeeCents: 250,
    minOrderEur: 15.0,
    minOrderCents: 1500,
    image: photo('troodos', 'Charcoal grilled pork souvla platter')
  }
];

export const initialTableBookings: TableBooking[] = [
  {
    id: 'tb-1',
    venueId: 'patriko',
    venueName: 'To Patriko Taverna',
    tableNumber: 4,
    seatingZone: 'Hearthside (Near Fireplace)',
    partySize: 2,
    timeSlot: '20:15',
    dateStr: 'Tonight',
    dietarySync: ['Gluten-free', 'Shellfish allergy'],
    status: 'confirmed'
  }
];

export const initialWallet: Wallet = {
  balanceCents: 13000,
  entries: [
    {
      id: 'l2',
      kind: 'booking',
      amountCents: -1000,
      resultingBalanceCents: 13000,
      createdAt: '2026-11-03T19:00:00+02:00',
      label: 'Table booking deposit',
      labelEl: 'Προκαταβολή κράτησης τραπεζιού',
      reference: 'TR-1002',
      paymentMode: 'wallet'
    },
    {
      id: 'l1',
      kind: 'topup',
      amountCents: 14000,
      resultingBalanceCents: 14000,
      createdAt: '2026-11-01T10:00:00+02:00',
      label: 'Wallet top-up',
      labelEl: 'Φόρτιση πορτοφολιού',
      reference: 'TR-1001',
      paymentMode: 'card'
    }
  ]
};
