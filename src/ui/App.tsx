import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  Bookmark,
  CalendarDays,
  ChevronLeft,
  Clock,
  ExternalLink,
  Handshake,
  Map,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  Utensils,
  WalletCards,
  X
} from 'lucide-react';

import type { Event, Venue } from '../domain/types';
import { deals, events, menuItems, venues } from '../fixtures/data';
import { currentSeasonLabel, eventDate, eventTime, isPastEvent, isThisWeek, isTodayInNicosia, longDate } from '../lib/dates';
import { calculateBonusCents, euro, formatCents, MAX_SINGLE_TOPUP_CENTS, MIN_TRANSACTION_CENTS } from '../lib/money';
import { canBook } from '../lib/wallet';
import { useStore } from '../store/app-store';

const getVenue = (id: string): Venue =>
  venues.find(v => v.id === id) ?? {
    id,
    name: 'Village Tavern',
    area: 'Cyprus',
    cuisine: 'Cypriot',
    verified: false,
    fireplace: false,
    image: { src: '', alt: 'Tavern' }
  };

/* Navigation component */
function Nav() {
  const { cart } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const links = [
    { to: '/discover', icon: Search, label: 'Discover' },
    { to: '/taste', icon: Utensils, label: 'Taste' },
    { to: '/kouzina', icon: Truck, label: 'Kouzina', badge: cartCount > 0 ? cartCount : undefined },
    { to: '/pass', icon: WalletCards, label: 'Pass' },
    { to: '/events', icon: CalendarDays, label: 'Events' },
    { to: '/partner', icon: Handshake, label: 'Partner' }
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to} className="nav-link">
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon aria-hidden="true" />
                {badge !== undefined && (
                  <span
                    className="absolute -top-1 -right-2 bg-[#9a4a3a] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    aria-label={`${badge} items in cart`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span aria-current={isActive ? 'page' : undefined}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* Application shell */
function Shell({ children }: { children: ReactNode }) {
  const { wallet } = useStore();
  return (
    <>
      <header className="header">
        <Link className="brand" to="/discover">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>
            Troo
            <small>Cyprus dining</small>
          </span>
        </Link>
        <Link
          className="balance-chip"
          to="/pass"
          aria-label={`Wallet balance ${formatCents(wallet.balanceCents)}`}
        >
          <WalletCards size={17} aria-hidden="true" />
          <span>{formatCents(wallet.balanceCents)}</span>
        </Link>
        <button className="profile" aria-label="JD profile account">
          <span>JD</span>
        </button>
      </header>
      <main>{children}</main>
      <Nav />
    </>
  );
}

const DevMockBanner = () => {
  const showBanner = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_BANNER === 'true';
  if (!showBanner) return null;
  return (
    <aside className="mock" aria-label="Development preview notice">
      Development preview · Mock data in fixtures · {currentSeasonLabel()}
    </aside>
  );
};

function Toast({ text }: { text: string | null }) {
  return text ? (
    <div className="toast" role="status" aria-live="polite">
      {text}
    </div>
  ) : null;
}

/* Accessible focus-trapped dialog */
function Dialog({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="scrim"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
        tabIndex={-1}
      >
        <button
          className="icon close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X aria-hidden="true" />
        </button>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function PromotionTermsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Promotion terms" onClose={onClose}>
      <div className="py-2 text-sm text-[#5a483a]">
        <h3 className="font-semibold text-base mb-2">Offer terms & conditions</h3>
        <p className="p-3 bg-[#fcf9f5] rounded-lg border border-[#ebdcd3] text-stone-700">
          [PLACEHOLDER: promotion terms — pending legal review]
        </p>
      </div>
      <button className="primary mt-4 w-full" onClick={onClose} type="button">
        Close terms
      </button>
    </Dialog>
  );
}

/* Shared Booking Sheet */
function BookingSheet({
  title,
  priceCents,
  venueId,
  onClose,
  onSuccess
}: {
  title: string;
  priceCents: number | null;
  venueId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { wallet, addDebit, addTopup, addTableBooking } = useStore();
  const [guests, setGuests] = useState(1);
  const [method, setMethod] = useState<'wallet' | 'card' | 'qr'>('wallet');
  const [status, setStatus] = useState<'idle' | 'error'>('idle');

  const unitPriceCents = priceCents !== null ? priceCents : 0;
  const totalCents = unitPriceCents * guests;
  const guard = canBook(wallet.balanceCents, totalCents, {
    guests,
    paymentMethod: method
  });

  const confirm = () => {
    if (priceCents === null) {
      if (venueId) {
        addTableBooking({
          venueId,
          venueName: title,
          tableNumber: Math.floor(Math.random() * 12) + 1,
          seatingZone: 'Main Hall',
          partySize: guests,
          timeSlot: '20:00',
          dateStr: 'Today',
          dietarySync: ['None reported']
        });
      }
      onSuccess?.();
      onClose();
      return;
    }

    if (method === 'wallet') {
      if (!guard.allowed) {
        setStatus('error');
        return;
      }
      addDebit(
        totalCents,
        `Booking: ${title} (${guests} ${guests === 1 ? 'guest' : 'guests'})`
      );
      if (venueId) {
        addTableBooking({
          venueId,
          venueName: title,
          tableNumber: Math.floor(Math.random() * 12) + 1,
          seatingZone: 'Hearthside',
          partySize: guests,
          timeSlot: '20:00',
          dateStr: 'Today',
          dietarySync: ['Standard table']
        });
      }
      onSuccess?.();
      onClose();
      return;
    }

    // Card or QR
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog title="Book a table" onClose={onClose}>
      <p className="lead">{title}</p>

      <label className="field-label" id="guest-stepper-label">
        Number of guests
      </label>
      <div className="stepper" role="group" aria-labelledby="guest-stepper-label">
        <button
          type="button"
          onClick={() => setGuests(Math.max(1, guests - 1))}
          aria-label="Decrease guests"
          disabled={guests <= 1}
        >
          <Minus aria-hidden="true" />
        </button>
        <strong>{guests}</strong>
        <button
          type="button"
          onClick={() => setGuests(Math.min(4, guests + 1))}
          aria-label="Increase guests"
          disabled={guests >= 4}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      {priceCents === null ? (
        <p className="free mt-4">Free event — no deposit or payment needed.</p>
      ) : (
        <>
          <fieldset>
            <legend>Select payment method</legend>
            <label>
              <input
                type="radio"
                name="booking-payment"
                checked={method === 'wallet'}
                onChange={() => setMethod('wallet')}
              />
              Pay with wallet credits
            </label>
            <label>
              <input
                type="radio"
                name="booking-payment"
                checked={method === 'card'}
                onChange={() => setMethod('card')}
              />
              Pay by card <small>(stub)</small>
            </label>
            <label>
              <input
                type="radio"
                name="booking-payment"
                checked={method === 'qr'}
                onChange={() => setMethod('qr')}
              />
              Show QR code <small>(mobile handoff)</small>
            </label>
          </fieldset>

          <div className="total">
            <span>Total amount</span>
            <strong>{formatCents(totalCents)}</strong>
          </div>

          {method === 'qr' && (
            <div className="qr">
              <p className="notice text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-medium mb-2">
                Preview only. This code is not valid for payment yet.
              </p>
              {import.meta.env.VITE_PILOT_QR_ENABLED === 'true' ? (
                <>
                  <QrCode aria-hidden="true" size={80} />
                  <span>Show this QR code to the venue host upon arrival to settle with wallet credits.</span>
                </>
              ) : (
                <span className="text-xs text-[#7a6a5a]">
                  QR payments are disabled in preview mode.
                </span>
              )}
            </div>
          )}

          {method === 'wallet' && !guard.allowed && (
            <div className="mt-2">
              <p className="error" role="alert">
                {guard.messageEn || `This needs ${formatCents(totalCents)}. You have ${formatCents(wallet.balanceCents)}. Top up ${formatCents(guard.shortfallCents)} to continue.`}
              </p>
              <p className="text-xs text-stone-600 mt-1">
                A 10% bonus (+{formatCents(calculateBonusCents(guard.shortfallCents))}) applies to this top-up, leaving {formatCents(wallet.balanceCents + guard.shortfallCents + calculateBonusCents(guard.shortfallCents) - totalCents)} in wallet credits after booking.
              </p>
              <button
                type="button"
                className="secondary mt-2 w-full"
                onClick={() => {
                  addTopup(guard.shortfallCents);
                }}
              >
                Top up shortfall ({formatCents(guard.shortfallCents)})
              </button>
            </div>
          )}

          {status === 'error' && (
            <p className="error" role="alert">
              Payment could not be completed. Please review balance or retry.
            </p>
          )}
        </>
      )}

      <div className="mt-6">
        <button
          className="primary"
          disabled={priceCents !== null && method === 'wallet' && !guard.allowed}
          onClick={confirm}
        >
          {priceCents === null
            ? 'Confirm reservation'
            : method === 'wallet'
              ? `Confirm with ${formatCents(totalCents)}`
              : method === 'qr'
                ? 'Show QR code'
                : 'Continue with card'}
        </button>
      </div>
    </Dialog>
  );
}

/* Discover Destination */
function Discover() {
  const [filter, setFilter] = useState('All');
  const [map, setMap] = useState(false);
  const [bookVenue, setBookVenue] = useState<Venue | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { saved, toggleSaved } = useStore();

  const filtered = venues.filter(v => {
    if (filter === 'All') return true;
    if (filter === 'Fireplace') return v.fireplace;
    if (filter === 'Deals') return deals.some(d => d.venueId === v.id);
    if (filter === 'Quiet') return v.id === 'kafeneio';
    return true;
  });

  const filterCounts: Record<string, number> = {
    All: venues.length,
    Fireplace: venues.filter(v => v.fireplace).length,
    Deals: new Set(deals.map(d => d.venueId)).size,
    Quiet: venues.filter(v => v.id === 'kafeneio').length
  };

  const chips = ['All', 'Fireplace', 'Deals', 'Quiet'];

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Winter dining in Cyprus</p>
        <h1>Discover a table for tonight</h1>
        <p className="lead">
          Explore authentic village hearths, clay oven cooking, and seasonal meze tables across
          Limassol and Troodos.
        </p>

        {/* Deals carousel */}
        <div className="deals" aria-label="Winter dining offers">
          {deals.map(d => {
            const v = getVenue(d.venueId);
            return (
              <article className="deal" key={d.id}>
                <span>{d.standing ? 'Standing offer' : 'Limited time deal'}</span>
                <h2>{d.title}</h2>
                <p>
                  {v.name} · {d.discountNote ?? 'Winter seasonal'}
                </p>
                <button
                  type="button"
                  className="text-xs text-link underline mt-2 block"
                  onClick={() => setTermsOpen(true)}
                >
                  Terms apply
                </button>
              </article>
            );
          })}
        </div>

        {/* Toolbar & Filter chips with dynamic counts & aria-pressed */}
        <div className="toolbar mt-4">
          <div className="chips" role="group" aria-label="Filter venues">
            {chips.map(chip => (
              <button
                key={chip}
                type="button"
                aria-pressed={filter === chip}
                className={filter === chip ? 'selected' : ''}
                onClick={() => setFilter(chip)}
              >
                {chip} ({filterCounts[chip] ?? 0})
              </button>
            ))}
          </div>
          <button
            type="button"
            className="view-toggle"
            onClick={() => setMap(!map)}
            aria-label={map ? 'Switch to list view' : 'Switch to map preview'}
          >
            {map ? (
              <>
                <Utensils aria-hidden="true" size={16} /> List
              </>
            ) : (
              <>
                <Map aria-hidden="true" size={16} /> Map
              </>
            )}
          </button>
        </div>

        {/* Content list or accessible map preview */}
        {map ? (
          <div className="map-preview" role="region" aria-label="Venue map preview">
            <MapPin size={42} aria-hidden="true" />
            <h2>Cyprus winter hearth map</h2>
            <p>
              Static map preview covering Old Town Limassol and Troodos foothills. Interactive map
              pins are coming soon.
            </p>
            <button
              className="secondary"
              onClick={() => {
                setToast('Opened map in external browser view.');
                setTimeout(() => setToast(null), 2500);
              }}
            >
              <ExternalLink aria-hidden="true" size={16} /> Open map
            </button>
          </div>
        ) : (
          <section aria-live="polite" className="cards">
            {filtered.length > 0 ? (
              filtered.map(v => (
                <article className="card venue" key={v.id}>
                  <img src={v.image.src} alt={v.image.alt} />
                  <div>
                    <div className="split">
                      <div>
                        <p className="eyebrow">{v.area}</p>
                        <h2>{v.name}</h2>
                      </div>
                      <button
                        className="icon"
                        onClick={() => {
                          toggleSaved(v.id);
                          setToast(saved.has(v.id) ? 'Removed from saved venues' : 'Saved venue to bookmarks');
                          setTimeout(() => setToast(null), 2500);
                        }}
                        aria-label={saved.has(v.id) ? `Remove ${v.name} from saved` : `Save ${v.name}`}
                      >
                        <Bookmark
                          fill={saved.has(v.id) ? 'currentColor' : 'none'}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <p>
                      {v.cuisine}
                      {v.fireplace ? ' · Fireplace seating' : ''}
                    </p>

                    {v.rating && (
                      <p className="rating">
                        ★ {v.rating} ({v.ratingCount} reviews)
                      </p>
                    )}

                    <div className="actions flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <button
                        className="secondary"
                        onClick={() => setBookVenue(v)}
                      >
                        Book a table
                      </button>
                      <Link className="text-link whitespace-nowrap" to={`/discover?venue=${v.id}`}>
                        View venue
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                <h2>No venues found</h2>
                <p>No dining rooms matched this filter. Try selecting another filter.</p>
                <button className="secondary" onClick={() => setFilter('All')}>
                  Reset filters
                </button>
              </div>
            )}
          </section>
        )}
      </section>

      {bookVenue && (
        <BookingSheet
          title={bookVenue.name}
          priceCents={1000}
          venueId={bookVenue.id}
          onClose={() => setBookVenue(null)}
          onSuccess={() => {
            setToast(`Table booked at ${bookVenue.name}! View details in Pass.`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {termsOpen && (
        <PromotionTermsDialog onClose={() => setTermsOpen(false)} />
      )}

      <Toast text={toast} />
    </Shell>
  );
}

/* Taste Destination */
function Taste() {
  const [bookDish, setBookDish] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dishes = [
    {
      name: 'Clay pot kleftiko',
      venue: 'To Patriko Taverna',
      price: 18,
      src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      alt: 'Slow-cooked lamb kleftiko in clay pot with roasted potatoes'
    },
    {
      name: 'Halloumi and sourdough',
      venue: 'Troodos Foothill Kitchen',
      price: 14,
      src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
      alt: 'Grilled sheep halloumi with honey and warm sourdough bread'
    },
    {
      name: 'Winter meze spread',
      venue: 'To Patriko Taverna',
      price: 22,
      src: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=900&q=80',
      alt: 'Traditional winter meze spread with seasonal dips and wild greens'
    }
  ];

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Taste & Heritage</p>
        <h1>Winter culinary heritage</h1>
        <p className="lead">
          Rediscover authentic winter culinary traditions, slow earthenware baking, and indigenous
          vintages.
        </p>

        {/* Editorial Story Card */}
        <article className="story">
          <p className="eyebrow">Editorial guide</p>
          <h2>Winter tables in Cyprus</h2>
          <p>
            When the Troodos rain arrives, village clay ovens are sealed for eight hours of slow
            heat. Explore the flavors that define an unhurried season.
          </p>
          <Link className="text-link mt-2" to="/taste/story">
            Read the story
          </Link>
        </article>

        <h2 className="section-title">Reserve a seasonal dish</h2>
        <div className="cards">
          {dishes.map(dish => (
            <article className="card dish" key={dish.name}>
              <img src={dish.src} alt={dish.alt} />
              <div>
                <h2>{dish.name}</h2>
                <p className="lead" style={{ margin: '2px 0 8px' }}>
                  {dish.venue}
                </p>
                <strong>{euro(dish.price)}</strong>
                <button
                  className="secondary mt-3"
                  onClick={() => setBookDish(dish.name)}
                >
                  Reserve
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {bookDish && (
        <BookingSheet
          title={`Dish reservation: ${bookDish}`}
          priceCents={1200}
          onClose={() => setBookDish(null)}
          onSuccess={() => {
            setToast(`Reserved ${bookDish}!`);
            setTimeout(() => setToast(null), 2500);
          }}
        />
      )}
      <Toast text={toast} />
    </Shell>
  );
}

/* Kouzina Food Delivery Destination (Per Product Owner Decision 3) */
function Kouzina() {
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [toast, setToast] = useState<string | null>(null);

  const { cart, addToCart, updateCartQuantity, checkoutCart, wallet } = useStore();

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const subtotalCents = cart.reduce(
    (sum, c) => sum + (c.item.priceCents ?? Math.round(c.item.priceEur * 100)) * c.quantity,
    0
  );
  const deliveryFeeCents =
    cart.length > 0 ? Math.max(...cart.map(c => c.item.deliveryFeeCents ?? Math.round(c.item.deliveryFeeEur * 100))) : 0;
  const totalCents = subtotalCents + deliveryFeeCents;

  const handleCheckout = () => {
    const result = checkoutCart(paymentMethod);
    if (!result.success) {
      setToast(`Needs ${formatCents(totalCents)}. You have ${formatCents(wallet.balanceCents)}.`);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setCheckoutOpen(false);
    setToast('Order placed successfully! Preparing your delivery.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Kouzina Hearth Delivery</p>
        <h1>Fresh village cooking delivered</h1>
        <p className="lead">
          Enjoy wood-fired kleftiko, meze, and traditional hearth dishes delivered directly from
          partner kitchens.
        </p>

        {/* Accessible search input */}
        <div className="mb-6">
          <label htmlFor="kouzina-search" className="field-label" style={{ marginTop: 0 }}>
            Search delivery dishes
          </label>
          <div className="relative">
            <input
              id="kouzina-search"
              type="search"
              className="w-full bg-white border border-[#ebdcd3] rounded-xl px-4 py-3 text-sm focus:border-[#9a4a3a] outline-none"
              placeholder="Search kleftiko, souvla, meze..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Menu items */}
        <div className="cards">
          {filteredItems.map(item => {
            const v = getVenue(item.venueId);
            const inCart = cart.find(c => c.item.id === item.id);

            return (
              <article className="card venue" key={item.id}>
                <img src={item.image.src} alt={item.image.alt} />
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="eyebrow">{v.name}</p>
                      <strong>{euro(item.priceEur)}</strong>
                    </div>
                    <h2>{item.name}</h2>
                    <p className="text-xs text-[#7a6a5a] mb-2">{item.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-[#4f5b45] font-semibold mb-3">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock size={13} aria-hidden="true" /> {item.deliveryTimeMins}
                      </span>
                      <span className="whitespace-nowrap">Fee: {euro(item.deliveryFeeEur)}</span>
                      <span className="whitespace-nowrap">Min: {euro(item.minOrderEur)}</span>
                    </div>
                  </div>

                  <div>
                    {inCart ? (
                      <div className="stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          <Minus aria-hidden="true" size={16} />
                        </button>
                        <strong>{inCart.quantity}</strong>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          aria-label={`Add one ${item.name}`}
                        >
                          <Plus aria-hidden="true" size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="secondary"
                        onClick={() => {
                          addToCart(item);
                          setToast(`Added ${item.name} to cart`);
                          setTimeout(() => setToast(null), 2000);
                        }}
                      >
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Sticky Cart Bar */}
        {cart.length > 0 && (
          <aside className="cart-bar" aria-label="Shopping cart summary">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} aria-hidden="true" />
              <div>
                <strong className="block text-sm">
                  {cart.reduce((s, c) => s + c.quantity, 0)} items · {formatCents(totalCents)}
                </strong>
                <span className="text-xs opacity-90">Delivery fee: {formatCents(deliveryFeeCents)}</span>
              </div>
            </div>
            <button type="button" onClick={() => setCheckoutOpen(true)}>
              Checkout
            </button>
          </aside>
        )}
      </section>

      {/* Checkout Dialog */}
      {checkoutOpen && (
        <Dialog title="Complete delivery order" onClose={() => setCheckoutOpen(false)}>
          <div className="space-y-3 mb-4">
            {cart.map(c => (
              <div key={c.item.id} className="flex justify-between items-center text-sm">
                <span>
                  {c.quantity}x {c.item.name}
                </span>
                <strong>{formatCents((c.item.priceCents ?? Math.round(c.item.priceEur * 100)) * c.quantity)}</strong>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm pt-2 border-t border-[#ebdcd3]">
              <span>Delivery fee</span>
              <span>{formatCents(deliveryFeeCents)}</span>
            </div>
            <div className="total">
              <span>Total</span>
              <strong>{formatCents(totalCents)}</strong>
            </div>
          </div>

          <fieldset>
            <legend>Select payment method</legend>
            <label>
              <input
                type="radio"
                name="delivery-pay"
                checked={paymentMethod === 'wallet'}
                onChange={() => setPaymentMethod('wallet')}
              />
              Pay with wallet credits ({formatCents(wallet.balanceCents)} available)
            </label>
            <label>
              <input
                type="radio"
                name="delivery-pay"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              Pay with card <small>(stub)</small>
            </label>
          </fieldset>

          {paymentMethod === 'wallet' && wallet.balanceCents < totalCents && (
            <p className="error" role="alert">
              This needs {formatCents(totalCents)}. You have {formatCents(wallet.balanceCents)}. Top up{' '}
              {formatCents(totalCents - wallet.balanceCents)} in your Pass to continue.
            </p>
          )}

          <div className="mt-4">
            <button
              className="primary"
              disabled={paymentMethod === 'wallet' && wallet.balanceCents < totalCents}
              onClick={handleCheckout}
            >
              Confirm and place order ({formatCents(totalCents)})
            </button>
          </div>
        </Dialog>
      )}

      <Toast text={toast} />
    </Shell>
  );
}

/* Pass Destination */
function Pass() {
  const [tab, setTab] = useState<'pass' | 'ledger'>('pass');
  const [topupOpen, setTopupOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { wallet, tableBookings } = useStore();
  const navigate = useNavigate();

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <h1>Your winter pass</h1>

        {/* Tab switcher with role="tablist" and aria-selected */}
        <div role="tablist" className="tabs" aria-label="Pass views">
          <button
            role="tab"
            aria-selected={tab === 'pass'}
            id="tab-pass"
            aria-controls="panel-pass"
            onClick={() => setTab('pass')}
          >
            My pass
          </button>
          <button
            role="tab"
            aria-selected={tab === 'ledger'}
            id="tab-ledger"
            aria-controls="panel-ledger"
            onClick={() => setTab('ledger')}
          >
            Credit ledger
          </button>
        </div>

        {tab === 'pass' ? (
          <div id="panel-pass" role="tabpanel" aria-labelledby="tab-pass" className="space-y-5">
            {/* Wallet balance hero with display token & high contrast */}
            <article className="wallet-hero">
              <p>Available balance</p>
              <strong>{formatCents(wallet.balanceCents)}</strong>
              <span>1 credit = €1 · 10% bonus on wallet credits</span>
              <div className="hero-actions">
                <button type="button" onClick={() => setTopupOpen(true)}>
                  Top up wallet credits
                </button>
                <button
                  type="button"
                  style={{ background: '#f5ede2', color: '#9a4a3a' }}
                  onClick={() => setQrOpen(true)}
                >
                  <QrCode size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 6 }} />
                  Show QR code
                </button>
              </div>
            </article>

            {/* Tonight's Table Details Card (Screen 6 reference) */}
            {tableBookings.length > 0 && (
              <article className="card" style={{ padding: 20 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="eyebrow">Active reservation</span>
                  <span className="text-xs bg-[#f1f6ed] text-[#4f5b45] font-bold px-2.5 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>
                <h2>{tableBookings[0].venueName}</h2>
                <div className="grid grid-cols-2 gap-3 my-3 text-sm">
                  <div>
                    <span className="text-[#7a6a5a] block text-xs">Table & Area</span>
                    <strong>
                      Table #{tableBookings[0].tableNumber} · {tableBookings[0].seatingZone}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#7a6a5a] block text-xs">Time & Party</span>
                    <strong>
                      {tableBookings[0].timeSlot} ({tableBookings[0].partySize} guests)
                    </strong>
                  </div>
                </div>
                <div className="text-xs text-[#7a6a5a] pt-2 border-t border-[#ebdcd3]">
                  <span>Saved dietary notes: </span>
                  <strong className="text-[#2b2118]">
                    {tableBookings[0].dietarySync.join(', ')}
                  </strong>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/pass/table/${tableBookings[0].id}`}
                    className="text-link text-sm font-bold"
                  >
                    View reservation details →
                  </Link>
                </div>
              </article>
            )}

            {/* Account authentication state */}
            <article className="signin card">
              <h2>Account status</h2>
              <p>
                Signed in as <strong>JD (John Doe)</strong> · Pass tier active for {currentSeasonLabel()}.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setToast('Account settings are coming soon.');
                  setTimeout(() => setToast(null), 2500);
                }}
              >
                Manage account
              </button>
            </article>
          </div>
        ) : (
          <div id="panel-ledger" role="tabpanel" aria-labelledby="tab-ledger" className="ledger">
            {wallet.entries.map(entry => (
              <button
                key={entry.id}
                type="button"
                onClick={() => navigate(`/pass/ledger/${entry.id}`)}
                aria-label={`View receipt for ${entry.label}, ${formatCents(Math.abs(entry.amountCents))}`}
              >
                <div>
                  <strong>{entry.label}</strong>
                  <small>
                    {longDate(entry.createdAt)} · Ref: {entry.reference}
                  </small>
                </div>
                <b className={entry.amountCents < 0 ? 'negative' : ''}>
                  {entry.amountCents > 0 ? '+' : ''}
                  {formatCents(entry.amountCents)}
                </b>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Top-up Sheet with 10% bonus rule */}
      {topupOpen && (
        <TopUpModal
          onClose={() => setTopupOpen(false)}
          onSuccess={added => {
            setToast(`Added ${formatCents(added)} wallet credits!`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {/* Web QR Code Modal */}
      {qrOpen && (
        <Dialog title="Show QR code" onClose={() => setQrOpen(false)}>
          <div className="qr">
            <p className="notice text-xs p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium mb-3">
              Preview only. This code is not valid for payment yet.
            </p>
            {import.meta.env.VITE_PILOT_QR_ENABLED === 'true' ? (
              <>
                <QrCode size={140} aria-hidden="true" />
                <p className="lead" style={{ margin: 0 }}>
                  Scan at the tavern table terminal to settle your bill with wallet credits.
                </p>
                <span className="text-xs text-[#7a6a5a]">
                  Valid for {currentSeasonLabel()} · Connected account JD
                </span>
              </>
            ) : (
              <p className="text-xs text-[#7a6a5a] my-2">
                QR payment is disabled in preview. A one-time, expiring payment token will be enabled before pilot launch.
              </p>
            )}
          </div>
          <button className="primary" onClick={() => setQrOpen(false)}>
            Close
          </button>
        </Dialog>
      )}

      <Toast text={toast} />
    </Shell>
  );
}

/* Top-up Modal Dialog */
function TopUpModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (creditsAddedCents: number) => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [state, setState] = useState<'idle' | 'loading' | 'failure'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const { addTopup, wallet } = useStore();

  let topupCents = 0;
  if (selectedAmount !== null) {
    topupCents = selectedAmount * 100;
  } else {
    const val = parseFloat(customAmount);
    if (Number.isFinite(val) && val > 0) {
      topupCents = Math.round(val * 100);
    }
  }

  const bonusCents = calculateBonusCents(topupCents, 10);
  const totalCreditsCents = topupCents + bonusCents;

  const submit = () => {
    if (topupCents <= 0) return;
    if (wallet.balanceCents + totalCreditsCents > 200_000) {
      setState('failure');
      setErrorMessage('Top-up would exceed maximum wallet limit of €2,000.00.');
      return;
    }
    setState('loading');
    setErrorMessage(null);
    setTimeout(() => {
      try {
        addTopup(topupCents);
        onSuccess(totalCreditsCents);
        onClose();
      } catch (err: unknown) {
        setState('failure');
        setErrorMessage(
          err instanceof Error ? err.message : 'Top-up failed. Please check your payment details and retry.'
        );
      }
    }, 600);
  };

  return (
    <Dialog title="Top up your wallet" onClose={onClose}>
      <p className="lead">
        Receive an instant <strong>10% credit bonus</strong> on every top-up during {currentSeasonLabel()}.{' '}
        <button
          type="button"
          className="text-xs text-link underline"
          onClick={() => setShowTerms(true)}
        >
          Terms apply
        </button>
      </p>

      <div className="amounts" role="group" aria-label="Select top-up amount" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {[25, 50, 100].map(amount => {
          const tierCents = amount * 100;
          const tierBonus = calculateBonusCents(tierCents, 10);
          return (
            <button
              key={amount}
              type="button"
              className={selectedAmount === amount ? 'selected' : ''}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
            >
              {formatCents(tierCents)}
              <span className="bonus-pill">+{formatCents(tierBonus)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <label htmlFor="custom-topup-input" className="block text-xs font-semibold mb-1 text-[#5a483a]">
          Or custom amount (€):
        </label>
        <input
          id="custom-topup-input"
          type="number"
          step="0.01"
          min={MIN_TRANSACTION_CENTS / 100}
          max={MAX_SINGLE_TOPUP_CENTS / 100}
          placeholder="e.g. 20.50"
          value={customAmount}
          onChange={e => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          className="w-full px-3 py-2 border border-[#d6c7b2] rounded text-sm"
        />
        <p className="text-xs text-[#7a6a5a] mt-1">
          Minimum {formatCents(MIN_TRANSACTION_CENTS)} · Maximum {formatCents(MAX_SINGLE_TOPUP_CENTS)} per top-up.
        </p>
      </div>

      <div className="total">
        <span>Wallet credits to receive</span>
        <strong>{formatCents(totalCreditsCents)}</strong>
      </div>

      {state === 'failure' && (
        <p className="error" role="alert">
          {errorMessage || 'Top-up failed. Please check your payment details and retry.'}
        </p>
      )}

      <p className="text-xs text-[#7a6a5a] p-2 bg-[#fcf9f5] rounded border border-[#ebdcd3] mt-3">
        Test mode. No real payment is taken. [PLACEHOLDER: Greek translation — verify before pilot]
      </p>

      <div className="mt-4">
        <button
          className="primary"
          disabled={state === 'loading' || topupCents <= 0}
          onClick={submit}
        >
          {state === 'loading'
            ? 'Processing transaction…'
            : `Add ${formatCents(totalCreditsCents)} wallet credits (test)`}
        </button>
      </div>

      {showTerms && <PromotionTermsDialog onClose={() => setShowTerms(false)} />}
    </Dialog>
  );
}

/* Receipt Subpage */
function Receipt() {
  const { id } = useParams();
  const { wallet, requestRefund } = useStore();
  const navigate = useNavigate();

  const [refundAmountStr, setRefundAmountStr] = useState('');
  const [refundStatus, setRefundStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    messageEn?: string;
    messageEl?: string;
  }>({ type: 'idle' });

  const entry = wallet.entries.find(e => e.id === id);

  if (!entry) {
    return (
      <Shell>
        <section className="page">
          <button
            type="button"
            className="back"
            onClick={() => navigate(-1)}
            aria-label="Back to pass"
          >
            <ChevronLeft aria-hidden="true" size={18} /> Back
          </button>
          <div className="empty">
            <h2>Receipt not found</h2>
            <p>This transaction could not be located in your local session ledger.</p>
            <button className="secondary" onClick={() => navigate('/pass')}>
              Return to Pass
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  const originalChargeCents = Math.abs(entry.amountCents);
  const alreadyRefundedCents = wallet.entries
    .filter(e => e.kind === 'refund' && e.meta?.originalEntryId === entry.id)
    .reduce((sum, e) => sum + e.amountCents, 0);
  const remainingRefundableCents = originalChargeCents - alreadyRefundedCents;

  const handleRefund = (centsToRefund?: number) => {
    setRefundStatus({ type: 'idle' });
    let amountCents = centsToRefund;
    if (amountCents === undefined && refundAmountStr.trim()) {
      const parsed = parseFloat(refundAmountStr.trim());
      if (Number.isFinite(parsed) && parsed > 0) {
        amountCents = Math.round(parsed * 100);
      }
    }
    const res = requestRefund(entry.id, amountCents);
    if (res.success) {
      setRefundStatus({
        type: 'success',
        messageEn: 'Refund issued successfully.'
      });
      setRefundAmountStr('');
    } else {
      setRefundStatus({
        type: 'error',
        messageEn: res.errorEn,
        messageEl: res.errorEl
      });
    }
  };

  return (
    <Shell>
      <section className="page">
        <button
          type="button"
          className="back"
          onClick={() => navigate(-1)}
          aria-label="Back to pass"
        >
          <ChevronLeft aria-hidden="true" size={18} /> Back
        </button>

        <h1>Transaction receipt</h1>

        <article className="receipt card">
          <p className="eyebrow">Reference: {entry.reference}</p>
          <h2>{entry.label}</h2>
          {entry.labelEl && (
            <p className="text-xs text-[#7a6a5a] m-0 mb-3 font-semibold">{entry.labelEl}</p>
          )}
          <dl>
            <dt>Date & time</dt>
            <dd>{longDate(entry.createdAt)}</dd>

            <dt>Amount</dt>
            <dd className={entry.amountCents < 0 ? 'text-[#9a4a3a]' : 'text-[#4f5b45]'}>
              {entry.amountCents > 0 ? '+' : ''}
              {formatCents(entry.amountCents)}
            </dd>

            <dt>Payment method</dt>
            <dd>
              {entry.kind === 'booking'
                ? 'Wallet credits'
                : entry.kind === 'bonus'
                  ? 'Promotional bonus'
                  : entry.kind === 'refund'
                    ? 'Credit refund'
                    : 'Card payment'}
            </dd>

            {entry.resultingBalanceCents !== undefined && (
              <>
                <dt>Resulting balance</dt>
                <dd>{formatCents(entry.resultingBalanceCents)}</dd>
              </>
            )}
          </dl>

          {entry.kind === 'booking' && (
            <section
              className="refund-section mt-6 pt-4 border-t border-[#ebdcd3]"
              aria-label="Booking refund controls"
            >
              <h3 className="text-base font-bold mb-2">Booking refund</h3>
              <p className="text-sm text-[#5a483a] mb-2">
                Remaining refundable balance: <strong>{formatCents(remainingRefundableCents)}</strong>
              </p>

              {refundStatus.type === 'error' && (
                <div
                  className="error mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
                  role="alert"
                >
                  <p className="font-semibold">{refundStatus.messageEn}</p>
                  {refundStatus.messageEl && refundStatus.messageEl !== refundStatus.messageEn && (
                    <p className="text-xs mt-1 text-red-700">{refundStatus.messageEl}</p>
                  )}
                </div>
              )}

              {refundStatus.type === 'success' && (
                <div
                  className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800"
                  role="status"
                >
                  <p>{refundStatus.messageEn}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="refund-amount-input" className="block text-xs font-semibold mb-1">
                    Refund amount (€)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="refund-amount-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={remainingRefundableCents > 0 ? (remainingRefundableCents / 100).toFixed(2) : '0.00'}
                      value={refundAmountStr}
                      onChange={e => setRefundAmountStr(e.target.value)}
                      className="px-3 py-2 border rounded text-sm flex-1"
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleRefund()}
                    >
                      Issue refund
                    </button>
                  </div>
                </div>
                {remainingRefundableCents > 0 ? (
                  <div>
                    <button
                      type="button"
                      className="text-xs underline text-[#9A4A3A]"
                      onClick={() => handleRefund(remainingRefundableCents)}
                    >
                      Refund full remaining {formatCents(remainingRefundableCents)}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#7a6a5a] italic">
                    This booking has been fully refunded ({formatCents(originalChargeCents)} refunded).
                  </p>
                )}
              </div>
            </section>
          )}

          <p className="text-xs text-[#7a6a5a] pt-3 border-t border-[#ebdcd3] mt-4">
            Electronic transaction record issued by Troo Cyprus · Έγκυρη ηλεκτρονική απόδειξη
          </p>
        </article>
      </section>
    </Shell>
  );
}

/* Tonight's Table Detail Subpage (Screen 6 reference) */
function TableDetail() {
  const { id } = useParams();
  const { tableBookings } = useStore();
  const navigate = useNavigate();

  const booking = tableBookings.find(b => b.id === id) ?? tableBookings[0];
  const isToday = booking ? isTodayInNicosia(booking.dateStr) : false;

  return (
    <Shell>
      <section className="page">
        <button
          type="button"
          className="back"
          onClick={() => navigate('/pass')}
          aria-label="Back to pass"
        >
          <ChevronLeft aria-hidden="true" size={18} /> Back
        </button>

        <p className="eyebrow">Confirmed Table</p>
        <h1>{isToday ? "Tonight's table" : 'Table details'}</h1>

        {booking ? (
          <article className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-3">
              <h2>{booking.venueName}</h2>
              <span className="bg-[#f1f6ed] text-[#4f5b45] text-xs font-bold px-3 py-1 rounded-full">
                Table #{booking.tableNumber}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-4 my-4 text-sm">
              <div>
                <dt className="text-[#7a6a5a] text-xs">Seating section</dt>
                <dd className="font-bold m-0">{booking.seatingZone}</dd>
              </div>
              <div>
                <dt className="text-[#7a6a5a] text-xs">Reserved time</dt>
                <dd className="font-bold m-0">{booking.timeSlot}</dd>
              </div>
              <div>
                <dt className="text-[#7a6a5a] text-xs">Party size</dt>
                <dd className="font-bold m-0">{booking.partySize} guests</dd>
              </div>
              <div>
                <dt className="text-[#7a6a5a] text-xs">Date</dt>
                <dd className="font-bold m-0">{booking.dateStr}</dd>
              </div>
              <div>
                <dt className="text-[#7a6a5a] text-xs">Allergy note</dt>
                <dd className="font-bold m-0 text-[#4f5b45]">Saved to your account</dd>
              </div>
            </dl>

            <div className="p-3 bg-[#fcf9f5] rounded-xl border border-[#ebdcd3] my-4 text-xs text-[#7a6a5a]">
              <strong>Allergy note saved. The kitchen has not been notified in this preview.</strong>
              <p className="m-0 mt-1">{booking.dietarySync.join(', ')}</p>
            </div>

            <div className="flex gap-3 mt-4">
              <a
                href="tel:+35725341200"
                className="secondary flex-1 text-center"
              >
                Call tavern
              </a>
              <Link to="/pass" className="primary flex-1 text-center">
                View pass
              </Link>
            </div>
          </article>
        ) : (
          <p>No active booking found.</p>
        )}
      </section>
    </Shell>
  );
}

/* Events Destination */
function Events() {
  const [filter, setFilter] = useState('All');
  const [bookingEvent, setBookingEvent] = useState<Event | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = events.filter(e => {
    if (filter === 'All') return !isPastEvent(e.startsAt);
    if (filter === 'This week') return isThisWeek(e.startsAt) && !isPastEvent(e.startsAt);
    if (filter === 'Tastings') return e.priceEur !== null && !isPastEvent(e.startsAt);
    if (filter === 'Past') return isPastEvent(e.startsAt);
    return true;
  });

  const counts: Record<string, number> = {
    All: events.filter(e => !isPastEvent(e.startsAt)).length,
    'This week': events.filter(e => isThisWeek(e.startsAt) && !isPastEvent(e.startsAt)).length,
    Tastings: events.filter(e => e.priceEur !== null && !isPastEvent(e.startsAt)).length,
    Past: events.filter(e => isPastEvent(e.startsAt)).length
  };

  const chips = ['All', 'This week', 'Tastings', 'Past'];

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Winter Gatherings</p>
        <h1>Curated hearthside experiences</h1>
        <p className="lead">
          Intimate workshops, heritage tastings, and communal village feasts across Cyprus.
        </p>

        {/* Filters with dynamic counts & aria-pressed */}
        <div className="chips" role="group" aria-label="Filter events">
          {chips.map(chip => (
            <button
              key={chip}
              type="button"
              aria-pressed={filter === chip}
              className={filter === chip ? 'selected' : ''}
              onClick={() => setFilter(chip)}
            >
              {chip} ({counts[chip] ?? 0})
            </button>
          ))}
        </div>

        {/* Event cards */}
        <div className="event-list mt-4">
          {filtered.length > 0 ? (
            filtered.map(e => {
              const v = getVenue(e.venueId);
              const past = isPastEvent(e.startsAt);
              return (
                <article className="card event" key={e.id} style={past ? { opacity: 0.75 } : undefined}>
                  <p className="event-date">
                    {eventDate(e.startsAt)} · {eventTime(e.startsAt)}
                  </p>
                  <h2>{e.title}</h2>
                  <p>
                    <MapPin size={16} aria-hidden="true" /> {v.name} ({v.area})
                  </p>
                  {e.description && (
                    <p className="text-sm text-[#7a6a5a] my-2">{e.description}</p>
                  )}
                  {past && (
                    <p className="text-xs text-[#9a4a3a] font-medium mt-1">This event has ended.</p>
                  )}
                  <div className="split mt-3">
                    <div>
                      <strong className="text-lg">
                        {e.priceEur === null ? 'Free' : euro(e.priceEur)}
                      </strong>
                      <span className="text-xs text-[#7a6a5a] ml-2">
                        {e.seatsLeft} seats remaining
                      </span>
                    </div>
                    {past ? (
                      <button
                        className="secondary"
                        disabled
                        aria-disabled="true"
                        type="button"
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Reserve
                      </button>
                    ) : (
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => setBookingEvent(e)}
                      >
                        Reserve
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty">
              <h2>No events match this filter</h2>
              <p>Try switching to another category to view upcoming experiences.</p>
              <button className="secondary" onClick={() => setFilter('All')}>
                View all events
              </button>
            </div>
          )}
        </div>
      </section>

      {bookingEvent && (
        <BookingSheet
          title={bookingEvent.title}
          priceCents={bookingEvent.priceCents}
          venueId={bookingEvent.venueId}
          onClose={() => setBookingEvent(null)}
          onSuccess={() => {
            setToast(`Reserved seats for ${bookingEvent.title}!`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      <Toast text={toast} />
    </Shell>
  );
}

/* Partner Destination (MVP Stub per brief) */
function Partner() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Partner with Troo</p>
        <h1>Bring your tables to discerning diners</h1>
        <p className="lead">
          Join the Cyprus Winter Dining Network. The partner shift dashboard (with live covers and
          hearth status) is coming soon. Register below to receive partner onboarding.
        </p>

        {submitted ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <Sparkles size={36} className="text-[#9a4a3a] mx-auto mb-3" aria-hidden="true" />
            <h2>Thank you for your inquiry</h2>
            <p className="lead">
              Your enquiry has been saved locally. It has not been sent yet.{' '}
              [PLACEHOLDER: submission endpoint — add before pilot]
            </p>
            <button className="secondary" onClick={() => setSubmitted(false)}>
              Submit another request
            </button>
          </div>
        ) : (
          <form
            className="partner card"
            style={{ padding: 24 }}
            onSubmit={e => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label>
              Venue name
              <input required name="venueName" placeholder="e.g. To Patriko Taverna" />
            </label>
            <label>
              Location & region
              <input required name="region" placeholder="e.g. Old Town, Limassol" />
            </label>
            <label>
              Contact email
              <input type="email" required name="email" placeholder="host@taverna.com" />
            </label>
            <label>
              Tell us about your winter hearth or menu
              <textarea
                name="notes"
                rows={3}
                placeholder="Wood-fired oven, fireplace seating, village meze..."
              />
            </label>
            <p className="text-xs text-[#7a6a5a] mb-2">
              We use your details only to respond to this enquiry.{' '}
              [PLACEHOLDER: privacy policy link]
            </p>
            <button type="submit" className="primary mt-2">
              Request partner invitation
            </button>
            <a className="secondary" href="mailto:partners@troo.example">
              Contact partner relations
            </a>
          </form>
        )}
      </section>
    </Shell>
  );
}

/* Story Detail Subpage */
function StoryDetail() {
  const navigate = useNavigate();

  return (
    <Shell>
      <section className="page">
        <button
          type="button"
          className="back"
          onClick={() => navigate(-1)}
          aria-label="Back to taste"
        >
          <ChevronLeft aria-hidden="true" size={18} /> Back
        </button>

        <p className="eyebrow">Culinary Heritage</p>
        <h1>Why we seal the clay oven when the Troodos rain arrives</h1>

        <article className="prose space-y-4 text-[#2b2118]">
          <p className="lead">
            In the hillside stone villages above Limassol, winter cooking is measured in hours of
            radiant embers rather than instant flames.
          </p>
          <p>
            Traditional earthenware ovens (*fournoi*) are preheated with dried olive branches and wild
            thyme. Once the stone reaches temperature, parchment-wrapped kleftiko and earthenware
            crocks of potatoes are placed inside, and the iron door is sealed with damp clay mortar.
          </p>
          <p>
            Over eight unhurried hours, the meat absorbs gentle smoke and natural juices, resulting
            in meat so tender it falls from the bone at the touch of a fork. Served alongside crusty
            village sourdough and a glass of aged Commandaria, it represents the heart of Cypriot
            winter hospitality (*kali hora*).
          </p>
        </article>

        <div className="mt-8">
          <Link to="/taste" className="primary inline-block text-center" style={{ textDecoration: 'none' }}>
            Explore winter dishes
          </Link>
        </div>
      </section>
    </Shell>
  );
}

/* Root App with React Router */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Discover />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/taste" element={<Taste />} />
      <Route path="/taste/story" element={<StoryDetail />} />
      <Route path="/kouzina" element={<Kouzina />} />
      <Route path="/pass" element={<Pass />} />
      <Route path="/pass/table/:id" element={<TableDetail />} />
      <Route path="/pass/ledger/:id" element={<Receipt />} />
      <Route path="/events" element={<Events />} />
      <Route path="/partner" element={<Partner />} />
      <Route path="*" element={<Discover />} />
    </Routes>
  );
}
