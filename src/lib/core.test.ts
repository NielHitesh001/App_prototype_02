import { describe, expect, it } from 'vitest';
import { events, initialWallet } from '../fixtures/data';
import { eventDate } from './dates';
import { canBook, credit, debit } from './wallet';

describe('dates', () => { it('derives a weekday for every fixture event in Nicosia', () => { events.forEach(event => expect(eventDate(event.startsAt)).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /)); }); });
describe('booking guard', () => { it('blocks overspending and calculates shortfall', () => expect(canBook(130, 153)).toEqual({ allowed: false, shortfall: 23 })); it('allows exact balance', () => expect(canBook(130, 130).allowed).toBe(true)); });
describe('wallet', () => { it('debits and credits balance', () => { const charged = debit(initialWallet, { id:'a', kind:'booking', amountCredits:-20, createdAt:'2026-11-05T10:00:00+02:00',label:'Booking',reference:'TR-X' }); expect(charged.balanceCredits).toBe(110); expect(credit(charged, { id:'b',kind:'topup',amountCredits:50,createdAt:'2026-11-05T11:00:00+02:00',label:'Top-up',reference:'TR-Y' }).balanceCredits).toBe(160); }); });
