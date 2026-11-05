import type {
  BookingGuardResult,
  LedgerEntry,
  Wallet
} from '../domain/types';
import {
  calculateBonusCents,
  centsToEuro,
  euro,
  formatCents,
  MAX_WALLET_BALANCE_CENTS
} from './money';

/**
 * Creates a unique reference number formatted as TR-XXXX.
 */
export function generateReference(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TR-${num}`;
}

/**
 * Verifies the fundamental financial invariant:
 * Wallet balance MUST equal the sum of all ledger entries.
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
  entry: Omit<LedgerEntry, 'resultingBalanceCents' | 'amountCredits'> & {
    amountCents: number;
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
    kind: entry.kind || 'booking',
    amountCents: -debitCents,
    amountCredits: -centsToEuro(debitCents),
    resultingBalanceCents,
    createdAt: entry.createdAt || new Date().toISOString(),
    reference: entry.reference || generateReference()
  };

  const updatedWallet: Wallet = {
    balanceCents: resultingBalanceCents,
    balanceCredits: centsToEuro(resultingBalanceCents),
    entries: [fullEntry, ...wallet.entries]
  };

  return updatedWallet;
}

/**
 * Pure function: Credits the wallet balance by a given amount in cents.
 * Rejects negative/zero amounts, prevents exceeding max balance, and honors idempotency.
 */
export function credit(
  wallet: Wallet,
  entry: Omit<LedgerEntry, 'resultingBalanceCents' | 'amountCredits'> & {
    amountCents: number;
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
    kind: entry.kind || 'topup',
    amountCents: creditCents,
    amountCredits: centsToEuro(creditCents),
    resultingBalanceCents,
    createdAt: entry.createdAt || new Date().toISOString(),
    reference: entry.reference || generateReference()
  };

  const updatedWallet: Wallet = {
    balanceCents: resultingBalanceCents,
    balanceCredits: centsToEuro(resultingBalanceCents),
    entries: [fullEntry, ...wallet.entries]
  };

  return updatedWallet;
}

/**
 * Processes a top-up with the 10% bonus rule.
 * Crucial Rule: The 10% bonus is recorded as a SEPARATE ledger entry labeled as bonus,
 * keeping accounting honest and itemized.
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
  if (topupAmountCents <= 0) {
    throw new Error('Top-up amount must be strictly positive');
  }

  // Check idempotency upfront
  if (
    options?.idempotencyKey &&
    wallet.entries.some(e => e.idempotencyKey === options.idempotencyKey)
  ) {
    const existing = wallet.entries.find(e => e.idempotencyKey === options.idempotencyKey)!;
    return { wallet, topupEntry: existing };
  }

  const createdAt = options?.createdAt || new Date().toISOString();
  const topupRef = generateReference();

  // 1. Credit base top-up
  const topupEntryData = {
    id: crypto.randomUUID(),
    idempotencyKey: options?.idempotencyKey,
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

  // 2. Calculate 10% bonus using Round-Half-Up
  const bonusCents = calculateBonusCents(topupAmountCents, 0.1);
  let createdBonusEntry: LedgerEntry | undefined;

  if (bonusCents > 0) {
    const bonusEntryData = {
      id: crypto.randomUUID(),
      idempotencyKey: options?.idempotencyKey ? `${options.idempotencyKey}-bonus` : undefined,
      kind: 'bonus' as const,
      amountCents: bonusCents,
      createdAt,
      label: 'Top-up 10% bonus credit',
      labelEl: 'Bonus 10% φόρτισης πορτοφολιού',
      reference: `${topupRef}-BONUS`,
      paymentMode: 'wallet' as const,
      bonusCredits: centsToEuro(bonusCents)
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
 * Reverses the amount without mutating or deleting the historical record.
 */
export function processRefund(
  wallet: Wallet,
  bookingEntryId: string,
  refundAmountCents?: number,
  options?: { reason?: string }
): Wallet {
  const original = wallet.entries.find(e => e.id === bookingEntryId);
  if (!original) {
    throw new Error(`Transaction entry not found: ${bookingEntryId}`);
  }

  if (original.kind !== 'booking') {
    throw new Error(`Cannot refund entry of kind: ${original.kind}`);
  }

  const maxRefundable = Math.abs(original.amountCents);
  const amountToRefund = refundAmountCents ? Math.abs(refundAmountCents) : maxRefundable;

  if (amountToRefund <= 0 || amountToRefund > maxRefundable) {
    throw new Error(
      `Refund amount of ${formatCents(amountToRefund)} exceeds original booking charge of ${formatCents(maxRefundable)}`
    );
  }

  const refundEntryData = {
    id: crypto.randomUUID(),
    kind: 'refund' as const,
    amountCents: amountToRefund,
    createdAt: new Date().toISOString(),
    label: `Refund: ${original.label}`,
    labelEl: `Επιστροφή: ${original.label}`,
    reference: `${original.reference}-REFUND`,
    meta: { originalEntryId: original.id, reason: options?.reason }
  };

  return credit(wallet, refundEntryData);
}

/**
 * Booking Guard: Validates whether a reservation can proceed.
 *
 * Rules:
 * 1. Guests: strictly integer between 1 and 4. Values <= 0, > 4, or decimals are rejected.
 * 2. Total cost: unit price * guests.
 * 3. Exact balance: passes (e.g. balance €20, total €20 -> allowed: true).
 * 4. Insufficient balance: blocked, calculates exact shortfall in euros and cents.
 * 5. Non-wallet payment: if paying by card or cash, wallet balance is not checked.
 * 6. Generates bilingual messages in English and Greek.
 */
export function canBook(
  balanceCreditsOrCents: number,
  totalCreditsOrCents: number,
  options?: {
    guests?: number;
    paymentMethod?: 'wallet' | 'card' | 'qr' | 'cash';
    isCents?: boolean;
  }
): BookingGuardResult {
  const isCents = options?.isCents ?? false;
  const balanceCents = isCents
    ? Math.round(balanceCreditsOrCents)
    : Math.round(balanceCreditsOrCents * 100);

  const totalCents = isCents
    ? Math.round(totalCreditsOrCents)
    : Math.round(totalCreditsOrCents * 100);

  const guests = options?.guests;
  const paymentMethod = options?.paymentMethod ?? 'wallet';

  // 1. Validate Guest limits (1 to 4)
  if (guests !== undefined) {
    if (!Number.isInteger(guests) || guests < 1 || guests > 4) {
      return {
        allowed: false,
        reason: 'guests_out_of_range',
        shortfallCents: 0,
        shortfall: 0,
        messageEn: 'Guests must be between 1 and 4 guests.',
        messageEl: 'Ο αριθμός επισκεπτών πρέπει να είναι μεταξύ 1 και 4.'
      };
    }
  }

  // 2. Non-wallet payment bypasses balance check
  if (paymentMethod !== 'wallet') {
    return {
      allowed: true,
      shortfallCents: 0,
      shortfall: 0
    };
  }

  // 3. Exact balance or sufficient balance
  if (totalCents <= balanceCents) {
    return {
      allowed: true,
      shortfallCents: 0,
      shortfall: 0
    };
  }

  // 4. Insufficient balance shortfall calculation
  const shortfallCents = totalCents - balanceCents;
  const shortfallEur = centsToEuro(shortfallCents);
  const totalEur = centsToEuro(totalCents);
  const balanceEur = centsToEuro(balanceCents);

  const messageEn = `This needs ${euro(totalEur)}. You have ${euro(balanceEur)}. Top up ${euro(shortfallEur)} to continue.`;
  const messageEl = `Απαιτούνται ${euro(totalEur, 'el-CY')}. Έχετε ${euro(balanceEur, 'el-CY')}. Συμπληρώστε ${euro(shortfallEur, 'el-CY')} για να συνεχίσετε.`;

  return {
    allowed: false,
    reason: 'insufficient_balance',
    shortfallCents,
    shortfall: shortfallEur,
    messageEn,
    messageEl
  };
}
