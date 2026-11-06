import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, MenuItem, TableBooking, Wallet } from '../domain/types';
import { initialTableBookings, initialWallet } from '../fixtures/data';
import { debit, generateReference, processRefund, processTopupWithBonus } from '../lib/wallet';

type RefundResult = {
  success: boolean;
  errorEn?: string;
  errorEl?: string;
};

type StoreContextType = {
  wallet: Wallet;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
  addDebit: (amountCents: number, label: string, idempotencyKey?: string) => Wallet;
  addTopup: (amountCents: number, idempotencyKey?: string) => ReturnType<typeof processTopupWithBonus>;
  requestRefund: (bookingEntryId: string, amountCents?: number) => RefundResult;
  resetWallet: (overrideCents?: number) => void;
  tableBookings: TableBooking[];
  addTableBooking: (booking: Omit<TableBooking, 'id' | 'status'>) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  checkoutCart: (method: 'wallet' | 'card') => { success: boolean; shortfallCents?: number };
};

const Ctx = createContext<StoreContextType | null>(null);

function getInitialWallet(): Wallet {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('troo_wallet_override_cents');
    if (override !== null) {
      const cents = parseInt(override, 10);
      if (Number.isFinite(cents)) {
        return {
          balanceCents: cents,
          entries: cents === 0 ? [] : [
            {
              id: 'l-init',
              kind: 'topup',
              amountCents: cents,
              resultingBalanceCents: cents,
              createdAt: new Date().toISOString(),
              label: 'Initial balance',
              labelEl: 'Αρχικό υπόλοιπο',
              reference: 'TR-INIT',
              paymentMode: 'card'
            }
          ]
        };
      }
    }
    const saved = sessionStorage.getItem('troo_wallet_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }
  return initialWallet;
}

export function AppStore({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet>(getInitialWallet);
  const [saved, setSaved] = useState<Set<string>>(new Set(['patriko']));
  const [tableBookings, setTableBookings] = useState<TableBooking[]>(initialTableBookings);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('troo_wallet_session', JSON.stringify(wallet));
    }
  }, [wallet]);

  // Keep window helper for automated QA / debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        __troo_reset_wallet?: (cents?: number) => void;
        __troo_set_balance?: (cents: number) => void;
      };
      win.__troo_reset_wallet = (cents?: number) => {
        resetWallet(cents);
      };
      win.__troo_set_balance = (cents: number) => {
        setWallet(prev => ({ ...prev, balanceCents: cents }));
      };
    }
  }, []);

  const resetWallet = (overrideCents?: number) => {
    if (overrideCents !== undefined) {
      setWallet({
        balanceCents: overrideCents,
        entries: overrideCents === 0 ? [] : [
          {
            id: 'l-init',
            kind: 'topup',
            amountCents: overrideCents,
            resultingBalanceCents: overrideCents,
            createdAt: new Date().toISOString(),
            label: 'Initial balance',
            labelEl: 'Αρχικό υπόλοιπο',
            reference: 'TR-INIT',
            paymentMode: 'card'
          }
        ]
      });
    } else {
      setWallet(initialWallet);
    }
  };

  const toggleSaved = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addDebit = (
    amountCents: number,
    label: string,
    idempotencyKey?: string
  ): Wallet => {
    const updated = debit(wallet, {
      id: crypto.randomUUID(),
      idempotencyKey: idempotencyKey || `debit-${Date.now()}`,
      kind: 'booking',
      amountCents: -amountCents,
      label,
      labelEl: label,
      createdAt: new Date().toISOString(),
      reference: generateReference(wallet),
      paymentMode: 'wallet'
    });
    setWallet(updated);
    return updated;
  };

  const addTopup = (
    amountCents: number,
    idempotencyKey?: string
  ) => {
    const key = idempotencyKey || `topup-${Date.now()}`;
    const result = processTopupWithBonus(wallet, amountCents, {
      idempotencyKey: key,
      label: 'Wallet top-up',
      labelEl: 'Φόρτιση πορτοφολιού'
    });
    setWallet(result.wallet);
    return result;
  };

  const requestRefund = (bookingEntryId: string, amountCents?: number): RefundResult => {
    try {
      const updated = processRefund(wallet, bookingEntryId, amountCents);
      setWallet(updated);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('maximum wallet limit of €2,000.00')) {
        return {
          success: false,
          errorEn:
            'Refund exceeds the €2,000 wallet limit. Please contact Troo Guest Support (support@troo.cy) for direct payout.',
          errorEl:
            'Η επιστροφή υπερβαίνει το όριο των 2.000 € του πορτοφολιού. Επικοινωνήστε με την Υποστήριξη (support@troo.cy) για απευθείας πληρωμή.'
        };
      }
      return {
        success: false,
        errorEn: msg,
        errorEl: msg
      };
    }
  };

  const addTableBooking = (booking: Omit<TableBooking, 'id' | 'status'>) => {
    const newBooking: TableBooking = {
      ...booking,
      id: `tb-${Date.now()}`,
      status: 'confirmed'
    };
    setTableBookings(prev => [newBooking, ...prev]);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(c => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter((c): c is CartItem => c !== null);
    });
  };

  const clearCart = () => setCart([]);

  const checkoutCart = (method: 'wallet' | 'card') => {
    const subtotalCents = cart.reduce(
      (sum, c) => sum + (c.item.priceCents ?? Math.round(c.item.priceEur * 100)) * c.quantity,
      0
    );
    const deliveryFeeCents =
      cart.length > 0 ? Math.max(...cart.map(c => c.item.deliveryFeeCents ?? Math.round(c.item.deliveryFeeEur * 100))) : 0;
    const totalCents = subtotalCents + deliveryFeeCents;

    if (method === 'wallet') {
      if (wallet.balanceCents < totalCents) {
        return { success: false, shortfallCents: totalCents - wallet.balanceCents };
      }
      addDebit(totalCents, `Kouzina delivery order (${cart.length} items)`);
    }
    clearCart();
    return { success: true };
  };

  return (
    <Ctx.Provider
      value={{
        wallet,
        saved,
        toggleSaved,
        addDebit,
        addTopup,
        requestRefund,
        resetWallet,
        tableBookings,
        addTableBooking,
        cart,
        addToCart,
        updateCartQuantity,
        clearCart,
        checkoutCart
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const value = useContext(Ctx);
  if (!value) throw new Error('AppStore missing in component tree');
  return value;
};
