import { describe, expect, it } from 'vitest';
import type { Wallet } from '../domain/types';
import { events, initialWallet } from '../fixtures/data';
import { eventDate, eventTime, isEventReservable, isPastEvent, isTodayInNicosia } from './dates';
import {
  calculateBonusCents,
  centsToEuro,
  formatCents,
  validateAndParseInputToCents
} from './money';
import {
  canBook,
  credit,
  debit,
  processRefund,
  processTopupWithBonus,
  verifyWalletInvariant
} from './wallet';

describe('1. Dates & Cyprus Locale', () => {
  it('derives a weekday for every fixture event in Nicosia', () => {
    events.forEach(event => {
      const formatted = eventDate(event.startsAt);
      expect(formatted).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /);
    });
  });

  it('formats time with 24-hour European Cyprus standard', () => {
    const time = eventTime('2026-11-06T19:30:00+02:00');
    expect(time).toBe('19:30');
  });

  it('A1: an event whose start time is before now is not reservable', () => {
    const now = new Date('2026-11-07T12:00:00+02:00');
    const pastEventStartsAt = '2026-11-06T19:30:00+02:00';
    expect(isPastEvent(pastEventStartsAt, now)).toBe(true);
    expect(isEventReservable(pastEventStartsAt, now)).toBe(false);
  });

  it('A1: an event starting in 1 hour is reservable', () => {
    const now = new Date('2026-11-07T12:00:00+02:00');
    const futureEventStartsAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    expect(isPastEvent(futureEventStartsAt, now)).toBe(false);
    expect(isEventReservable(futureEventStartsAt, now)).toBe(true);
  });

  it('identifies today in Nicosia correctly', () => {
    const now = new Date('2026-11-07T12:00:00+02:00');
    expect(isTodayInNicosia('Tonight', now)).toBe(true);
    expect(isTodayInNicosia('2026-11-07T20:00:00+02:00', now)).toBe(true);
    expect(isTodayInNicosia('2026-11-20T20:00:00+02:00', now)).toBe(false);
  });
});

describe('2. Money Handling & Rounding', () => {
  it('test 1: rounding — percentage that lands on half a cent rounds according to documented rule (Round-Half-Up)', () => {
    // €2.55 = 255 cents. 10% of 255 = 25.5 cents.
    // Documented rule: commercial round half up -> Math.round(25.5) = 26 cents (€0.26).
    const bonusHalfCent = calculateBonusCents(255, 10);
    expect(bonusHalfCent).toBe(26);

    // €2.45 = 245 cents. 10% of 245 = 24.5 cents -> 25 cents.
    expect(calculateBonusCents(245, 10)).toBe(25);

    // €1.04 = 104 cents. 10% of 104 = 10.4 cents -> 10 cents.
    expect(calculateBonusCents(104, 10)).toBe(10);
  });

  it('test 3: negative and zero amounts are rejected for top-ups, debits, and conversions', () => {
    // Parsing zero or negative amounts
    expect(validateAndParseInputToCents(0).success).toBe(false);
    expect(validateAndParseInputToCents(-10).success).toBe(false);
    expect(validateAndParseInputToCents('-5.50').success).toBe(false);
    expect(validateAndParseInputToCents('abc').success).toBe(false);
    expect(validateAndParseInputToCents('12.345').success).toBe(false); // more than 2 decimals

    // Rejecting zero/negative in credit & debit functions
    expect(() =>
      credit(initialWallet, {
        id: 'bad',
        kind: 'topup',
        amountCents: 0,
        createdAt: new Date().toISOString(),
        label: 'Zero',
        reference: 'TR-0'
      })
    ).toThrow(/strictly greater than zero/);

    expect(() =>
      debit(initialWallet, {
        id: 'bad',
        kind: 'booking',
        amountCents: 0,
        createdAt: new Date().toISOString(),
        label: 'Zero',
        reference: 'TR-0'
      })
    ).toThrow(/strictly greater than zero/);
  });
});

