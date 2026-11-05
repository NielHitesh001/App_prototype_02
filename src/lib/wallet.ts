import type { LedgerEntry, Wallet } from '../domain/types';
export const canBook = (balance: number, total: number) => ({ allowed: total <= balance, shortfall: Math.max(0, total - balance) });
export const debit = (wallet: Wallet, entry: LedgerEntry): Wallet => ({ balanceCredits: wallet.balanceCredits + entry.amountCredits, entries: [entry, ...wallet.entries] });
export const credit = (wallet: Wallet, entry: LedgerEntry): Wallet => debit(wallet, entry);
