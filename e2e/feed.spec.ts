import { expect, test } from '@playwright/test';

import { chooseTown, eventCount, openApp, openAppAtFeed } from './helpers';

test.describe('feed', () => {
  test('first open asks one question and never blocks on an account', async ({ page }) => {
    await openApp(page);

    await expect(page.getByText('Where are you?')).toBeVisible();
    // The whole product premise: browsing costs nothing.
    await expect(page.getByText(/sign ?in|sign ?up|create an account/i)).toHaveCount(0);

    await chooseTown(page, 'Wakefield');
    await expect(page.getByText('Wakefield').first()).toBeVisible();
  });

  test('the feed shows at least three cards on a 375x667 screen', async ({ page }) => {
    await openAppAtFeed(page);

    // DESIGN.md tell #4: density is the house style, and the pre-ship audit pins the
    // number. A feed that shows one and a half events has stopped being a feed.
    const fullyVisible = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[aria-label]')].filter((el) =>
        el.getAttribute('aria-label')?.includes('going'),
      );
      return cards.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      }).length;
    });

    expect(fullyVisible).toBeGreaterThanOrEqual(3);
  });

  test('the Now tab only shows events actually in progress', async ({ page }) => {
    await openAppAtFeed(page);
    await page.getByText('Now', { exact: true }).click();

    const body = await page.locator('body').innerText();
    expect(body).toMatch(/Ends in/);
    // Nothing in the Now tab may advertise a future start time.
    expect(body).not.toMatch(/Starts in|Tomorrow|Tonight/);
  });

  test('an empty result names the constraint and offers the fix', async ({ page }) => {
    await openApp(page);
    await chooseTown(page, 'Danvers');

    await page.getByText('Now', { exact: true }).click();
    await page.locator('text=/Within \\d+ mi/').first().click();
    await page.getByText('Within 1 mi', { exact: true }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText(/Nothing happening in Danvers right now\./)).toBeVisible();
    await expect(page.getByText(/Searched 1 mile around Danvers\./)).toBeVisible();
    // Actionable, not a dead end — and singular "mile", which was a real bug once.
    await expect(page.getByText(/Widen to \d+ miles/)).toBeVisible();
    expect(await eventCount(page)).toBe(0);
  });

  test('no console errors through a normal session', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await openAppAtFeed(page);
    await page.getByText('Today', { exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByText('All', { exact: true }).click();
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});
