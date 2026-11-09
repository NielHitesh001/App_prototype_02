import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { LocalStore } from './store';

const app = () => createApp(new LocalStore(join(mkdtempSync(join(tmpdir(), 'troo-api-')), 'data.json')));
describe('Troo API', () => {
  it('serves the public catalog and wallet', async () => { const server = app(); expect((await request(server).get('/health')).body.ok).toBe(true); expect((await request(server).get('/v1/catalog')).body.venues.length).toBeGreaterThan(0); expect((await request(server).get('/v1/wallet')).body.balanceCents).toBe(13000); });
  it('validates top-ups and makes a replay idempotent', async () => { const server = app(); const key = 'd764cc59-6a6a-48b3-96c6-1197d891302f'; const first = await request(server).post('/v1/wallet/top-ups').set('Idempotency-Key', key).send({ amountCents: 2500 }); expect(first.status).toBe(201); expect(first.body.wallet.balanceCents).toBe(15500); const replay = await request(server).post('/v1/wallet/top-ups').set('Idempotency-Key', key).send({ amountCents: 2500 }); expect(replay.status).toBe(200); expect(replay.body.wallet.balanceCents).toBe(15500); expect((await request(server).post('/v1/wallet/top-ups').send({ amountCents: -1 })).status).toBe(400); });
  it('rejects a tampered wallet order total', async () => { const response = await request(app()).post('/v1/orders').send({ lines: [{ menuItemId: 'm1', quantity: 1, unitPriceCents: 1 }], subtotalCents: 1, deliveryFeeCents: 250, totalCents: 251, paymentMethod: 'wallet' }); expect(response.status).toBe(422); });
});
