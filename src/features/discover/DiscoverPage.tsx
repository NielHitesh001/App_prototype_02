import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ExternalLink, Map, MapPin, Utensils } from "lucide-react";
import type { Venue } from "../../domain/types";
import { api } from "../../api";
import { useStore } from "../../store/app-store";
import { BookingSheet, DevMockBanner, ErrorState, LoadingState, PromotionTermsDialog, Shell, Toast, getVenue, useFixtureResource } from "../../components";
export function Discover() {
  const venueResource = useFixtureResource(() => ({ venues: api.listVenues(), deals: api.listDeals() }));
  const venues = venueResource.data?.venues ?? [];
  const deals = venueResource.data?.deals ?? [];
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Limassol');
  const [map, setMap] = useState(false);
  const [bookVenue, setBookVenue] = useState<Venue | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { saved, toggleSaved } = useStore();

  const filtered = venues.filter(v => {
    const matchesQuery = `${v.name} ${v.area} ${v.cuisine}`.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = location === 'All Cyprus' || v.area.toLowerCase().includes(location.toLowerCase());
    if (!matchesQuery || !matchesLocation) return false;
    if (filter === 'All') return true;
    if (filter === 'Fireplace') return v.fireplace;
    if (filter === 'Deals') return deals.some(d => d.venueId === v.id);
    if (filter === 'Quiet') return v.id === 'kafeneio';
    return true;
  });

  const filterCounts: Record<string, number> = {
    All: venues.length,
    Fireplace: venues.filter(v => v.fireplace).length,
    Deals: new Set(deals.map(d => d.venueId)).size,
    Quiet: venues.filter(v => v.id === 'kafeneio').length
  };

  const chips = ['All', 'Fireplace', 'Deals', 'Quiet'];

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Winter dining in Cyprus</p>
        <h1>Discover a table for tonight</h1>
        <p className="lead">
          Explore authentic village hearths, clay oven cooking, and seasonal meze tables across
          Limassol and Troodos.
        </p>

        <div className="discover-controls mt-4">
          <label className="field-label" htmlFor="discover-location">Location</label>
          <select id="discover-location" value={location} onChange={event => setLocation(event.target.value)} aria-label="Choose location">
            {['All Cyprus', 'Limassol', 'Larnaca', 'Paphos', 'Nicosia', 'Troodos'].map(option => <option key={option}>{option}</option>)}
          </select>
          <button className="secondary" type="button" onClick={() => { setLocation('Limassol'); setToast('Using your approximate location: Limassol.'); setTimeout(() => setToast(null), 2500); }}>Use my location</button>
          <label className="field-label" htmlFor="discover-search">Search venues</label>
          <input id="discover-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search venues or cuisine" />
        </div>

        {/* Deals carousel */}
        <div className="deals" aria-label="Winter dining offers">
          {deals.map(d => {
            const v = getVenue(d.venueId);
            return (
              <article className="deal" key={d.id}>
                <span>{d.standing ? 'Standing offer' : 'Limited time deal'}</span>
                <h2>{d.title}</h2>
                <p>
                  {v.name} · {d.discountNote ?? 'Winter seasonal'}
                </p>
                <button
                  type="button"
                  className="text-xs text-link underline mt-2 block"
                  onClick={() => setTermsOpen(true)}
                >
                  Terms apply
                </button>
              </article>
            );
          })}
        </div>

        {/* Toolbar & Filter chips with dynamic counts & aria-pressed */}
        <div className="toolbar mt-4">
          <div className="chips" role="group" aria-label="Filter venues">
            {chips.map(chip => (
              <button
                key={chip}
                type="button"
                aria-pressed={filter === chip}
                className={filter === chip ? 'selected' : ''}
                onClick={() => setFilter(chip)}
              >
                {chip} ({filterCounts[chip] ?? 0})
              </button>
            ))}
          </div>
          <button
            type="button"
            className="view-toggle"
            onClick={() => setMap(!map)}
            aria-label={map ? 'Switch to list view' : 'Switch to map preview'}
          >
            {map ? (
              <>
                <Utensils aria-hidden="true" size={16} /> List
              </>
            ) : (
              <>
                <Map aria-hidden="true" size={16} /> Map
              </>
            )}
          </button>
        </div>

        {/* Content list or accessible map preview */}
        {venueResource.status === 'loading' ? <LoadingState label="Loading venues" /> : venueResource.status === 'error' ? <ErrorState onRetry={venueResource.retry} /> : map ? (
          <div className="map-preview" role="region" aria-label="Venue map preview">
            <MapPin size={42} aria-hidden="true" />
            <h2>Cyprus winter hearth map</h2>
            <p>
              Static map preview covering Old Town Limassol and Troodos foothills. Interactive map
              pins are coming soon.
            </p>
            <button
              className="secondary"
              onClick={() => {
                setToast('Opened map in external browser view.');
                setTimeout(() => setToast(null), 2500);
              }}
            >
              <ExternalLink aria-hidden="true" size={16} /> Open map
            </button>
          </div>
        ) : (
          <section aria-live="polite" className="cards">
            {filtered.length > 0 ? (
              filtered.map(v => (
                <article className="card venue" key={v.id}>
                  <img src={v.image.src} alt={v.image.alt} />
                  <div>
                    <div className="split">
                      <div>
                        <p className="eyebrow">{v.area}</p>
                        <h2>{v.name}</h2>
                      </div>
                      <button
                        className="icon"
                        onClick={() => {
                          toggleSaved(v.id);
                          setToast(saved.has(v.id) ? 'Removed from saved venues' : 'Saved venue to bookmarks');
                          setTimeout(() => setToast(null), 2500);
                        }}
                        aria-label={saved.has(v.id) ? `Remove ${v.name} from saved` : `Save ${v.name}`}
                      >
                        <Bookmark
                          fill={saved.has(v.id) ? 'currentColor' : 'none'}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <p>
                      {v.cuisine}
                      {v.fireplace ? ' · Fireplace seating' : ''}
                    </p>

                    {v.rating && (
                      <p className="rating">
                        ★ {v.rating} ({v.ratingCount} reviews)
                      </p>
                    )}

                    <div className="actions flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <button
                        className="secondary"
                        onClick={() => setBookVenue(v)}
                      >
                        Book a table
                      </button>
                      <Link className="text-link whitespace-nowrap" to={`/discover?venue=${v.id}`}>
                        View venue
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                <h2>No venues found</h2>
                <p>No dining rooms matched this filter. Try selecting another filter.</p>
                <button className="secondary" onClick={() => setFilter('All')}>
                  Reset filters
                </button>
              </div>
            )}
          </section>
        )}
      </section>

      {bookVenue && (
        <BookingSheet
          title={bookVenue.name}
          priceCents={1000}
          venueId={bookVenue.id}
          onClose={() => setBookVenue(null)}
          onSuccess={() => {
            setToast(`Table booked at ${bookVenue.name}! View details in Pass.`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {termsOpen && (
        <PromotionTermsDialog onClose={() => setTermsOpen(false)} />
      )}

      <Toast text={toast} />
    </Shell>
  );
}

/* Taste Destination */
