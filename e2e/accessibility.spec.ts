import { test, expect } from '@playwright/test'; import AxeBuilder from '@axe-core/playwright';
for (const route of ['/discover','/taste','/kouzina','/pass','/events','/partner']) test(`a11y ${route}`, async ({ page }) => { await page.goto(route); const result = await new AxeBuilder({ page }).analyze(); expect(result.violations).toEqual([]); });