describe('3. Wallet & Bonus Operations', () => {
  it('test 2: bonus — €25, €50, and €100 top-ups produce €2.50, €5.00, and €10.00 bonuses as separate ledger entries without duplication', () => {
    const emptyWallet: Wallet = { balanceCents: 0, entries: [] };

    // €25 top-up (2,500 cents)
    const res25 = processTopupWithBonus(emptyWallet, 2500, { idempotencyKey: 'key-25' });
    expect(res25.topupEntry.amountCents).toBe(2500);
    expect(res25.topupEntry.kind).toBe('topup');
    expect(res25.bonusEntry).toBeDefined();
    expect(res25.bonusEntry?.amountCents).toBe(250); // €2.50
    expect(res25.bonusEntry?.kind).toBe('bonus');
    expect(res25.wallet.balanceCents).toBe(2750); // €27.50
    expect(res25.wallet.entries.length).toBe(2);

    // €50 top-up (5,000 cents)
    const res50 = processTopupWithBonus(emptyWallet, 5000, { idempotencyKey: 'key-50' });
    expect(res50.topupEntry.amountCents).toBe(5000);
    expect(res50.bonusEntry?.amountCents).toBe(500); // €5.00
    expect(res50.wallet.balanceCents).toBe(5500); // €55.00

    // €100 top-up (10,000 cents)
    const res100 = processTopupWithBonus(emptyWallet, 10000, { idempotencyKey: 'key-100' });
    expect(res100.topupEntry.amountCents).toBe(10000);
    expect(res100.bonusEntry?.amountCents).toBe(1000); // €10.00
    expect(res100.wallet.balanceCents).toBe(11000); // €110.00
  });

  it('test 6: double-submit — calling top-up or booking twice with the same idempotency key changes the balance once', () => {
    const emptyWallet: Wallet = { balanceCents: 10000, entries: [] };
    const idempotencyKey = 'unique-submission-token-123';

    // First top-up
    const firstCall = processTopupWithBonus(emptyWallet, 5000, { idempotencyKey });
    expect(firstCall.wallet.balanceCents).toBe(15500); // 10000 + 5000 + 500
    expect(firstCall.wallet.entries.length).toBe(2);

    // Second top-up with identical key (simulating double click or network retry)
    const secondCall = processTopupWithBonus(firstCall.wallet, 5000, { idempotencyKey });
    expect(secondCall.wallet.balanceCents).toBe(15500); // Balance did NOT change again
    expect(secondCall.wallet.entries.length).toBe(2); // No duplicate ledger rows created

    // Double debit test
    const debitKey = 'debit-token-xyz';
    const debitedFirst = debit(firstCall.wallet, {
      id: 'debit-1',
      idempotencyKey: debitKey,
      kind: 'booking',
      amountCents: -2000,
      createdAt: new Date().toISOString(),
      label: 'Table booking',
      reference: 'TR-TEST'
    });
    expect(debitedFirst.balanceCents).toBe(13500);

    const debitedSecond = debit(debitedFirst, {
      id: 'debit-2',
      idempotencyKey: debitKey,
      kind: 'booking',
      amountCents: -2000,
      createdAt: new Date().toISOString(),
      label: 'Table booking retry',
      reference: 'TR-TEST'
    });
    expect(debitedSecond.balanceCents).toBe(13500); // Not debited twice
    expect(debitedSecond.entries.length).toBe(debitedFirst.entries.length);
  });

  it('test 7: invariant — after any sequence of operations, balance equals the sum of the ledger', () => {
    let wallet: Wallet = { balanceCents: 0, entries: [] };
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Operation 1: Top up €25 (+ bonus €2.50)
    wallet = processTopupWithBonus(wallet, 2500, { idempotencyKey: 'op-1' }).wallet;
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Operation 2: Top up €100 (+ bonus €10.00)
    wallet = processTopupWithBonus(wallet, 10000, { idempotencyKey: 'op-2' }).wallet;
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Operation 3: Debit booking €48 (4,800 cents)
    wallet = debit(wallet, {
      id: 'book-1',
      kind: 'booking',
      amountCents: -4800,
      createdAt: new Date().toISOString(),
      label: 'Dinner for 4',
      reference: 'TR-D4'
    });
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Operation 4: Partial refund €20 (2,000 cents)
    wallet = processRefund(wallet, 'book-1', 2000, { reason: 'Party member cancellation' });
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Verify sum directly
    const manualSum = wallet.entries.reduce((sum, e) => sum + e.amountCents, 0);
    expect(wallet.balanceCents).toBe(manualSum);
  });

  it('rejects debits that would drive balance below zero', () => {
    const wallet: Wallet = { balanceCents: 2000, entries: [] };
    expect(() =>
      debit(wallet, {
        id: 'over',
        kind: 'booking',
        amountCents: -2001,
        createdAt: new Date().toISOString(),
        label: 'Overdraft',
        reference: 'TR-OVER'
      })
    ).toThrow(/Insufficient balance/);
  });
});

