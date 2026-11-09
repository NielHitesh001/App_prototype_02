import { Route, Routes } from 'react-router-dom';

import { Discover } from '../features/discover/DiscoverPage';
import { Events } from '../features/events/EventsPage';
import { Kouzina } from '../features/kouzina/KouzinaPage';
import { Partner } from '../features/partner/PartnerPage';
import { Pass, Receipt, TableDetail } from '../features/pass/PassPage';
import { StoryDetail } from '../features/taste/StoryDetailPage';
import { Taste } from '../features/taste/TastePage';

/** Router entry point: feature pages own their presentation and behavior. */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Discover />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/taste" element={<Taste />} />
      <Route path="/taste/story" element={<StoryDetail />} />
      <Route path="/kouzina" element={<Kouzina />} />
      <Route path="/pass" element={<Pass />} />
      <Route path="/pass/table/:id" element={<TableDetail />} />
      <Route path="/pass/ledger/:id" element={<Receipt />} />
      <Route path="/events" element={<Events />} />
      <Route path="/partner" element={<Partner />} />
      <Route path="*" element={<Discover />} />
    </Routes>
  );
}
