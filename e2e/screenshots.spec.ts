import { test } from '@playwright/test';

const viewports = [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1440x900', width: 1440, height: 900 }
];

const routes = [
  { path: '/discover', slug: 'discover' },
  { path: '/taste', slug: 'taste' },
  { path: '/taste/story', slug: 'taste-story' },
  { path: '/kouzina', slug: 'kouzina-delivery' },
  { path: '/pass', slug: 'pass-wallet' },
  { path: '/pass/table/tb-1', slug: 'pass-tonights-table' },
  { path: '/pass/ledger/l1', slug: 'pass-receipt' },
  { path: '/events', slug: 'events' },
  { path: '/partner', slug: 'partner' }
];

for (const vp of viewports) {
  test.describe(`Screenshots — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const r of routes) {
      test(`capture ${r.slug} on ${vp.name}`, async ({ page }) => {
        await page.goto(r.path);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: `docs/screens/${r.slug}-${vp.name}.png`,
          fullPage: true
        });
      });
    }
  });
}
