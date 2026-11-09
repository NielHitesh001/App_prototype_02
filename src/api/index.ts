import { FixtureAdapter } from './FixtureAdapter';
import type { TrooDataAdapter } from './contracts';

export type { CreateBookingInput, CreateOrderInput, CreatePartnerLeadInput, Order, PartnerLead, TrooDataAdapter } from './contracts';

// TODO(api): choose HttpAdapter here when VITE_DATA_SOURCE="http" is supported.
export const api: TrooDataAdapter = new FixtureAdapter();
export const isMockApi = api.isMock;
