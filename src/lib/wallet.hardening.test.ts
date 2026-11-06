import { describe, expect, it, vi } from 'vitest';
import type { Wallet } from '../domain/types';
import {
  calculateBonusCents,
  euro,
  euroToCents,
  validateAmount
} from './money';
import {
  canBook,
  debit,
  generateReference,
  processRefund,
  processTopupWithBonus,
  verifyWalletInvariant
} from './wallet';

describe('Wallet Hardening & Audit Fixes (P0, P1, P2)', () => {
  // Test 1: P0-1
  it('1. Second refund of the same booking is rejected (P0-1)', () => {
    const initialWallet: Wallet = { balanceCents: 5000, entries: [] };
    const bookedWallet = debit(initialWallet, {
      id: 'booking-20',
      kind: 'booking',
      amountCents: -2000, // €20.00
      createdAt: new Date().toISOString(),
      label: 'Tasting menu',
      reference: 'TR-BOOK20'
    });
    expect(bookedWallet.balanceCents).toBe(3000);

    // First full refund of €20 succeeds
    const refundedOnce = processRefund(bookedWallet, 'booking-20', 2000);
    expect(refundedOnce.balanceCents).toBe(5000);

    // Second refund of any amount must fail
    expect(() => processRefund(refundedOnce, 'booking-20', 100)).toThrow(
      /already been fully refunded/
    );
    expect(() => processRefund(refundedOnce, 'booking-20')).toThrow(
      /already been fully refunded/
    );
  });

  // Test 2: P0-1
  it('2. Partial refunds sum to no more than the original charge (P0-1)', () => {
    const initialWallet: Wallet = { balanceCents: 5000, entries: [] };
    const bookedWallet = debit(initialWallet, {
      id: 'booking-split',
      kind: 'booking',
      amountCents: -2000, // €20.00
      createdAt: new Date().toISOString(),
      label: 'Dinner for two',
      reference: 'TR-SPLIT'
    });

    // Refund €12.00 (1200 cents) succeeds
    const refund1 = processRefund(bookedWallet, 'booking-split', 1200);
    expect(refund1.balanceCents).toBe(4200);

    // Refund €8.00 (800 cents) succeeds (total refunded €20.00)
    const refund2 = processRefund(refund1, 'booking-split', 800);
    expect(refund2.balanceCents).toBe(5000);

    // Third refund of €1.00 (100 cents) fails with remaining refundable amount in message
    expect(() => processRefund(refund2, 'booking-split', 100)).toThrow(
      /already been fully refunded/
    );

    // Try a partial refund that would exceed the remaining amount
    const partialBooking = debit(initialWallet, {
      id: 'booking-over',
      kind: 'booking',
      amountCents: -2000,
      createdAt: new Date().toISOString(),
      label: 'Wine pairing',
      reference: 'TR-OVER'
    });
    const refundPart = processRefund(partialBooking, 'booking-over', 1500); // 1500 refunded, 500 left
    expect(() => processRefund(refundPart, 'booking-over', 600)).toThrow(
      /Refund amount of €6\.00 exceeds remaining refundable amount of €5\.00/
    );
  });

  // Test 3: P0-2
  it('3. Refund of 0 throws; omitted amount refunds the remaining balance (P0-2)', () => {
    const initialWallet: Wallet = { balanceCents: 5000, entries: [] };
    const bookedWallet = debit(initialWallet, {
      id: 'booking-p02',
      kind: 'booking',
      amountCents: -3500, // €35.00
      createdAt: new Date().toISOString(),
      label: 'Chef table',
      reference: 'TR-P02'
    });

    // 0 amount throws
    expect(() => processRefund(bookedWallet, 'booking-p02', 0)).toThrow(
      /Refund amount must be a positive integer in cents/
    );
    // Negative amount throws
    expect(() => processRefund(bookedWallet, 'booking-p02', -500)).toThrow(
      /Refund amount must be a positive integer in cents/
    );
    // Non-integer amount throws
    expect(() => processRefund(bookedWallet, 'booking-p02', 12.5)).toThrow(
      /Refund amount must be a positive integer in cents/
    );

    // Omitted amount refunds full remaining balance
    const fullRefund = processRefund(bookedWallet, 'booking-p02');
    expect(fullRefund.balanceCents).toBe(5000);
    const refundEntry = fullRefund.entries.find(e => e.kind === 'refund');
    expect(refundEntry?.amountCents).toBe(3500);
  });

  // Test 4: P0-3
  it('4. Duplicate refund key creates one entry, balance changes once (P0-3)', () => {
    const initialWallet: Wallet = { balanceCents: 5000, entries: [] };
    const bookedWallet = debit(initialWallet, {
      id: 'booking-idemp',
      kind: 'booking',
      amountCents: -2500,
      createdAt: new Date().toISOString(),
      label: 'Hearthside event',
      reference: 'TR-IDEMP'
    });

    const refundKey = 'refund-tx-unique-999';

    // First refund call
    const refundOnce = processRefund(bookedWallet, 'booking-idemp', 2500, {
      idempotencyKey: refundKey
    });
    expect(refundOnce.balanceCents).toBe(5000);
    const initialEntryCount = refundOnce.entries.length;

    // Second refund call with same idempotency key
    const refundTwice = processRefund(refundOnce, 'booking-idemp', 2500, {
      idempotencyKey: refundKey
    });
    expect(refundTwice.balanceCents).toBe(5000);
    expect(refundTwice.entries.length).toBe(initialEntryCount);
  });

  // Test 5: P0-4
  it('5. Replayed top-up returns both entries, balance unchanged (P0-4)', () => {
    const emptyWallet: Wallet = { balanceCents: 1000, entries: [] };
    const topupKey = 'topup-session-abc-42';

    // First top-up of €50 (5000 cents) -> bonus is €5 (500 cents)
    const result1 = processTopupWithBonus(emptyWallet, 5000, {
      idempotencyKey: topupKey,
      label: 'Top-up €50'
    });
    expect(result1.wallet.balanceCents).toBe(6500); // 1000 + 5000 + 500
    expect(result1.topupEntry.amountCents).toBe(5000);
    expect(result1.bonusEntry?.amountCents).toBe(500);

    // Replay with identical key
    const result2 = processTopupWithBonus(result1.wallet, 5000, {
      idempotencyKey: topupKey,
      label: 'Top-up €50 retry'
    });
    // Balance unchanged
    expect(result2.wallet.balanceCents).toBe(6500);
    // Both entries returned
    expect(result2.topupEntry.id).toBe(result1.topupEntry.id);
    expect(result2.bonusEntry?.id).toBe(result1.bonusEntry?.id);
    expect(result2.wallet.entries.length).toBe(result1.wallet.entries.length);

    // Verify error if base entry exists but bonus entry is missing
    const corruptedWallet: Wallet = {
      balanceCents: 6000,
      entries: [result1.topupEntry] // bonus missing
    };
    expect(() =>
      processTopupWithBonus(corruptedWallet, 5000, { idempotencyKey: topupKey })
    ).toThrow(/associated bonus entry is missing/);
  });

  // Test 6: P0-5
  it('6. Top-up plus bonus at/above cap is rejected atomically without modifying wallet (P0-5)', () => {
    // Wallet at €1,990.00 (199,000 cents)
    const nearCapWallet: Wallet = { balanceCents: 199_000, entries: [] };

    // Attempting a €100 top-up (10,000 cents) + €10 bonus (1,000 cents) = €110 total (11,000 cents)
    // 199,000 + 11,000 = 210,000 cents (€2,100), which exceeds €2,000 cap (200,000 cents)
    expect(() =>
      processTopupWithBonus(nearCapWallet, 10_000, { idempotencyKey: 'cap-exceeded' })
    ).toThrow(/exceeds maximum wallet limit of €2,000\.00/);

    // Verify wallet is completely unmodified
    expect(nearCapWallet.balanceCents).toBe(199_000);
    expect(nearCapWallet.entries.length).toBe(0);
  });

  // Test 7: P0-6
  it('7. Invalid euro strings are rejected and valid accepted (P0-6)', () => {
    const rejectedInputs = [
      '1e2',
      '0x1A',
      'Infinity',
      '-5',
      '12.345',
      '',
      '  ',
      '12,50',
      '€12',
      '+12.50'
    ];

    for (const input of rejectedInputs) {
      expect(
        () => euroToCents(input),
        `Expected euroToCents("${input}") to throw`
      ).toThrow();
    }

    // Accepted inputs
    expect(euroToCents('12')).toBe(1200);
    expect(euroToCents('12.5')).toBe(1250);
    expect(euroToCents('12.50')).toBe(1250);
    expect(euroToCents('0.01')).toBe(1);
  });

  // Test 8: P0-7
  it('8. Number with more than two decimals is rejected (P0-7)', () => {
    expect(() => euroToCents(12.345)).toThrow(/Invalid euro precision: 12.345/);
    expect(() => euroToCents(0.001)).toThrow(/Invalid euro precision: 0.001/);
    expect(euroToCents(12.34)).toBe(1234);
    expect(euroToCents(12)).toBe(1200);
  });

  // Test 9: P0-8
  it('9. 10,000 references are unique (P0-8)', () => {
    const refs = new Set<string>();
    const mockWallet: Wallet = { balanceCents: 0, entries: [] };

    for (let i = 0; i < 10000; i++) {
      const ref = generateReference(mockWallet);
      expect(refs.has(ref)).toBe(false);
      refs.add(ref);
    }

    expect(refs.size).toBe(10000);
  });

  // Test 10: P1-1
  it('10. Bonus rounding on 255 cents returns 26 cents; 2500 cents returns 250 cents (P1-1)', () => {
    expect(calculateBonusCents(255)).toBe(26);
    expect(calculateBonusCents(2500)).toBe(250);
    expect(calculateBonusCents(104)).toBe(10);
    expect(calculateBonusCents(245)).toBe(25);
  });

  // Test 11: P2-2
  it('11. Invariant holds across the full sequence (P2-2)', () => {
    let wallet: Wallet = { balanceCents: 0, entries: [] };
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Step 1: Top up €50 (+ bonus €5.00)
    const topupRes = processTopupWithBonus(wallet, 5000, { idempotencyKey: 'seq-topup' });
    wallet = topupRes.wallet;
    expect(wallet.balanceCents).toBe(5500);
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Step 2: Book table for €30 (3,000 cents)
    wallet = debit(wallet, {
      id: 'seq-booking-1',
      kind: 'booking',
      amountCents: -3000,
      createdAt: new Date().toISOString(),
      label: 'Table for 2 at Patrika',
      reference: 'TR-SEQ-1'
    });
    expect(wallet.balanceCents).toBe(2500);
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Step 3: Refund booking partially by €10 (1,000 cents)
    wallet = processRefund(wallet, 'seq-booking-1', 1000, {
      idempotencyKey: 'seq-refund-1',
      reason: 'Partial cancellation'
    });
    expect(wallet.balanceCents).toBe(3500);
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Step 4: Second booking for €20 (2,000 cents)
    wallet = debit(wallet, {
      id: 'seq-booking-2',
      kind: 'booking',
      amountCents: -2000,
      createdAt: new Date().toISOString(),
      label: 'Hearthside tasting',
      reference: 'TR-SEQ-2'
    });
    expect(wallet.balanceCents).toBe(1500);
    expect(verifyWalletInvariant(wallet)).toBe(true);

    // Double check manual ledger sum
    const sum = wallet.entries.reduce((acc, entry) => acc + entry.amountCents, 0);
    expect(wallet.balanceCents).toBe(sum);
  });

  // Additional P1 checks: P1-3, P1-4, P1-5
  it('P1-3: Single validator validateAmount enforces €500 top-up cap and €0.01 minimum', () => {
    expect(validateAmount(60000, 'topup').valid).toBe(false);
    expect(validateAmount(50000, 'topup').valid).toBe(true);
    expect(validateAmount(0, 'topup').valid).toBe(false);
    expect(validateAmount(-100, 'topup').valid).toBe(false);
  });

  it('P1-4: canBook accepts cents only and returns exact shortfall in cents', () => {
    const result = canBook(2000, 2400, { guests: 2 });
    expect(result.allowed).toBe(false);
    expect(result.shortfallCents).toBe(400);
  });

  it('P1-5: canBook requires guests and validates 1-4 bounds', () => {
    expect(canBook(5000, 2000, { guests: 1 }).allowed).toBe(true);
    expect(canBook(5000, 2000, { guests: 4 }).allowed).toBe(true);
    expect(canBook(5000, 2000, { guests: 0 }).allowed).toBe(false);
    expect(canBook(5000, 2000, { guests: 5 }).allowed).toBe(false);
  });

  // Fix E: Required new tests
  it('E1: Partial refunds get distinct references and originalReference in meta', () => {
    const initialWallet: Wallet = { balanceCents: 5000, entries: [] };
    const bookedWallet = debit(initialWallet, {
      id: 'booking-distinct-ref',
      kind: 'booking',
      amountCents: -2000, // €20.00
      createdAt: new Date().toISOString(),
      label: 'Dinner',
      reference: 'TR-ORIG-BOOKING'
    });

    const refund1 = processRefund(bookedWallet, 'booking-distinct-ref', 1200);
    const refund2 = processRefund(refund1, 'booking-distinct-ref', 800);

    const refundEntry1 = refund2.entries.find(e => e.amountCents === 1200);
    const refundEntry2 = refund2.entries.find(e => e.amountCents === 800);

    expect(refundEntry1).toBeDefined();
    expect(refundEntry2).toBeDefined();
    expect(refundEntry1?.reference).not.toBe(refundEntry2?.reference);
    expect(refundEntry1?.meta?.originalReference).toBe('TR-ORIG-BOOKING');
    expect(refundEntry2?.meta?.originalReference).toBe('TR-ORIG-BOOKING');
  });

  it('E2: Reference generation throws when all attempts collide', () => {
    const fixedUuid = '01234567-89ab-cdef-0123-456789abcdef';
    const currentRef = 'TR-89ABCDEF';
    const newRef = 'TR-0123456789AB';
    const walletWithExistingRef: Wallet = {
      balanceCents: 0,
      entries: [
        {
          id: 'existing-1',
          kind: 'topup',
          amountCents: 1000,
          resultingBalanceCents: 1000,
          createdAt: new Date().toISOString(),
          label: 'Existing',
          reference: currentRef
        },
        {
          id: 'existing-2',
          kind: 'topup',
          amountCents: 1000,
          resultingBalanceCents: 1000,
          createdAt: new Date().toISOString(),
          label: 'Existing',
          reference: newRef
        }
      ]
    };

    const spy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(fixedUuid as `${string}-${string}-${string}-${string}-${string}`);
    try {
      expect(() => generateReference(walletWithExistingRef)).toThrow(/unique transaction reference/);
    } finally {
      spy.mockRestore();
    }
  });

  it('E3: 1% bonus is 1%', () => {
    expect(calculateBonusCents(10000, 1)).toBe(100);
  });

  it('E4: 10% bonus rounds half up', () => {
    expect(calculateBonusCents(255, 10)).toBe(26);
  });

  it('E5: Decimal rate is rejected', () => {
    expect(() => calculateBonusCents(10000, 0.1)).toThrow();
  });

  it('E6: Shortfall field is cents only', () => {
    const res = canBook(2000, 2400, { guests: 2 });
    expect(res.shortfallCents).toBe(400);
    expect('shortfall' in res).toBe(false);
  });

  it('P0-8: generateReference retries past a colliding reference and succeeds on unique attempt', () => {
    const collidingUuid = '01234567-89ab-cdef-0123-456789abcdef'; // produces TR-0123456789AB
    const uniqueUuid = 'fedcba98-7654-3210-fedc-ba9876543210';   // produces TR-FEDCBA987654
    const walletWithCollision: Wallet = {
      balanceCents: 0,
      entries: [
        {
          id: 'colliding-entry',
          kind: 'topup',
          amountCents: 1000,
          resultingBalanceCents: 1000,
          createdAt: new Date().toISOString(),
          label: 'Colliding',
          reference: 'TR-0123456789AB'
        }
      ]
    };

    let callCount = 0;
    const spy = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      callCount++;
      return (callCount === 1 ? collidingUuid : uniqueUuid) as `${string}-${string}-${string}-${string}-${string}`;
    });

    try {
      const ref = generateReference(walletWithCollision);
      expect(ref).toBe('TR-FEDCBA987654');
      expect(callCount).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });

  it('Refund cap decision: refunds enforce the €2,000 balance cap and reject over-cap balances', () => {
    const walletNearCap: Wallet = {
      balanceCents: 199_000,
      entries: [
        {
          id: 'prior-booking',
          kind: 'booking',
          amountCents: -3000,
          resultingBalanceCents: 199_000,
          createdAt: new Date().toISOString(),
          label: 'Pre-ordered tasting',
          reference: 'TR-PRIOR'
        }
      ]
    };

    // 199,000 + 3,000 = 202,000 cents (€2,020.00), exceeding €2,000 cap
    expect(() => processRefund(walletNearCap, 'prior-booking', 3000)).toThrow(
      /Credit exceeds maximum wallet limit of €2,000\.00/
    );

    // Verify wallet is unchanged
    expect(walletNearCap.balanceCents).toBe(199_000);
  });

  it('Step 1: euro() accepts only finite euro amounts and rejects non-finite values', () => {
    expect(euro(12.5)).toBe('€12.50');
    expect(euro(0)).toBe('€0.00');
    expect(euro(48.1)).toBe('€48.10');
    expect(() => euro(NaN)).toThrow(/euro\(\) received a non-finite amount: NaN/);
    expect(() => euro(Infinity)).toThrow(/euro\(\) received a non-finite amount: Infinity/);
    expect(() => euro(-Infinity)).toThrow(/euro\(\) received a non-finite amount: -Infinity/);
  });
});
