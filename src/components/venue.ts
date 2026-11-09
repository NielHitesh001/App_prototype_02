import type { Venue } from '../domain/types';
import { api } from '../api';

export const getVenue = (id: string): Venue => api.findVenue(id) ?? {
  id, name: 'Village Tavern', area: 'Cyprus', cuisine: 'Cypriot', verified: false, fireplace: false, image: { src: '', alt: 'Tavern' }
};
