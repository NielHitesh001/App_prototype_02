import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCents } from '../../../lib/money';
import { longDate } from '../../../lib/dates';
import { useStore } from '../../../store/app-store';
import { Shell } from '../../../components';
export function Receipt() {
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
