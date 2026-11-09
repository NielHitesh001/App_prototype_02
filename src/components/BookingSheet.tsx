import { useState } from 'react';
import { Minus, Plus, QrCode } from 'lucide-react';
import { calculateBonusCents, formatCents } from '../lib/money';
import { canBook } from '../lib/wallet';
import { useStore } from '../store/app-store';
import { AuthSheet } from './AuthSheet';
import { Dialog } from './Dialog';

export function BookingSheet({
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
  const { wallet, addDebit, addTopup, addTableBooking, auth, signIn } = useStore();
  const [guests, setGuests] = useState(1);
  const [method, setMethod] = useState<'wallet' | 'card' | 'qr'>('wallet');
  const [status, setStatus] = useState<'idle' | 'error'>('idle');
  const [timeSlot, setTimeSlot] = useState('19:30');
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const unitPriceCents = priceCents !== null ? priceCents : 0;
  const totalCents = unitPriceCents * guests;
  const guard = canBook(wallet.balanceCents, totalCents, {
    guests,
    paymentMethod: method
  });

  const confirm = () => {
    if (!auth) {
      setAuthOpen(true);
      return;
    }
    if (priceCents === null) {
      if (venueId) {
        addTableBooking({
          venueId,
          venueName: title,
          tableNumber: Math.floor(Math.random() * 12) + 1,
          seatingZone: 'Main Hall',
          partySize: guests,
          timeSlot,
          dateStr: 'Today',
          dietarySync: ['None reported']
        });
      }
      setConfirmed(true);
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
          timeSlot,
          dateStr: 'Today',
          dietarySync: ['Standard table']
        });
      }
      setConfirmed(true);
      return;
    }

    // Card and QR remain preview payment methods, but the booking itself persists.
    if (venueId) {
      addTableBooking({
        venueId,
        venueName: title,
        tableNumber: Math.floor(Math.random() * 12) + 1,
        seatingZone: 'Hearthside',
        partySize: guests,
        timeSlot,
        dateStr: 'Today',
        dietarySync: ['Standard table']
      });
    }
    setConfirmed(true);
  };

  return (
    <Dialog title="Book a table" onClose={onClose}>
      {confirmed ? (
        <div className="space-y-4">
          <p className="lead">Your table is confirmed for {timeSlot}.</p>
          <p>{guests} {guests === 1 ? 'guest' : 'guests'} · {title}</p>
          <p className="text-sm text-[#7a6a5a]">We’ll keep your reservation in Pass so it is ready when you arrive.</p>
          <button className="primary" type="button" onClick={() => { onSuccess?.(); onClose(); }}>View reservation in Pass</button>
        </div>
      ) : <>
      <p className="lead">{title}</p>

      <fieldset className="mt-4">
        <legend>Choose an arrival time</legend>
        <div className="chips" role="group" aria-label="Available table times">
          {['19:00', '19:30', '20:00', '20:30', '21:00'].map(slot => (
            <button key={slot} type="button" className={timeSlot === slot ? 'selected' : ''} aria-pressed={timeSlot === slot} onClick={() => setTimeSlot(slot)}>{slot}</button>
          ))}
        </div>
      </fieldset>

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
      </>}
      {authOpen && <AuthSheet onClose={() => setAuthOpen(false)} onSubmit={identifier => { signIn(identifier); setAuthOpen(false); }} />}
    </Dialog>
  );
}

