import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { LocalStore } from './store';

const cents = z.number().int().positive().max(100_000);
const bookingInput = z.object({ venueId: z.string().min(1), venueName: z.string().min(1), tableNumber: z.number().int().positive(), seatingZone: z.string().min(1), partySize: z.number().int().min(1).max(4), timeSlot: z.string().min(1), dateStr: z.string().min(1), dietarySync: z.array(z.string()).max(10), totalCents: z.number().int().nonnegative().optional(), idempotencyKey: z.string().uuid().optional() });
const orderInput = z.object({ lines: z.array(z.object({ menuItemId: z.string(), quantity: z.number().int().min(1).max(20), unitPriceCents: cents })).min(1), subtotalCents: z.number().int().nonnegative(), deliveryFeeCents: z.number().int().nonnegative(), totalCents: cents, paymentMethod: z.enum(['wallet', 'card']), idempotencyKey: z.string().uuid().optional() });
const leadInput = z.object({ venueName: z.string().min(2).max(120), region: z.string().min(2).max(120), email: z.string().email(), notes: z.string().max(2000) });
const requestId = (header: string | undefined) => header && z.string().uuid().safeParse(header).success ? header : crypto.randomUUID();

export function createApp(store: LocalStore) {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true })); app.use(express.json({ limit: '100kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'troo-api' }));
  app.get('/v1/catalog', (_req, res) => res.json(store.catalog()));
  app.get('/v1/venues', (_req, res) => res.json(store.catalog().venues));
  app.get('/v1/events', (_req, res) => res.json(store.catalog().events));
  app.get('/v1/wallet', (_req, res) => res.json(store.wallet()));
  app.get('/v1/bookings', (_req, res) => res.json(store.bookings()));
  app.post('/v1/wallet/top-ups', (req, res, next) => { try { const { amountCents } = z.object({ amountCents: cents }).parse(req.body); const result = store.addTopUp(amountCents, requestId(req.header('Idempotency-Key'))); res.status(result.duplicate ? 200 : 201).json(result); } catch (error) { next(error); } });
  app.post('/v1/bookings', (req, res, next) => { try { const input = bookingInput.parse(req.body); if (input.totalCents && input.totalCents > 0) store.debitWallet(input.totalCents, `Booking · ${input.venueName}`, input.idempotencyKey ?? requestId(req.header('Idempotency-Key'))); const booking = { venueId: input.venueId, venueName: input.venueName, tableNumber: input.tableNumber, seatingZone: input.seatingZone, partySize: input.partySize, timeSlot: input.timeSlot, dateStr: input.dateStr, dietarySync: input.dietarySync }; res.status(201).json(store.addBooking(booking)); } catch (error) { next(error); } });
  app.post('/v1/orders', (req, res, next) => { try { const input = orderInput.parse(req.body); const catalog = store.catalog(); const expected = input.lines.reduce((sum, line) => { const item = catalog.menuItems.find(menu => menu.id === line.menuItemId); if (!item || item.priceCents !== line.unitPriceCents) throw new Error('INVALID_ORDER_LINE'); return sum + item.priceCents * line.quantity; }, 0) + input.deliveryFeeCents; if (expected !== input.totalCents || input.subtotalCents + input.deliveryFeeCents !== input.totalCents) throw new Error('INVALID_TOTAL'); if (input.paymentMethod === 'wallet') store.debitWallet(input.totalCents, 'Kouzina delivery order', input.idempotencyKey ?? requestId(req.header('Idempotency-Key'))); const order = { lines: input.lines, subtotalCents: input.subtotalCents, deliveryFeeCents: input.deliveryFeeCents, totalCents: input.totalCents, paymentMethod: input.paymentMethod }; res.status(201).json(store.addOrder(order)); } catch (error) { next(error); } });
  app.post('/v1/partner-leads', (req, res, next) => { try { res.status(201).json(store.addLead(leadInput.parse(req.body))); } catch (error) { next(error); } });
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { void _next; const message = error instanceof Error ? error.message : 'INVALID_REQUEST'; if (message === 'INSUFFICIENT_BALANCE') return res.status(409).json({ error: { code: message, message: 'Insufficient wallet balance.' } }); if (message === 'INVALID_ORDER_LINE' || message === 'INVALID_TOTAL') return res.status(422).json({ error: { code: message, message: 'Order amount could not be verified.' } }); if (error instanceof z.ZodError) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', issues: error.issues } }); return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } }); });
  return app;
}
