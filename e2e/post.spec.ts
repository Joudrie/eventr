import { expect, test } from '@playwright/test';

import { eventCount, openAppAtFeed } from './helpers';

test.describe('posting', () => {
  test('validation explains what is missing rather than disabling the button', async ({ page }) => {
    await openAppAtFeed(page);
    await page.getByText('Post an event').first().click();
    await expect(page.getByText('Post event', { exact: true })).toBeVisible();

    // Submitting empty must say what is wrong. A disabled button that does not
    // explain itself is hostile.
    await page.getByText('Post event', { exact: true }).click();

    await expect(page.getByText('Give it a name people will recognise.')).toBeVisible();
    await expect(page.getByText('One sentence, so people know what it is.')).toBeVisible();
    await expect(page.getByText('Pick one, so it shows up in the right filter.')).toBeVisible();
  });

  test('an event can be posted with a description and tags', async ({ page }) => {
    await openAppAtFeed(page);
    const before = await eventCount(page);

    await page.getByText('Post an event').first().click();
    await page.getByLabel('Title').fill('Beebe Library Seed Swap');
    await page
      .getByLabel('One line')
      .fill('Bring seeds, take seeds. Tomato starts and a lot of zinnias.');
    await page.getByLabel('Details').fill('Tables open at ten in the community room downstairs.');
    await page.getByText('Market', { exact: true }).first().click();

    for (const tag of ['seeds', 'kids welcome']) {
      await page.getByLabel('Add a tag').fill(tag);
      await page.getByText('Add', { exact: true }).click();
    }
    await expect(page.getByText('seeds', { exact: true })).toBeVisible();
    await expect(page.getByText('kids welcome', { exact: true })).toBeVisible();

    await page.getByText('Tomorrow', { exact: true }).first().click();
    await page.getByLabel('Venue').fill('Beebe Memorial Library');
    await page.getByText('Post event', { exact: true }).click();

    // Lands on the new event, and says plainly who can see it.
    await expect(page.getByText('Beebe Library Seed Swap')).toBeVisible();
    await expect(page.getByText(/Only you can see this/)).toBeVisible();
    await expect(page.getByText('seeds', { exact: true })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('eventr.myEvents.v1'));
    expect(stored).toContain('Beebe Library Seed Swap');
    expect(stored).toContain('kids welcome');

    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await eventCount(page)).toBe(before + 1);

    // Pinned to the top: a post its author cannot find is the fastest way to
    // convince someone that posting does not work.
    await expect(page.getByText('Beebe Library Seed Swap')).toBeVisible();
    await expect(page.getByText('Pending review').first()).toBeVisible();
  });

  test('a bad date is rejected rather than silently rolled forward', async ({ page }) => {
    await openAppAtFeed(page);
    await page.getByText('Post an event').first().click();

    await page.getByLabel('Title').fill('Impossible Day');
    await page.getByLabel('One line').fill('February the thirty-first.');
    await page.getByText('Market', { exact: true }).first().click();
    await page.getByLabel('Date').fill('2026-02-31');
    await page.getByText('Post event', { exact: true }).click();

    // `new Date(2026, 1, 31)` rolls to March without complaint.
    await expect(page.getByText("That date doesn't exist.")).toBeVisible();
  });
});
