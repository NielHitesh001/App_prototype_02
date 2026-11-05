/**
 * Money Handling Library for Troo Cyprus Dining
 *
 * Rules:
 * 1. Internal currency representation is strictly integer cents (e.g. €12.50 = 1250 cents).
 * 2. 1 credit = €1 = 100 cents.
 * 3. Percentage calculations (such as 10% top-up bonus) use standard commercial Round-Half-Up:
 *    Math.round(cents * rate) -> e.g. 25.5 cents rounds up to 26 cents.
 * 4. Cyprus locale formatting: 'en-CY' or 'el-CY' with EUR currency symbol (€).
 */

export const MAX_SINGLE_TOPUP_CENTS = 500_00; // €500.00 maximum single top-up
export const MAX_WALLET_BALANCE_CENTS = 2_000_00; // €2,000.00 maximum wallet balance
export const MIN_TRANSACTION_CENTS = 1; // €0.01 minimum

/**
 * Converts a euro amount (number or string) to integer cents.
 * Rounds half up and strictly validates precision and positive value.
 */
export function euroToCents(euros: number | string): number {
  if (typeof euros === 'string') {
    const trimmed = euros.trim();
    if (!trimmed || isNaN(Number(trimmed))) {
      throw new Error(`Invalid euro input: "${euros}"`);
    }
    // Reject inputs with more than two decimal places e.g. "12.345"
    if (trimmed.includes('.') && trimmed.split('.')[1].length > 2) {
      throw new Error(`Invalid euro precision: "${euros}" exceeds 2 decimal places`);
    }
    const parsed = Number(trimmed);
    if (!isFinite(parsed) || parsed < 0) {
      throw new Error(`Invalid euro amount: "${euros}" must be positive`);
    }
    return Math.round(parsed * 100);
  }

  if (typeof euros !== 'number' || !isFinite(euros) || euros < 0) {
    throw new Error(`Invalid euro amount: ${euros}`);
  }
  return Math.round(euros * 100);
}

/**
 * Converts integer cents to euro floating value for display.
 */
export function centsToEuro(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`Cents must be an integer, received: ${cents}`);
  }
  return cents / 100;
}

/**
 * Validates user-entered text or numeric money input.
 */
export function validateAndParseInputToCents(input: string | number): {
  success: boolean;
  cents?: number;
  error?: string;
} {
  try {
    const cents = euroToCents(input);
    if (cents < MIN_TRANSACTION_CENTS) {
      return { success: false, error: 'Amount must be greater than zero' };
    }
    if (cents > MAX_SINGLE_TOPUP_CENTS) {
      return {
        success: false,
        error: `Amount exceeds maximum allowed limit of ${centsToEuro(MAX_SINGLE_TOPUP_CENTS)}`
      };
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
 * Calculates 10% credit bonus in integer cents using Round-Half-Up.
 * E.g.:
 * - 2500 cents (€25) * 0.10 = 250 cents (€2.50)
 * - 5000 cents (€50) * 0.10 = 500 cents (€5.00)
 * - 10000 cents (€100) * 0.10 = 1000 cents (€10.00)
 * - 255 cents (€2.55) * 0.10 = 25.5 cents -> 26 cents (Round-Half-Up verified)
 */
export function calculateBonusCents(topupCents: number, rate = 0.1): number {
  if (topupCents <= 0) return 0;
  return Math.round(topupCents * rate);
}

/**
 * Formats integer cents into standard Cyprus currency display.
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
 * Universal formatter supporting either integer cents or euro decimal values.
 */
export function euro(value: number, locale: 'en-CY' | 'el-CY' = 'en-CY'): string {
  // If value is whole number representing euros or float, format cleanly
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
