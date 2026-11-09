import { describe, expect, it } from 'vitest';
import { FixtureAdapter } from './FixtureAdapter';

describe('FixtureAdapter', () => {
  it('serves catalog data without exposing a mutable wallet fixture', () => {
    const adapter = new FixtureAdapter();
    const first = adapter.initialWallet();
    first.balanceCents = 0;

    expect(adapter.listVenues().length).toBeGreaterThan(0);
    expect(adapter.listMenuItems().length).toBeGreaterThan(0);
    expect(adapter.initialWallet().balanceCents).toBeGreaterThan(0);
  });

  it('creates adapter-shaped booking, order, and partner lead records', () => {
    const adapter = new FixtureAdapter();
    const booking = adapter.createBooking({
      venueId: 'patriko', venueName: 'To Patriko Taverna', tableNumber: 1,
      seatingZone: 'Main Hall', partySize: 2, timeSlot: '20:00', dateStr: 'Today', dietarySync: []
    });
    const order = adapter.createOrder({
      lines: [{ menuItemId: 'm1', quantity: 1, unitPriceCents: 1850 }],
      subtotalCents: 1850, deliveryFeeCents: 250, totalCents: 2100, paymentMethod: 'wallet'
    });
    const lead = adapter.createPartnerLead({ venueName: 'Test venue', region: 'Limassol', email: 'test@example.com', notes: '' });

    expect(booking.status).toBe('confirmed');
    expect(order.totalCents).toBe(2100);
    expect(lead.id).toMatch(/^lead-/);
  });
});
