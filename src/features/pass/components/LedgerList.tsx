import { useNavigate } from 'react-router-dom';
import type { Wallet } from '../../../domain/types';
import { longDate } from '../../../lib/dates';
import { formatCents } from '../../../lib/money';

export function LedgerList({ wallet }: { wallet: Wallet }) {
  const navigate = useNavigate();
  if (wallet.entries.length === 0) return <div className="empty"><h2>No wallet activity yet</h2><p>Top up or make a booking to see your credit ledger here.</p></div>;
  return <div id="panel-ledger" role="tabpanel" aria-labelledby="tab-ledger" className="ledger">
    {wallet.entries.map(entry => <button key={entry.id} type="button" onClick={() => navigate(`/pass/ledger/${entry.id}`)} aria-label={`View receipt for ${entry.label}, ${formatCents(Math.abs(entry.amountCents))}`}>
      <div><strong>{entry.label}</strong><small>{longDate(entry.createdAt)} · Ref: {entry.reference}</small></div>
      <b className={entry.amountCents < 0 ? 'negative' : ''}>{entry.amountCents > 0 ? '+' : ''}{formatCents(entry.amountCents)}</b>
    </button>)}
  </div>;
}
