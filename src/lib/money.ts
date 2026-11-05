/**
 * Money Handling Library for Troo Cyprus Dining
 *
 * Fundamental Rules:
 * 1. Storage & Arithmetic: All monetary values are strictly represented and calculated as integer cents (e.g. €12.50 = 1250 cents).
 * 2. 1 credit = €1 = 100 cents.
 * 3. Parser: Prefer string input for money in all callers to avoid IEEE-754 float inaccuracies.
 * 4. Percentage calculations: Performed using integer arithmetic: Math.round((cents * ratePercent) / 100).
 * 5. Display Formatter: formatCents() is the single source of truth for Cyprus euro locale formatting.
 */

export const MAX_SINGLE_TOPUP_CENTS = 500_00; // €500.00 maximum single top-up
export const MAX_WALLET_BALANCE_CENTS = 2_000_00; // €2,000.00 maximum wallet balance
export const MIN_TRANSACTION_CENTS = 1; // €0.01 minimum transaction

const EURO_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Pure parser: Converts a euro string or number into integer cents.
 * Enforces strict pattern checks (rejects commas, currency symbols, scientific notation, and >2 decimals).
 * Does not check business limits; callers must use validateAmount().
 *
 * PREFER string input for money in all callers.
 */
export function euroToCents(euros: number | string): number {
  if (typeof euros === 'string') {
    const trimmed = euros.trim();
    if (!trimmed || !EURO_PATTERN.test(trimmed)) {
      throw new Error(`Invalid euro input: "${euros}"`);
    }
    const parsed = Number(trimmed);
    return Math.round(parsed * 100);
  }

  if (typeof euros === 'number') {
    if (!Number.isFinite(euros) || euros < 0) {
      throw new Error(`Invalid euro amount: ${euros}`);
    }
    const cents = euros * 100;
    if (Math.abs(cents - Math.round(cents)) > 1e-9) {
      throw new Error(`Invalid euro precision: ${euros}`);
    }
    return Math.round(cents);
  }

  throw new Error(`Unsupported money input type: ${typeof euros}`);
}

/**
 * Converts integer cents to euro floating decimal representation.
 */
export function centsToEuro(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`Cents must be an integer, received: ${cents}`);
  }
  return cents / 100;
}

/**
 * Single validator for all financial bounds and transaction constraints.
 */
export function validateAmount(
  cents: number,
  kind?: 'topup' | 'booking' | 'refund'
): { valid: boolean; error?: string } {
  if (!Number.isInteger(cents) || cents < MIN_TRANSACTION_CENTS) {
    return { valid: false, error: 'Amount must be at least €0.01 (1 cent)' };
  }

  if (kind === 'topup' && cents > MAX_SINGLE_TOPUP_CENTS) {
    return {
      valid: false,
      error: `Top-up amount cannot exceed ${formatCents(MAX_SINGLE_TOPUP_CENTS)}`
    };
  }

  return { valid: true };
}

/**
 * Validates user-entered text or numeric money input and parses to cents.
 */
export function validateAndParseInputToCents(
  input: string | number,
  kind?: 'topup' | 'booking' | 'refund'
): {
  success: boolean;
  cents?: number;
  error?: string;
} {
  try {
    const cents = euroToCents(input);
    const validation = validateAmount(cents, kind);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    return { success: true, cents };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid amount format'
    };
  }
}

/**
 * Calculates credit bonus in integer cents using integer arithmetic (P1-1).
 * Avoids floating-point math: Math.round((topupCents * ratePercent) / 100).
 *
 * Example:
 * - 255 cents (€2.55) with 10% -> (255 * 10) / 100 = 25.5 -> 26 cents.
 * - 2500 cents (€25.00) with 10% -> 250 cents (€2.50).
 */
export function calculateBonusCents(topupCents: number, ratePercent = 10): number {
  if (topupCents <= 0) return 0;
  const rate = ratePercent > 0 && ratePercent <= 1 ? Math.round(ratePercent * 100) : ratePercent;
  return Math.round((topupCents * rate) / 100);
}

/**
 * Single Formatter (P1-6):
 * Formats integer cents into standard Cyprus currency display.
 * The only place in the entire codebase where currency formatting is instantiated.
 */
export function formatCents(cents: number, locale: 'en-CY' | 'el-CY' = 'en-CY'): string {
  const euroVal = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(euroVal);
}

/**
 * Thin wrapper for backward compatibility across UI components.
 * Calls formatCents under the hood.
 */
export function euro(amount: number, isCents = false): string {
  const cents = isCents ? amount : Math.round(amount * 100);
  return formatCents(cents);
}
