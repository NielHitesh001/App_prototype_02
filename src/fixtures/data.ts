import type { Deal, Event, MenuItem, TableBooking, Venue, Wallet } from '../domain/types';

// Development-only mock data. Label clearly as development preview in the UI.
const photo = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`,
  alt
});

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
    image: photo('photo-1515003197210-e0cd71810b5f', 'A warmly lit dining table by the stone hearth at To Patriko Taverna')
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
    image: photo('photo-1414235077428-338989a2e8c0', 'Restaurant table prepared for dinner with wine glasses')
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
    image: photo('photo-1513104890138-7c749659a591', 'Sharing plates and fresh pita on a rustic wooden table')
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
    image: photo('photo-1547592180-85f173990554', 'Warm earthen bowl of seasonal village stew')
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
    capacity: 24,
    seatsLeft: 8,
    verified: false,
    description: 'Four vintage barrel tastings paired with 8-hour parchment-wrapped clay oven lamb.',
    image: photo('photo-1544025162-d76694265947', 'Traditional clay oven braised lamb served with village wine')
  },
  {
    id: 'e2',
    title: 'Sourdough and halloumi workshop',
    venueId: 'dionysus',
    startsAt: '2026-11-07T11:00:00+02:00',
    priceEur: 18,
    capacity: 16,
    seatsLeft: 3,
    verified: false,
    description: 'Hands-on morning woodfire bake, hand-pinched sourdough and fresh mint goat halloumi.',
    image: photo('photo-1509440159596-0249088772ff', 'Freshly baked artisanal bread near a wood-fired hearth')
  },
  {
    id: 'e3',
    title: 'Natural wine and smoked lountza',
    venueId: 'kafeneio',
    startsAt: '2026-11-17T18:00:00+02:00',
    priceEur: null,
    capacity: 30,
    seatsLeft: 12,
    verified: false,
    description: 'Free community tasting of low-intervention Cypriot wines and house-cured meats.',
    image: photo('photo-1510812431401-41d2bd2722f3', 'Glass of amber wine next to cured meats on marble counter')
  }
];

export const menuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Troodos Clay Pot Kleftiko',
    description: 'Slow-cooked lamb shank, mountain oregano, bay leaf, and lemon-crusted village potatoes.',
    venueId: 'patriko',
    priceEur: 18.5,
    deliveryTimeMins: '30–40 min',
    deliveryFeeEur: 2.5,
    minOrderEur: 15.0,
    image: photo('photo-1544025162-d76694265947', 'Clay pot kleftiko lamb with wild herbs')
  },
  {
    id: 'm2',
    name: 'Halloumi & Sourdough Hearth Box',
    description: 'Grilled sheep halloumi, wild carob molasses, pickled caper leaves, and warm crusty bread.',
    venueId: 'troodos',
    priceEur: 14.0,
    deliveryTimeMins: '25–35 min',
    deliveryFeeEur: 2.0,
    minOrderEur: 12.0,
    image: photo('photo-1565299624946-b28f40a0ae38', 'Grilled halloumi with honey and warm sourdough')
  },
  {
    id: 'm3',
    name: 'Wild Winter Mountain Meze',
    description: 'Eight-course selection: smoked lountza, tahini, beetroot skordalia, and wood-fired mushrooms.',
    venueId: 'patriko',
    priceEur: 22.0,
    deliveryTimeMins: '35–45 min',
    deliveryFeeEur: 2.5,
    minOrderEur: 20.0,
    image: photo('photo-1541544741938-0af808871cc0', 'Full Mediterranean meze spread')
  },
  {
    id: 'm4',
    name: 'Charcoal Pork Souvla',
    description: 'Traditional spit-roasted pork chunks with lemon wedges, pickled peppers, and village salad.',
    venueId: 'dionysus',
    priceEur: 16.5,
    deliveryTimeMins: '30–40 min',
    deliveryFeeEur: 2.5,
    minOrderEur: 15.0,
    image: photo('photo-1555939594-58d7cb561ad1', 'Charcoal grilled pork souvla platter')
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
  balanceCredits: 130,
  entries: [
    {
      id: 'l1',
      kind: 'topup',
      amountCredits: 130,
      createdAt: '2026-11-01T10:00:00+02:00',
      label: 'Wallet top-up',
      reference: 'TR-1001',
      bonusCredits: 13
    },
    {
      id: 'l2',
      kind: 'booking',
      amountCredits: -10,
      createdAt: '2026-11-03T19:00:00+02:00',
      label: 'Table booking deposit',
      reference: 'TR-1002'
    }
  ]
};
