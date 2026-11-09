import type { TableBooking, Wallet } from '../domain/types';
import { deals, events, initialTableBookings, initialWallet, menuItems, venues } from '../fixtures/data';
import type {
  CreateBookingInput,
  CreateOrderInput,
  CreatePartnerLeadInput,
  Order,
  PartnerLead,
  TrooDataAdapter
} from './contracts';

const cloneWallet = (wallet: Wallet): Wallet => ({
  balanceCents: wallet.balanceCents,
  entries: wallet.entries.map(entry => ({ ...entry, meta: entry.meta ? { ...entry.meta } : undefined }))
});

/**
 * Development adapter. Replace this class with an HTTP-backed adapter at the composition root;
 * components and the store should never import fixture data directly.
 */
export class FixtureAdapter implements TrooDataAdapter {
  readonly isMock = true;

  listVenues() { return venues; }
  findVenue(id: string) { return venues.find(venue => venue.id === id); }
  listDeals() { return deals; }
  listMenuItems() { return menuItems; }
  listEvents() { return events; }
  initialWallet() { return cloneWallet(initialWallet); }
  initialBookings() { return initialTableBookings.map(booking => ({ ...booking, dietarySync: [...booking.dietarySync] })); }

  createBooking(input: CreateBookingInput): TableBooking {
    // TODO(api): POST /bookings and return the server-issued booking id/status.
    return { ...input, id: `tb-${Date.now()}`, status: 'confirmed' };
  }

  createOrder(input: CreateOrderInput): Order {
    // TODO(api): POST /orders and return server-side fulfilment status.
    return { ...input, id: `ord-${Date.now()}`, status: 'confirmed', createdAt: new Date().toISOString() };
  }

  createPartnerLead(input: CreatePartnerLeadInput): PartnerLead {
    // TODO(api): POST /partner-leads; local persistence remains in the preview form for now.
    return { ...input, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() };
  }
}
