import { useState } from 'react';
import { currentSeasonLabel } from '../../../lib/dates';
import { calculateBonusCents, formatCents, MAX_SINGLE_TOPUP_CENTS, MIN_TRANSACTION_CENTS } from '../../../lib/money';
import { useStore } from '../../../store/app-store';
import { Dialog, PromotionTermsDialog } from '../../../components';
export function TopUpModal({
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
