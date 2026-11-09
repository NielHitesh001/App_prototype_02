import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { currentSeasonLabel } from '../../lib/dates';
import { formatCents } from '../../lib/money';
import { useStore } from '../../store/app-store';
import { DevMockBanner, Dialog, ErrorState, LoadingState, Shell, Toast, useFixtureResource } from '../../components';
import { LedgerList } from './components/LedgerList';
import { PassOverview } from './components/PassOverview';
import { PassTabs } from './components/PassTabs';
import { TopUpModal } from './components/TopUpSheet';

export { Receipt } from './components/ReceiptDetail';
export { TableDetail } from './components/TableDetail';

export function Pass() {
  const [tab, setTab] = useState<'pass' | 'ledger'>('pass');
  const [topupOpen, setTopupOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { wallet, tableBookings } = useStore();
  const passResource = useFixtureResource(() => true);

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <h1>Your winter pass</h1>

        <PassTabs active={tab} onChange={setTab} />
        {passResource.status === 'loading' ? <LoadingState label="Loading your Pass" /> : passResource.status === 'error' ? <ErrorState onRetry={passResource.retry} /> : tab === 'pass' ? (
          <PassOverview
            balanceCents={wallet.balanceCents}
            bookings={tableBookings}
            onTopUp={() => setTopupOpen(true)}
            onShowQr={() => setQrOpen(true)}
            onManageAccount={() => {
              setToast('Account settings are coming soon.');
              setTimeout(() => setToast(null), 2500);
            }}
          />
        ) : <LedgerList wallet={wallet} />}
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
