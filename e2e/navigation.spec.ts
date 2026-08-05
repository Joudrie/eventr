import { expect, test } from '@playwright/test';

import {
  eventCountLabel,
  openApp,
  openAppAtFeed,
  scrollFeed,
  scrollOffset,
  visibleCardLabel,
} from './helpers';

test.describe('navigation', () => {
  test('scroll position survives a round trip to an event', async ({ page }) => {
    await openAppAtFeed(page);
    await scrollFeed(page);

    const before = await scrollOffset(page);
    expect(before).toBeGreaterThan(300);

    // Tap something already on screen. Clicking an off-screen card makes Playwright
    // scroll it into view first, which moves the feed and invalidates the test —
    // that mistake once looked exactly like an app bug.
    const label = await visibleCardLabel(page);
    await page
      .locator(`[aria-label="${label.replace(/"/g, '\\"')}"]`)
      .first()
      .click();
    await expect(page.getByLabel('Back to the feed')).toBeVisible();

    await page.getByLabel('Back to the feed').click();
    await expect(eventCountLabel(page)).toBeVisible();
    await page.waitForTimeout(800);

    // Losing your place after scrolling past forty events is the single most
    // enraging bug in any feed app.
    expect(await scrollOffset(page)).toBe(before);
  });

  test('a shared event link opens the event directly', async ({ page }) => {
    await openApp(page, '/event/e-wakefield-market');

    await expect(page.getByText('Wakefield Farmers Market')).toBeVisible();
    await expect(page.getByText('Hall Park')).toBeVisible();
    await expect(page).toHaveTitle(/Wakefield Farmers Market/);
  });

  test('the detail view carries the full price breakdown the card could not', async ({ page }) => {
    await openApp(page, '/event/e-wakefield-football');

    // The card only has room for a floor price; the detail shows the real tiers.
    await expect(page.getByText('$5 general / $20 sideline')).toBeVisible();
  });

  test('an event that does not exist explains itself', async ({ page }) => {
    await openApp(page, '/event/does-not-exist');

    await expect(page.getByText('This event is no longer listed.')).toBeVisible();
    await expect(page.getByText('Back to the feed')).toBeVisible();
  });

  test('pages carry a real title and share description', async ({ page }) => {
    await openApp(page);
    await expect(page).toHaveTitle(/Eventr/);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).not.toBe('');
  });
});
