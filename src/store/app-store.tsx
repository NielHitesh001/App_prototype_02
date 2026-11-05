import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, MenuItem, TableBooking, Wallet } from '../domain/types';
import { initialTableBookings, initialWallet } from '../fixtures/data';
import { euroToCents } from '../lib/money';
import { debit, generateReference, processTopupWithBonus } from '../lib/wallet';

type StoreContextType = {
  wallet: Wallet;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
  addDebit: (amountEurOrCents: number, label: string, idempotencyKey?: string, isCents?: boolean) => Wallet;
  addTopup: (amountEurOrCents: number, idempotencyKey?: string, isCents?: boolean) => void;
  tableBookings: TableBooking[];
  addTableBooking: (booking: Omit<TableBooking, 'id' | 'status'>) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  checkoutCart: (method: 'wallet' | 'card') => { success: boolean; shortfallCents?: number };
};

const Ctx = createContext<StoreContextType | null>(null);

export function AppStore({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet>(initialWallet);
  const [saved, setSaved] = useState<Set<string>>(new Set(['patriko']));
  const [tableBookings, setTableBookings] = useState<TableBooking[]>(initialTableBookings);
  const [cart, setCart] = useState<CartItem[]>([]);

  const toggleSaved = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addDebit = (
    amountEurOrCents: number,
    label: string,
    idempotencyKey?: string,
    isCents = false
  ): Wallet => {
    const amountCents = isCents ? amountEurOrCents : euroToCents(amountEurOrCents);
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
    amountEurOrCents: number,
    idempotencyKey?: string,
    isCents = false
  ) => {
    const amountCents = isCents ? amountEurOrCents : euroToCents(amountEurOrCents);
    const key = idempotencyKey || `topup-${Date.now()}`;
    const result = processTopupWithBonus(wallet, amountCents, {
      idempotencyKey: key,
      label: 'Wallet top-up',
      labelEl: 'Φόρτιση πορτοφολιού'
    });
    setWallet(result.wallet);
    return result;
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
      (sum, c) => sum + euroToCents(c.item.priceEur) * c.quantity,
      0
    );
    const deliveryFeeCents =
      cart.length > 0 ? Math.max(...cart.map(c => euroToCents(c.item.deliveryFeeEur))) : 0;
    const totalCents = subtotalCents + deliveryFeeCents;

    if (method === 'wallet') {
      if (wallet.balanceCents < totalCents) {
        return { success: false, shortfallCents: totalCents - wallet.balanceCents };
      }
      addDebit(totalCents, `Kouzina delivery order (${cart.length} items)`, undefined, true);
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
