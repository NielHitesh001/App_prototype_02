import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { deals, events, initialTableBookings, initialWallet, menuItems, venues } from '../../src/fixtures/data';
import type { LedgerEntry, TableBooking, Wallet } from '../../src/domain/types';
import type { Order, PartnerLead } from '../../src/api/contracts';

export type Database = { wallet: Wallet; bookings: TableBooking[]; orders: Order[]; partnerLeads: PartnerLead[] };

const copy = <T>(value: T): T => structuredClone(value);
export class LocalStore {
  private database: Database;
  constructor(private readonly path: string) { this.database = this.load(); }
  private load(): Database {
    if (existsSync(this.path)) return JSON.parse(readFileSync(this.path, 'utf8')) as Database;
    const seed = { wallet: copy(initialWallet), bookings: copy(initialTableBookings), orders: [], partnerLeads: [] };
    this.persist(seed); return seed;
  }
  private persist(database = this.database) { mkdirSync(dirname(this.path), { recursive: true }); writeFileSync(this.path, JSON.stringify(database, null, 2)); }
  catalog() { return { venues, deals, events, menuItems }; }
  wallet() { return copy(this.database.wallet); }
  bookings() { return copy(this.database.bookings); }
  addBooking(booking: Omit<TableBooking, 'id' | 'status'>) { const record: TableBooking = { ...booking, id: `tb-${randomUUID()}`, status: 'confirmed' }; this.database.bookings.unshift(record); this.persist(); return copy(record); }
  addOrder(order: Omit<Order, 'id' | 'status' | 'createdAt'>) { const record: Order = { ...order, id: `ord-${randomUUID()}`, status: 'confirmed', createdAt: new Date().toISOString() }; this.database.orders.unshift(record); this.persist(); return copy(record); }
  addLead(lead: Omit<PartnerLead, 'id' | 'createdAt'>) { const record: PartnerLead = { ...lead, id: `lead-${randomUUID()}`, createdAt: new Date().toISOString() }; this.database.partnerLeads.unshift(record); this.persist(); return copy(record); }
  addTopUp(amountCents: number, idempotencyKey: string) {
    const duplicate = this.database.wallet.entries.find(entry => entry.idempotencyKey === idempotencyKey);
    if (duplicate) return { wallet: this.wallet(), entry: copy(duplicate), duplicate: true };
    const balance = this.database.wallet.balanceCents + amountCents;
    const entry: LedgerEntry = { id: `le-${randomUUID()}`, idempotencyKey, kind: 'topup', amountCents, resultingBalanceCents: balance, createdAt: new Date().toISOString(), label: 'Wallet top-up', reference: `TR-${Date.now()}`, paymentMode: 'card' };
    this.database.wallet.balanceCents = balance; this.database.wallet.entries.unshift(entry); this.persist();
    return { wallet: this.wallet(), entry: copy(entry), duplicate: false };
  }
  debitWallet(amountCents: number, label: string, idempotencyKey: string) {
    const duplicate = this.database.wallet.entries.find(entry => entry.idempotencyKey === idempotencyKey);
    if (duplicate) return { wallet: this.wallet(), entry: copy(duplicate), duplicate: true };
    if (amountCents > this.database.wallet.balanceCents) throw new Error('INSUFFICIENT_BALANCE');
    const balance = this.database.wallet.balanceCents - amountCents;
    const entry: LedgerEntry = { id: `le-${randomUUID()}`, idempotencyKey, kind: 'booking', amountCents: -amountCents, resultingBalanceCents: balance, createdAt: new Date().toISOString(), label, reference: `TR-${Date.now()}`, paymentMode: 'wallet' };
    this.database.wallet.balanceCents = balance; this.database.wallet.entries.unshift(entry); this.persist();
    return { wallet: this.wallet(), entry: copy(entry), duplicate: false };
  }
}
