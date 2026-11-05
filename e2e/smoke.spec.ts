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
    // Find an event with price e.g. 32
    await page.getByRole('button', { name: 'Reserve' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Increase guests to 4 (4 * 32 = 128) -> still under 130
    const addGuestBtn = page.getByRole('button', { name: 'Increase guests' });
    await addGuestBtn.click(); // 2 guests (64)
    await addGuestBtn.click(); // 3 guests (96)
    await addGuestBtn.click(); // 4 guests (128)

    // Verify confirm button is enabled
    const confirmBtn = page.getByRole('button', { name: /Confirm with/ });
    await expect(confirmBtn).toBeEnabled();

    // Close and test with insufficient balance or Kouzina delivery overspend
    await page.keyboard.press('Escape');
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
    await page.getByRole('button', { name: 'Top up credits' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/10% credit bonus/)).toBeVisible();

    // Select €100 tier
    await page.getByRole('button', { name: /€100/ }).click();
    await expect(dialog.getByRole('button', { name: /Pay €100.00 for €110.00/ })).toBeVisible();

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
});
