import { expect, test } from '@playwright/test';

import { eventCount, eventCountLabel, openAppAtFeed } from './helpers';

test.describe('filters', () => {
  test('the radius sheet shows a match count for every option', async ({ page }) => {
    await openAppAtFeed(page);
    await page.locator('text=/Within \\d+ mi/').first().click();

    await expect(page.getByText('Distance')).toBeVisible();

    // The point of this control: you see the shape of your neighbourhood before
    // committing, rather than picking a number and counting what comes back.
    // The chip and the sheet row share a label, so scope to the sheet's own rows.
    for (const miles of [1, 5, 10, 25, 50]) {
      await expect(page.getByText(`Within ${miles} mi`, { exact: true }).last()).toBeVisible();
    }

    // Counts load once the sheet is open; wait for them rather than racing.
    await expect(page.getByLabel(/^\d+ events? within \d+ miles?$/).first()).toBeVisible();

    const counts = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-label]')]
        .map((el) => el.getAttribute('aria-label') ?? '')
        .filter((label) => /^\d+ events? within \d+ miles?$/.test(label)),
    );
    expect(counts.length).toBe(5);

    // Counts must be non-decreasing as the radius widens — a wider ring is a superset.
    const values = counts.map((label) => Number(/^(\d+)/.exec(label)?.[1] ?? 0));
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]!);
    }
  });

  test('radius, price and category compose', async ({ page }) => {
    await openAppAtFeed(page);
    const all = await eventCount(page);
    expect(all).toBeGreaterThan(20);

    await page.locator('text=/Within \\d+ mi/').first().click();
    await page.getByText('Within 5 mi', { exact: true }).click();
    await page.waitForTimeout(500);
    const narrowed = await eventCount(page);
    expect(narrowed).toBeLessThan(all);

    await page.getByText('Any price').click();
    await page.getByText('Free only', { exact: true }).click();
    await page.waitForTimeout(500);
    const free = await eventCount(page);
    expect(free).toBeLessThanOrEqual(narrowed);

    await page.getByText('All categories').click();
    await page.getByText('Running', { exact: true }).click();
    await page.getByText('Done', { exact: true }).click();
    await page.waitForTimeout(500);
    const running = await eventCount(page);
    expect(running).toBeLessThanOrEqual(free);
    expect(running).toBeGreaterThan(0);
  });

  test('filters survive changing town and a full reload', async ({ page }) => {
    await openAppAtFeed(page);

    await page.getByText('Any price').click();
    await page.getByText('Free only', { exact: true }).click();
    await expect(page.getByText('Free only').first()).toBeVisible();

    // Changing town unmounts the feed. Filters used to live in screen state and were
    // silently wiped here, with no indication anything had changed.
    await page.getByText('Wakefield', { exact: true }).first().click();
    await page.getByText('Salem', { exact: true }).first().click();
    await expect(eventCountLabel(page)).toBeVisible();
    await expect(page.getByText('Free only').first()).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText('Free only').first()).toBeVisible();
    await expect(page.getByText('Salem').first()).toBeVisible();
  });
});
