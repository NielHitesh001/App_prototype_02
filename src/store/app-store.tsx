import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, LedgerEntry, MenuItem, TableBooking, Wallet } from '../domain/types';
import { initialTableBookings, initialWallet } from '../fixtures/data';
import { credit, debit } from '../lib/wallet';

type StoreContextType = {
  wallet: Wallet;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
  addDebit: (amount: number, label: string) => void;
  addTopup: (amount: number) => void;
  tableBookings: TableBooking[];
  addTableBooking: (booking: Omit<TableBooking, 'id' | 'status'>) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  checkoutCart: (method: 'wallet' | 'card') => { success: boolean; shortfall?: number };
};

const Ctx = createContext<StoreContextType | null>(null);

const createEntry = (
  kind: LedgerEntry['kind'],
  amountCredits: number,
  label: string,
  bonusCredits?: number
): LedgerEntry => ({
  id: crypto.randomUUID(),
  kind,
  amountCredits,
  label,
  createdAt: new Date().toISOString(),
  reference: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
  bonusCredits
});

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

  const addDebit = (amount: number, label: string) => {
    const entry = createEntry('booking', -amount, label);
    setWallet(w => debit(w, entry));
  };

  const addTopup = (amount: number) => {
    // 10% credit bonus rule as confirmed in DECISIONS.md
    const bonus = Math.round(amount * 0.1 * 100) / 100;
    const totalCredits = amount + bonus;
    const entry = createEntry('topup', totalCredits, 'Wallet top-up (10% bonus applied)', bonus);
    setWallet(w => credit(w, entry));
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
    const subtotal = cart.reduce((sum, c) => sum + c.item.priceEur * c.quantity, 0);
    const deliveryFee = cart.length > 0 ? Math.max(...cart.map(c => c.item.deliveryFeeEur)) : 0;
    const total = subtotal + deliveryFee;

    if (method === 'wallet') {
      if (wallet.balanceCredits < total) {
        return { success: false, shortfall: total - wallet.balanceCredits };
      }
      addDebit(total, `Kouzina delivery order (${cart.length} items)`);
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
