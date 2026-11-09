import { resolve } from 'node:path';
import { createApp } from './app';
import { LocalStore } from './store';
const port = Number(process.env.PORT ?? 8787);
const store = new LocalStore(resolve(process.env.TROO_DATA_FILE ?? 'server/data/troo.json'));
createApp(store).listen(port, () => console.log(`Troo API listening on http://localhost:${port}`));
