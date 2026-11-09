import { Link } from 'react-router-dom';
import type { TableBooking } from '../../../domain/types';
import { currentSeasonLabel } from '../../../lib/dates';
import { WalletHero } from './WalletHero';

export function PassOverview({
  balanceCents, bookings, onTopUp, onShowQr, onManageAccount
}: {
  balanceCents: number;
  bookings: TableBooking[];
  onTopUp: () => void;
  onShowQr: () => void;
  onManageAccount: () => void;
}) {
  const booking = bookings[0];
  return <div id="panel-pass" role="tabpanel" aria-labelledby="tab-pass" className="space-y-5">
    <WalletHero balanceCents={balanceCents} onTopUp={onTopUp} onShowQr={onShowQr} />
    {booking ? <article className="card card-padded">
      <div className="flex items-center justify-between mb-2"><span className="eyebrow">Active reservation</span><span className="text-xs bg-[#f1f6ed] text-[#4f5b45] font-bold px-2.5 py-1 rounded-full">Confirmed</span></div>
      <h2>{booking.venueName}</h2>
      <div className="grid grid-cols-2 gap-3 my-3 text-sm"><div><span className="text-[#7a6a5a] block text-xs">Table & Area</span><strong>Table #{booking.tableNumber} · {booking.seatingZone}</strong></div><div><span className="text-[#7a6a5a] block text-xs">Time & Party</span><strong>{booking.timeSlot} ({booking.partySize} guests)</strong></div></div>
      <div className="text-xs text-[#7a6a5a] pt-2 border-t border-[#ebdcd3]"><span>Saved dietary notes: </span><strong className="text-[#2b2118]">{booking.dietarySync.join(', ')}</strong></div>
      <div className="mt-3"><Link to={`/pass/table/${booking.id}`} className="text-link text-sm font-bold">View reservation details →</Link></div>
    </article> : <div className="empty"><h2>No table booked yet</h2><p>When you reserve a table, its details and dietary notes will appear here.</p><Link className="secondary" to="/discover">Discover tables</Link></div>}
    <article className="signin card"><h2>Account status</h2><p>Signed in as <strong>JD (John Doe)</strong> · Pass tier active for {currentSeasonLabel()}.</p><button className="secondary" onClick={onManageAccount}>Manage account</button></article>
  </div>;
}
