import { useState, type ReactNode } from 'react';
import { CalendarDays, Handshake, Search, Truck, Utensils, WalletCards } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { formatCents } from '../lib/money';
import { useStore } from '../store/app-store';
import { AuthSheet } from './AuthSheet';

const links = [
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/taste', icon: Utensils, label: 'Taste' },
  { to: '/kouzina', icon: Truck, label: 'Kouzina' },
  { to: '/pass', icon: WalletCards, label: 'Pass' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/partner', icon: Handshake, label: 'Partner' }
];

export function Header() {
  const { wallet, auth, signIn, signOut } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  return <>
    <header className="header">
      <Link className="brand" to="/discover"><span className="brand-mark" aria-hidden="true">T</span><span>Troo<small>Cyprus dining</small></span></Link>
      <Link className="balance-chip" to="/pass" aria-label={`Wallet balance ${formatCents(wallet.balanceCents)}`}>
        <WalletCards size={17} aria-hidden="true" /><span>{formatCents(wallet.balanceCents)}</span>
      </Link>
      <button className="profile" type="button" onClick={() => auth ? signOut() : setAuthOpen(true)} aria-label={auth ? `Sign out ${auth.email}` : 'Sign in'}>
        <span>{auth ? auth.email.slice(0, 1).toUpperCase() : 'Sign in'}</span>
      </button>
    </header>
    {authOpen && <AuthSheet onClose={() => setAuthOpen(false)} onSubmit={identifier => { signIn(identifier); setAuthOpen(false); }} />}
  </>;
}

export function BottomNav() {
  const { cart } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <nav className="bottom-nav" aria-label="Main navigation">
    {links.map(({ to, icon: Icon, label }) => {
      const badge = label === 'Kouzina' && cartCount > 0 ? cartCount : undefined;
      return <NavLink key={to} to={to} className="nav-link">{({ isActive }) => <>
        <div className="relative"><Icon aria-hidden="true" />{badge !== undefined && <span className="absolute -top-1 -right-2 bg-[#9a4a3a] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" aria-label={`${badge} items in cart`}>{badge}</span>}</div>
        <span aria-current={isActive ? 'page' : undefined}>{label}</span>
      </>}</NavLink>;
    })}
  </nav>;
}

export function Shell({ children }: { children: ReactNode }) {
  return <><Header /><main>{children}</main><BottomNav /></>;
}