describe('4. Booking Guard (`canBook`)', () => {
  it('test 4: guest limits — 0 and 5 are rejected, 1 and 4 are accepted', () => {
    // 0 guests rejected
    const g0 = canBook(100, 20, { guests: 0 });
    expect(g0.allowed).toBe(false);
    expect(g0.reason).toBe('guests_out_of_range');

    // 5 guests rejected
    const g5 = canBook(100, 20, { guests: 5 });
    expect(g5.allowed).toBe(false);
    expect(g5.reason).toBe('guests_out_of_range');

    // Negative and decimal guests rejected
    expect(canBook(100, 20, { guests: -1 }).allowed).toBe(false);
    expect(canBook(100, 20, { guests: 2.5 }).allowed).toBe(false);

    // 1 and 4 guests accepted
    expect(canBook(100, 20, { guests: 1 }).allowed).toBe(true);
    expect(canBook(100, 20, { guests: 4 }).allowed).toBe(true);
  });

  it('test 5: exact balance passes; balance minus one cent fails with a one-cent shortfall', () => {
    // Exact balance €20.00 with €20.00 cost must pass
    const exact = canBook(2000, 2000, { guests: 2 });
    expect(exact.allowed).toBe(true);
    expect(exact.shortfallCents).toBe(0);

    // Balance €19.99 with €20.00 cost must fail with €0.01 shortfall
    const shortfallOneCent = canBook(1999, 2000, { guests: 2 });
    expect(shortfallOneCent.allowed).toBe(false);
    expect(shortfallOneCent.reason).toBe('insufficient_balance');
    expect(shortfallOneCent.shortfallCents).toBe(1);
    expect(shortfallOneCent.messageEn).toMatch(/This needs €20.00\. You have €19.99\. Top up €0.01 to continue\./);
    expect(shortfallOneCent.messageEl).toContain('Απαιτούνται');
  });

  it('checks total cost for all guests, not just price per person', () => {
    // €32 per guest x 4 guests = €128. Balance is €100.
    const perGuestCents = 3200;
    const guests = 4;
    const totalCostCents = perGuestCents * guests; // 12800 cents (€128)
    const balanceCents = 10000; // €100

    const guard = canBook(balanceCents, totalCostCents, { guests });
    expect(guard.allowed).toBe(false);
    expect(guard.shortfallCents).toBe(2800); // 12800 - 10000 = 2800 cents (€28)
  });

  it('bypasses wallet balance check when paying by card or external method', () => {
    // Wallet has €0 balance, but customer chooses card payment
    const cardBooking = canBook(0, 10000, { guests: 2, paymentMethod: 'card' });
    expect(cardBooking.allowed).toBe(true);
    expect(cardBooking.shortfallCents).toBe(0);
  });
});

describe('5. Receipts, Ledger & Refunds', () => {
  it('test 8: receipt round-trip — the receipt total matches the ledger entry it references', () => {
    const initial: Wallet = { balanceCents: 5000, entries: [] };
    const chargeCents = 3500; // €35.00
    const chargeRef = 'TR-ROUNDTRIP';

    const debited = debit(initial, {
      id: 'receipt-entry-1',
      kind: 'booking',
      amountCents: -chargeCents,
      createdAt: '2026-11-05T19:30:00+02:00',
      label: 'Kleftiko dinner tasting',
      labelEl: 'Γεύμα κλέφτικο',
      reference: chargeRef,
      paymentMode: 'wallet'
    });

    const entry = debited.entries.find(e => e.reference === chargeRef);
    expect(entry).toBeDefined();

    // Receipt verification
    expect(entry!.reference).toBe(chargeRef);
    expect(Math.abs(entry!.amountCents)).toBe(chargeCents);
    expect(centsToEuro(Math.abs(entry!.amountCents))).toBe(35);
    expect(formatCents(Math.abs(entry!.amountCents))).toBe('€35.00');
    expect(entry!.resultingBalanceCents).toBe(1500); // 5000 - 3500
    expect(entry!.labelEl).toBe('Γεύμα κλέφτικο');
  });

  it('refunds cannot exceed the original booking amount and preserve historical record', () => {
    const initial: Wallet = { balanceCents: 10000, entries: [] };
    const booked = debit(initial, {
      id: 'booking-to-refund',
      kind: 'booking',
      amountCents: -4000, // €40
      createdAt: new Date().toISOString(),
      label: 'Wine tasting',
      reference: 'TR-REFUND-TEST'
    });

    // Valid partial refund €25
    const refunded = processRefund(booked, 'booking-to-refund', 2500);
    expect(refunded.balanceCents).toBe(8500); // 6000 + 2500
    expect(refunded.entries.length).toBe(2);
    expect(refunded.entries[0].kind).toBe('refund');
    expect(refunded.entries[0].amountCents).toBe(2500);

    // Reject refund exceeding original €40
    expect(() => processRefund(booked, 'booking-to-refund', 4001)).toThrow(/exceeds remaining refundable amount/);
  });
});
