import type { Deal, Event, MenuItem, TableBooking, Venue, Wallet } from '../domain/types';

/** Transport-ready inputs. Amounts are always integer cents. */
export type CreateBookingInput = Omit<TableBooking, 'id' | 'status'>;

export type OrderStatus = 'confirmed' | 'preparing' | 'on_the_way' | 'delivered';

export type OrderLine = {
  menuItemId: string;
  quantity: number;
  unitPriceCents: number;
};

export type Order = {
  id: string;
  lines: OrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentMethod: 'wallet' | 'card';
  status: OrderStatus;
  createdAt: string;
};

export type CreateOrderInput = Omit<Order, 'id' | 'status' | 'createdAt'>;

export type PartnerLead = {
  id: string;
  venueName: string;
  region: string;
  email: string;
  notes: string;
  createdAt: string;
};

export type CreatePartnerLeadInput = Omit<PartnerLead, 'id' | 'createdAt'>;

/**
 * Adapter boundary for the future HTTP client. The fixture implementation is synchronous to
 * preserve the current render timing; an HTTP adapter can implement the same operations behind
 * React query/resources when a backend is introduced.
 */
export interface TrooDataAdapter {
  readonly isMock: boolean;
  listVenues(): readonly Venue[];
  findVenue(id: string): Venue | undefined;
  listDeals(): readonly Deal[];
  listMenuItems(): readonly MenuItem[];
  listEvents(): readonly Event[];
  initialWallet(): Wallet;
  initialBookings(): readonly TableBooking[];
  createBooking(input: CreateBookingInput): TableBooking;
  createOrder(input: CreateOrderInput): Order;
  createPartnerLead(input: CreatePartnerLeadInput): PartnerLead;
}
