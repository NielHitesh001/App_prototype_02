import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isTodayInNicosia } from '../../../lib/dates';
import { useStore } from '../../../store/app-store';
import { Shell } from '../../../components';
export function TableDetail() {
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
          <article className="card card-padded">
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

