import { expect, test } from '@playwright/test';

import { openAppAtFeed, openCard } from './helpers';

/** The counts are rendered by the odometer, which exposes its value as a label. */
async function counts(page: import('@playwright/test').Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('[aria-label]')]
      .map((el) => el.getAttribute('aria-label') ?? '')
      .filter((label) => /^\d+$/.test(label))
      .map(Number),
  );
}

test.describe('going and interested', () => {
  test('going commits, undoes, and moves the count', async ({ page }) => {
    await openAppAtFeed(page);
    await openCard(page, 'Farmers Market');

    const [goingBefore] = await counts(page);
    expect(goingBefore).toBeGreaterThan(0);

    await page.getByLabel('Going', { exact: true }).click();
    await expect(page.getByLabel("You're going", { exact: true })).toBeVisible();
    expect((await counts(page))[0]).toBe(goingBefore! + 1);

    // Undo is the same tap. It is the only affordance, so it has to work.
    await page.getByLabel("You're going", { exact: true }).click();
    await expect(page.getByLabel('Going', { exact: true })).toBeVisible();
    expect((await counts(page))[0]).toBe(goingBefore);
  });

  test('going and interested are mutually exclusive', async ({ page }) => {
    await openAppAtFeed(page);
    await openCard(page, 'Farmers Market');

    await page.getByLabel('Going', { exact: true }).click();
    await expect(page.getByLabel("You're going", { exact: true })).toBeVisible();

    await page.getByLabel('Interested', { exact: true }).click();
    await expect(page.getByLabel('Saved', { exact: true })).toBeVisible();
    // Switching stance clears the previous one rather than holding both.
    await expect(page.getByLabel('Going', { exact: true })).toBeVisible();
  });

  test('a stance survives a reload', async ({ page }) => {
    await openAppAtFeed(page);
    await openCard(page, 'Farmers Market');

    await page.getByLabel('Interested', { exact: true }).click();
    await expect(page.getByLabel('Saved', { exact: true })).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByLabel('Saved', { exact: true })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('eventr.rsvps.v1'));
    expect(stored).toContain('interested');
  });

  test('rapid taps do not desync the count', async ({ page }) => {
    await openAppAtFeed(page);
    await openCard(page, 'Farmers Market');

    const [before] = await counts(page);
    // Five toggles is odd, so the stance must end up set.
    for (let i = 0; i < 5; i += 1) {
      await page.getByRole('checkbox').first().click({ force: true });
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);

    await expect(page.getByLabel("You're going", { exact: true })).toBeVisible();
    expect((await counts(page))[0]).toBe(before! + 1);
  });

  test('the odometer does not leak its digits to assistive tech', async ({ page }) => {
    await openAppAtFeed(page);
    await openCard(page, 'Farmers Market');

    // Each place renders a 0–9 column. Without hiding them a screen reader reads
    // "zero one two three…" for every number on screen.
    const hidden = await page.evaluate(
      () => document.querySelectorAll('[aria-hidden="true"]').length,
    );
    expect(hidden).toBeGreaterThan(0);

    const numeric = await counts(page);
    expect(numeric.length).toBeGreaterThanOrEqual(2);
  });
});
