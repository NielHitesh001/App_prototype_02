import { useState } from "react";
import { Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import { api } from "../../api";
import { formatCents, euro } from "../../lib/money";
import { useStore } from "../../store/app-store";
import { AuthSheet } from "../../components/AuthSheet";
import { DevMockBanner, Dialog, ErrorState, LoadingState, Shell, Toast, getVenue, useFixtureResource } from "../../components";
export function Kouzina() {
  const menuResource = useFixtureResource(() => api.listMenuItems());
  const menuItems = menuResource.data ?? [];
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [toast, setToast] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const { cart, addToCart, updateCartQuantity, checkoutCart, wallet, auth, signIn } = useStore();

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
    if (!auth) {
      setAuthOpen(true);
      return;
    }
    const result = checkoutCart(paymentMethod);
    if (!result.success) {
      setToast(`Needs ${formatCents(totalCents)}. You have ${formatCents(wallet.balanceCents)}.`);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setCheckoutOpen(false);
    setToast('Order confirmed. The partner kitchen is preparing your delivery.');
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
        {menuResource.status === 'loading' ? <LoadingState label="Loading delivery dishes" /> : menuResource.status === 'error' ? <ErrorState onRetry={menuResource.retry} /> : <div className="cards">
          {filteredItems.length === 0 ? <div className="empty"><h2>No delivery dishes found</h2><p>Try a different search, such as kleftiko, souvla, or meze.</p><button className="secondary" type="button" onClick={() => setSearch('')}>Clear search</button></div> : filteredItems.map(item => {
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
        </div>}

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
      {authOpen && <AuthSheet onClose={() => setAuthOpen(false)} onSubmit={identifier => { signIn(identifier); setAuthOpen(false); }} />}
    </Shell>
  );
}

/* Pass Destination */
