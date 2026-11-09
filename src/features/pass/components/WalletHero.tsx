import { QrCode } from 'lucide-react';
import { formatCents } from '../../../lib/money';

export function WalletHero({ balanceCents, onTopUp, onShowQr }: { balanceCents: number; onTopUp: () => void; onShowQr: () => void }) {
  return <article className="wallet-hero">
    <p>Available balance</p><strong>{formatCents(balanceCents)}</strong><span>1 credit = €1 · 10% bonus on wallet credits</span>
    <div className="hero-actions">
      <button type="button" onClick={onTopUp}>Top up wallet credits</button>
      <button type="button" className="wallet-qr" onClick={onShowQr}><QrCode size={16} aria-hidden="true" />Show QR code</button>
    </div>
  </article>;
}
