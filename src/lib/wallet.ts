import type {
  BookingGuardResult,
  LedgerEntry,
  LedgerEntryKind,
  Wallet
} from '../domain/types';
import {
  calculateBonusCents,
  formatCents,
  MAX_WALLET_BALANCE_CENTS,
  validateAmount
} from './money';

/**
 * Generates a unique, non-colliding reference string (P0-8).
 * Tries up to 5 times with 'TR-' plus the first 12 hex characters of crypto.randomUUID().
 * Throws if all 5 attempts collide. Never returns a duplicate.
 */
export function generateReference(wallet?: Wallet): string {
  const existingRefs = new Set(wallet?.entries.map(e => e.reference) ?? []);

  for (let attempt = 0; attempt < 5; attempt++) {
    const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    const candidate = `TR-${hex}`;
    if (!existingRefs.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not generate a unique transaction reference');
}

/**
 * Invariant Checker:
 * Verifies that the wallet's balanceCents strictly equals the sum of all its ledger entry amountCents.
 */
export function verifyWalletInvariant(wallet: Wallet): boolean {
  const sumCents = wallet.entries.reduce((acc, entry) => acc + entry.amountCents, 0);
  return wallet.balanceCents === sumCents;
}

/**
 * Pure function: Debits the wallet balance by a given amount in cents.
 * Rejects if debit exceeds balance (cannot go below zero) or if idempotencyKey was already used.
 */
export function debit(
  wallet: Wallet,
  entry: Omit<LedgerEntry, 'resultingBalanceCents'> & {
    amountCents: number;
    kind: 'booking';
  }
): Wallet {
  const debitCents = Math.abs(entry.amountCents);

  if (debitCents <= 0) {
    throw new Error('Debit amount must be strictly greater than zero');
  }

  // Idempotency check: if key already exists, return current wallet unchanged
  if (entry.idempotencyKey && wallet.entries.some(e => e.idempotencyKey === entry.idempotencyKey)) {
    return wallet;
  }

  if (wallet.balanceCents < debitCents) {
    throw new Error(
      `Insufficient balance: cannot debit ${formatCents(debitCents)} from available ${formatCents(wallet.balanceCents)}`
    );
  }

  const resultingBalanceCents = wallet.balanceCents - debitCents;
  const fullEntry: LedgerEntry = {
    ...entry,
    kind: entry.kind,
    amountCents: -debitCents,
    resultingBalanceCents,
    createdAt: entry.createdAt || new Date().toISOString(),
    reference: entry.reference || generateReference(wallet)
  };

  return {
    balanceCents: resultingBalanceCents,
    entries: [fullEntry, ...wallet.entries]
  };
}

/**
 * Pure function: Credits the wallet balance by a given amount in cents.
 * Rejects negative/zero amounts, prevents exceeding max balance, and honors idempotency.
 */
export function credit(
  wallet: Wallet,
  entry: Omit<LedgerEntry, 'resultingBalanceCents'> & {
    amountCents: number;
    kind: LedgerEntryKind;
  }
): Wallet {
  const creditCents = Math.abs(entry.amountCents);

  if (creditCents <= 0) {
    throw new Error('Credit amount must be strictly greater than zero');
  }

  // Idempotency check
  if (entry.idempotencyKey && wallet.entries.some(e => e.idempotencyKey === entry.idempotencyKey)) {
    return wallet;
  }

  if (wallet.balanceCents + creditCents > MAX_WALLET_BALANCE_CENTS) {
    throw new Error(
      `Credit exceeds maximum wallet limit of ${formatCents(MAX_WALLET_BALANCE_CENTS)}`
    );
  }

  const resultingBalanceCents = wallet.balanceCents + creditCents;
  const fullEntry: LedgerEntry = {
    ...entry,
    kind: entry.kind,
    amountCents: creditCents,
    resultingBalanceCents,
    createdAt: entry.createdAt || new Date().toISOString(),
    reference: entry.reference || generateReference(wallet)
  };

  return {
    balanceCents: resultingBalanceCents,
    entries: [fullEntry, ...wallet.entries]
  };
}

/**
 * Processes a top-up with the 10% bonus rule.
 *
 * P0-4: Checks both base key and bonus key upfront. Returns both entries on replay.
 * P0-5: Max balance check is ATOMIC across top-up + bonus before any entry is created.
 */
export function processTopupWithBonus(
  wallet: Wallet,
  topupAmountCents: number,
  options?: {
    idempotencyKey?: string;
    label?: string;
    labelEl?: string;
    createdAt?: string;
  }
): {
  wallet: Wallet;
  topupEntry: LedgerEntry;
  bonusEntry?: LedgerEntry;
} {
  // Validate top-up bounds
  const validation = validateAmount(topupAmountCents, 'topup');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const baseKey = options?.idempotencyKey;
  const bonusKey = baseKey ? `${baseKey}-bonus` : undefined;

  // P0-4: Upfront idempotency check for both entries
  if (baseKey) {
    const existingTopup = wallet.entries.find(e => e.idempotencyKey === baseKey);
    const existingBonus = wallet.entries.find(e => e.idempotencyKey === bonusKey);

    if (existingTopup) {
      const bonusExpected = calculateBonusCents(topupAmountCents, 10) > 0;
      if (bonusExpected && !existingBonus) {
        throw new Error(
          `Corrupted transaction state: topup entry exists for key "${baseKey}" but associated bonus entry is missing.`
        );
      }
      return {
        wallet,
        topupEntry: existingTopup,
        bonusEntry: existingBonus
      };
    }
  }

  // P1-1: Integer bonus calculation
  const bonusCents = calculateBonusCents(topupAmountCents, 10);
  const totalAdditionCents = topupAmountCents + bonusCents;

  // P0-5: Atomic max-balance check before any entry is created
  if (wallet.balanceCents + totalAdditionCents > MAX_WALLET_BALANCE_CENTS) {
    throw new Error(
      `Top-up of ${formatCents(topupAmountCents)} plus bonus of ${formatCents(bonusCents)} (${formatCents(totalAdditionCents)}) exceeds maximum wallet limit of ${formatCents(MAX_WALLET_BALANCE_CENTS)}`
    );
  }

  const createdAt = options?.createdAt || new Date().toISOString();
  const topupRef = generateReference(wallet);

  // 1. Credit base top-up
  const topupEntryData = {
    id: crypto.randomUUID(),
    idempotencyKey: baseKey,
    kind: 'topup' as const,
    amountCents: topupAmountCents,
    createdAt,
    label: options?.label || 'Wallet top-up',
    labelEl: options?.labelEl || 'Φόρτιση πορτοφολιού',
    reference: topupRef,
    paymentMode: 'card' as const
  };

  let currentWallet = credit(wallet, topupEntryData);
  const createdTopupEntry = currentWallet.entries[0];

  // 2. Credit 10% bonus as separate ledger entry
  let createdBonusEntry: LedgerEntry | undefined;
  if (bonusCents > 0) {
    const bonusEntryData = {
      id: crypto.randomUUID(),
      idempotencyKey: bonusKey,
      kind: 'bonus' as const,
      amountCents: bonusCents,
      createdAt,
      label: 'Top-up 10% bonus credit',
      labelEl: 'Bonus 10% φόρτισης πορτοφολιού',
      reference: `${topupRef}-BONUS`,
      paymentMode: 'wallet' as const,
      bonusCents
    };

    currentWallet = credit(currentWallet, bonusEntryData);
    createdBonusEntry = currentWallet.entries[0];
  }

  return {
    wallet: currentWallet,
    topupEntry: createdTopupEntry,
    bonusEntry: createdBonusEntry
  };
}

/**
 * Processes a refund for a previously settled booking entry.
 *
 * P0-1: Tracks cumulative refunded amounts per booking; rejects if sum > original charge.
 * P0-2: Explicit check: refundAmountCents === undefined refunds remaining balance. 0 or invalid throws.
 * P0-3: Supports idempotencyKey to prevent duplicate refunds.
 */
export function processRefund(
  wallet: Wallet,
  bookingEntryId: string,
  refundAmountCents?: number,
  options?: {
    idempotencyKey?: string;
    reason?: string;
  }
): Wallet {
  // P0-3: Idempotency check
  if (
    options?.idempotencyKey &&
    wallet.entries.some(e => e.idempotencyKey === options.idempotencyKey)
  ) {
    return wallet;
  }

  const original = wallet.entries.find(e => e.id === bookingEntryId);
  if (!original) {
    throw new Error(`Transaction entry not found: ${bookingEntryId}`);
  }

  if (original.kind !== 'booking') {
    throw new Error(`Cannot refund entry of kind: ${original.kind}`);
  }

  const originalChargeCents = Math.abs(original.amountCents);

  // P0-1: Sum all previous refunds for this booking
  const alreadyRefundedCents = wallet.entries
    .filter(e => e.kind === 'refund' && e.meta?.originalEntryId === bookingEntryId)
    .reduce((sum, e) => sum + e.amountCents, 0);

  const remainingRefundableCents = originalChargeCents - alreadyRefundedCents;

  if (remainingRefundableCents <= 0) {
    throw new Error(
      `Booking ${bookingEntryId} has already been fully refunded (€${(originalChargeCents / 100).toFixed(2)} refunded).`
    );
  }

  // P0-2: Explicit refund amount determination
  let amountToRefundCents: number;
  if (refundAmountCents === undefined) {
    amountToRefundCents = remainingRefundableCents;
  } else {
    if (!Number.isInteger(refundAmountCents) || refundAmountCents <= 0) {
      throw new Error(
        `Refund amount must be a positive integer in cents, received: ${refundAmountCents}`
      );
    }
    amountToRefundCents = refundAmountCents;
  }

  // P0-1: Reject if requested exceeds remaining refundable amount
  if (amountToRefundCents > remainingRefundableCents) {
    throw new Error(
      `Refund amount of ${formatCents(amountToRefundCents)} exceeds remaining refundable amount of ${formatCents(remainingRefundableCents)}.`
    );
  }

  const refundEntryData = {
    id: crypto.randomUUID(),
    idempotencyKey: options?.idempotencyKey,
    kind: 'refund' as const,
    amountCents: amountToRefundCents,
    createdAt: new Date().toISOString(),
    label: `Refund: ${original.label}`,
    labelEl: `Επιστροφή: ${original.label}`,
    reference: generateReference(wallet),
    paymentMode: 'wallet' as const,
    meta: {
      originalEntryId: original.id,
      originalReference: original.reference,
      reason: options?.reason,
      remainingAfterThisRefundCents: remainingRefundableCents - amountToRefundCents
    }
  };

  return credit(wallet, refundEntryData);
}

/**
 * Booking Guard (P1-4, P1-5):
 *
 * Rules:
 * 1. Units: Strictly integer cents for balanceCents and totalCents. No float or isCents option.
 * 2. Guests: REQUIRED in options. Must be an integer between 1 and 4.
 * 3. Payment method: Card/cash bypasses wallet balance check.
 * 4. Exact balance: Allowed (totalCents <= balanceCents).
 * 5. Shortfall: Calculated as totalCents - balanceCents.
 */
export function canBook(
  balanceCents: number,
  totalCents: number,
  options: {
    guests: number;
    paymentMethod?: 'wallet' | 'card' | 'qr' | 'cash';
  }
): BookingGuardResult {
  if (!Number.isInteger(balanceCents) || balanceCents < 0) {
    throw new Error(`Invalid balance in cents: ${balanceCents}`);
  }
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error(`Invalid total in cents: ${totalCents}`);
  }

  const { guests, paymentMethod = 'wallet' } = options;

  // P1-5: Validate required guest limits (1 to 4)
  if (!Number.isInteger(guests) || guests < 1 || guests > 4) {
    return {
      allowed: false,
      reason: 'guests_out_of_range',
      shortfallCents: 0,
      messageEn: 'Guests must be between 1 and 4 guests.',
      messageEl: 'Ο αριθμός επισκεπτών πρέπει να είναι μεταξύ 1 και 4.'
    };
  }

  // Non-wallet payments bypass balance check
  if (paymentMethod !== 'wallet') {
    return {
      allowed: true,
      shortfallCents: 0
    };
  }

  // Exact balance or sufficient funds
  if (totalCents <= balanceCents) {
    return {
      allowed: true,
      shortfallCents: 0
    };
  }

  // Insufficient balance shortfall calculation
  const shortfallCents = totalCents - balanceCents;

  const messageEn = `This needs ${formatCents(totalCents)}. You have ${formatCents(balanceCents)}. Top up ${formatCents(shortfallCents)} to continue.`;
  const messageEl = `Απαιτούνται ${formatCents(totalCents, 'el-CY')}. Έχετε ${formatCents(balanceCents, 'el-CY')}. Συμπληρώστε ${formatCents(shortfallCents, 'el-CY')} για να συνεχίσετε.`;

  return {
    allowed: false,
    reason: 'insufficient_balance',
    shortfallCents,
    messageEn,
    messageEl
  };
}
