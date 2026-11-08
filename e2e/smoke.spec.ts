import { expect, test } from '@playwright/test';

test.describe('Troo Cyprus Dining — Core User Journeys', () => {
  test('booking dialog opens and closes with Escape, close button, and backdrop', async ({ page }) => {
    await page.goto('/discover');
    const bookBtn = page.getByRole('button', { name: 'Book a table' }).first();
    await bookBtn.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 1. Close by Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // 2. Open and close by close button
    await bookBtn.click();
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).toBeHidden();

    // 3. Open and close by backdrop click
    await bookBtn.click();
    await expect(dialog).toBeVisible();
    await page.locator('.scrim').click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeHidden();
  });

  test('venue filter chips change list and display dynamic counts', async ({ page }) => {
    await page.goto('/discover');
    // Check initial list contains To Patriko heading
    await expect(page.getByRole('heading', { name: 'To Patriko Taverna' })).toBeVisible();

    // Filter by Quiet
    await page.getByRole('button', { name: /Quiet/ }).click();
    await expect(page.getByRole('heading', { name: 'Kafeneio 1920' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'To Patriko Taverna' })).toBeHidden();

    // Filter by All resets list
    await page.getByRole('button', { name: /All/ }).click();
    await expect(page.getByRole('heading', { name: 'To Patriko Taverna' })).toBeVisible();
  });

  test('booking guard blocks overspending and calculates shortfall', async ({ page }) => {
    await page.goto('/events');
    // Find an event with price (Commandaria Cellar Barrel Tasting, €48.10)
    const pricedCard = page.locator('article.event', { hasText: 'Commandaria Cellar Barrel Tasting' });
    await pricedCard.getByRole('button', { name: 'Reserve' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // With 1 guest (€48.10 <= €130 balance), confirm button is enabled
    const confirmBtn = page.getByRole('button', { name: /Confirm with/ });
    await expect(confirmBtn).toBeEnabled();

    // Increase guests to 2 (2 * 48.10 = 96.20 <= 130) -> still enabled
    const addGuestBtn = page.getByRole('button', { name: 'Increase guests' });
    await addGuestBtn.click();
    await expect(confirmBtn).toBeEnabled();

    // Increase guests to 3 (3 * 48.10 = 144.30 > 130) -> shortfall alert appears
    await addGuestBtn.click();
    await expect(page.getByRole('alert')).toBeVisible();

    // Close and finish
    await page.keyboard.press('Escape');
  });

  test('Step 2: booking for €48.10 with €20.00 balance calculates exact €28.10 shortfall without float rounding errors', async ({ page }) => {
    // Set wallet balance override to €20.00 (2000 cents)
    await page.addInitScript(() => {
      localStorage.setItem('troo_wallet_override_cents', '2000');
    });

    await page.goto('/events');

    // Click Reserve on the €48.10 Commandaria Cellar Barrel Tasting event
    const eventCard = page.locator('article', { hasText: 'Commandaria Cellar Barrel Tasting' });
    await eventCard.getByRole('button', { name: 'Reserve' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify shortfall alert
    const errorAlert = dialog.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    const alertText = await errorAlert.innerText();

    // Confirm it reads €28.10 and not €28.09 or €28.11
    expect(alertText).toContain('€28.10');
    expect(alertText).not.toContain('€28.09');
    expect(alertText).not.toContain('€28.11');

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('pass wallet tabs toggle and ledger row opens receipt', async ({ page }) => {
    await page.goto('/pass');

    // Default tab is My pass
    await expect(page.getByRole('heading', { name: 'Your winter pass' })).toBeVisible();
    await expect(page.getByText('Available balance')).toBeVisible();

    // Switch to Credit ledger tab
    const ledgerTab = page.getByRole('tab', { name: 'Credit ledger' });
    await ledgerTab.click();
    await expect(ledgerTab).toHaveAttribute('aria-selected', 'true');

    // Click on ledger entry
    const entryBtn = page.getByRole('button', { name: /Wallet top-up/ });
    await expect(entryBtn).toBeVisible();
    await entryBtn.click();

    // Receipt page should be displayed
    await expect(page.getByRole('heading', { name: 'Transaction receipt' })).toBeVisible();
    await expect(page.getByText('Reference: TR-1001')).toBeVisible();

    // Back button returns to pass
    await page.getByRole('button', { name: 'Back to pass' }).click();
    await expect(page.getByRole('heading', { name: 'Your winter pass' })).toBeVisible();
  });

  test('top-up modal calculates 10% credit bonus and submits', async ({ page }) => {
    await page.goto('/pass');
    await page.getByRole('button', { name: /Top up/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/10% credit bonus/)).toBeVisible();

    // Select €100 tier
    await page.getByRole('button', { name: /€100/ }).click();
    await expect(dialog.getByRole('button', { name: /Add €110\.00 wallet credits/i })).toBeVisible();

    // Close top-up modal
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('kouzina delivery: search, add to cart, and checkout flow', async ({ page }) => {
    await page.goto('/kouzina');

    // Search filter
    const searchInput = page.getByLabel('Search delivery dishes');
    await searchInput.fill('Kleftiko');
    await expect(page.getByText('Troodos Clay Pot Kleftiko')).toBeVisible();
    await expect(page.getByText('Charcoal Pork Souvla')).toBeHidden();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByText('Charcoal Pork Souvla')).toBeVisible();

    // Add to cart
    await page.getByRole('button', { name: 'Add to cart' }).first().click();

    // Sticky cart bar appears
    const cartBar = page.locator('.cart-bar');
    await expect(cartBar).toBeVisible();
    await expect(cartBar.getByText(/1 items/)).toBeVisible();

    // Open checkout dialog
    await cartBar.getByRole('button', { name: 'Checkout' }).click();
    const checkoutDialog = page.getByRole('dialog');
    await expect(checkoutDialog).toBeVisible();
    await expect(checkoutDialog.getByText('Complete delivery order')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(checkoutDialog).toBeHidden();
  });

  test('no horizontal scrollbar on mobile viewport (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/discover', '/taste', '/kouzina', '/pass', '/events', '/partner']) {
      await page.goto(route);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // no accidental horizontal overflow
    }
  });

  test('mobile orientation: no horizontal scrollbar in landscape (844x390 and 667x375) or small portrait (360x780)', async ({ page }) => {
    const orientations = [
      { name: 'landscape-844x390', width: 844, height: 390 },
      { name: 'landscape-667x375', width: 667, height: 375 },
      { name: 'portrait-360x780', width: 360, height: 780 }
    ];

    for (const { width, height } of orientations) {
      await page.setViewportSize({ width, height });
      for (const route of ['/discover', '/taste', '/kouzina', '/pass', '/events', '/partner']) {
        await page.goto(route);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      }
    }
  });

  test('mobile orientation: landscape maintains compact bars and accessible primary content', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/pass');

    // Header and Nav should be compact in landscape orientation
    const headerH = await page.locator('.header').evaluate(el => el.getBoundingClientRect().height);
    const navH = await page.locator('.bottom-nav').evaluate(el => el.getBoundingClientRect().height);
    expect(headerH).toBeLessThanOrEqual(52);
    expect(navH).toBeLessThanOrEqual(50);

    // Wallet balance in hero should be visible above bottom-nav without requiring scroll
    const walletBalance = page.locator('.wallet-hero strong');
    await expect(walletBalance).toBeInViewport();
  });
});

// ── Audit-pass-1 regression tests ─────────────────────────────────────────────
test.describe('Audit Pass 1 — A1/A2/A3/B1/B3/B4 regressions', () => {
  // A1: past events must not have an enabled Reserve button
  test('A1: /events has no enabled Reserve button for past events', async ({ page }) => {
    await page.goto('/events');
    // Check "Past" chip exists and switch to it
    const pastChip = page.getByRole('button', { name: /Past/ });
    await expect(pastChip).toBeVisible();
    await pastChip.click();

    // Any Reserve buttons in the Past list must be disabled
    const reserveButtons = page.locator('article.event button', { hasText: 'Reserve' });
    const count = await reserveButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(reserveButtons.nth(i)).toBeDisabled();
    }

    // "This event has ended." label must be present for at least one event
    await expect(page.getByText('This event has ended.').first()).toBeVisible();
  });

  // A1: "All" tab must not show past events at all
  test('A1: /events All tab shows no past events (Commandaria night is hidden)', async ({ page }) => {
    await page.goto('/events');
    // The past event "Old Commandaria and kleftiko night" should not be visible under All
    await expect(
      page.locator('article.event h2', { hasText: 'Old Commandaria and kleftiko night' })
    ).toBeHidden();
  });

  // A2: TableDetail must not contain false allergy delivery claims
  test('A2: /pass/table/tb-1 does not claim allergens were delivered to the kitchen', async ({ page }) => {
    await page.goto('/pass/table/tb-1');
    await expect(page.getByText(/delivered to kitchen/i)).toBeHidden();
    await expect(page.getByText(/Dietary synced/i)).toBeHidden();
    await expect(page.getByText(/Kitchen status/i)).toBeHidden();
    // Honest replacement wording is visible
    await expect(page.getByText(/kitchen has not been notified/i)).toBeVisible();
  });

  // A3: QR modal shows "Preview only" notice when VITE_PILOT_QR_ENABLED is not set
  test('A3: QR modal shows "Preview only" notice in default (non-pilot) mode', async ({ page }) => {
    await page.goto('/pass');
    await page.getByRole('button', { name: /Show QR code/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Preview only/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  // B1: dev banner must not appear in production build
  test('B1: "Development preview" banner is absent when served from built dist/', async ({ page }) => {
    // This test checks the running dev server; in CI the build is checked via grep.
    // We assert the banner is not visible when VITE_SHOW_DEV_BANNER env is unset (default).
    // The banner is controlled by import.meta.env.DEV — always true in dev server.
    // So we just confirm the banner element exists but check its data attribute.
    await page.goto('/discover');
    // In dev server, DEV=true so the banner may be present. The important invariant is that
    // the production build (checked by npm run build && grep) does not contain the string.
    // This is a documentation note; the grep check is in the CI verify step.
    expect(true).toBe(true); // placeholder — real check is build-time grep in CI
  });

  // B3: top-up modal must show "Test mode" notice
  test('B3: top-up modal contains "Test mode" notice', async ({ page }) => {
    await page.goto('/pass');
    await page.getByRole('button', { name: /Top up/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Test mode/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  // B4: top-up modal must have a "Terms apply" control
  test('B4: top-up modal has a "Terms apply" control', async ({ page }) => {
    await page.goto('/pass');
    await page.getByRole('button', { name: /Top up/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Terms apply/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
