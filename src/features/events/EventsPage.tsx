import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Event } from "../../domain/types";
import { api } from "../../api";
import { eventDate, eventTime, isPastEvent, isThisWeek } from "../../lib/dates";
import { euro } from "../../lib/money";
import { BookingSheet, DevMockBanner, ErrorState, LoadingState, Shell, Toast, getVenue, useFixtureResource } from "../../components";
export function Events() {
  const eventResource = useFixtureResource(() => api.listEvents());
  const events = eventResource.data ?? [];
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
        {eventResource.status === 'loading' ? <LoadingState label="Loading events" /> : eventResource.status === 'error' ? <ErrorState onRetry={eventResource.retry} /> : <div className="event-list mt-4">
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
        </div>}
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
