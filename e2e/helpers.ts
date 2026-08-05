import { expect, type Page } from '@playwright/test';

/**
 * Shared steps. Kept deliberately thin — a helper that hides too much makes a failing
 * test hard to read, and these tests exist to be read by someone reviewing the app.
 */

/**
 * The app is a client-rendered SPA, so `load` fires long before anything is on screen.
 * Waiting for the root to have content works on every route — asserting a specific
 * string only worked on the two screens that happened to contain it.
 */
export async function openApp(page: Page, path = '/'): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return (root?.textContent ?? '').trim().length > 0;
  });
}

export async function chooseTown(page: Page, town = 'Wakefield'): Promise<void> {
  await page.getByText(town, { exact: true }).first().click();
  await expect(eventCountLabel(page)).toBeVisible();
}

/**
 * The header's result count. `.first()` matters: the radius sheet also renders
 * "N events within M miles" rows, and an unscoped match hits both.
 */
export function eventCountLabel(page: Page) {
  return page.getByText(/^\d+ events?$/).first();
}

export async function openAppAtFeed(page: Page, town = 'Wakefield'): Promise<void> {
  await openApp(page);
  await chooseTown(page, town);
}

/** The header count, which doubles as "how many events match right now". */
export async function eventCount(page: Page): Promise<number> {
  const text = await eventCountLabel(page).innerText();
  return Number(/(\d+)/.exec(text)?.[1] ?? -1);
}

/**
 * Cards expose their whole summary as an accessible label, so this doubles as a check
 * that the label is present and useful.
 */
export async function cardLabelContaining(page: Page, fragment: string): Promise<string> {
  const label = await page.evaluate(
    (needle) =>
      [...document.querySelectorAll('[aria-label]')]
        .map((el) => el.getAttribute('aria-label'))
        .find((value) => value?.includes(needle)) ?? null,
    fragment,
  );
  expect(label, `no card matching "${fragment}"`).not.toBeNull();
  return label as string;
}

export async function openCard(page: Page, fragment: string): Promise<void> {
  const label = await cardLabelContaining(page, fragment);
  await page
    .locator(`[aria-label="${label.replace(/"/g, '\\"')}"]`)
    .first()
    .click();
  await expect(page.getByLabel('Back to the feed')).toBeVisible();
}

/**
 * The feed's scroll container. Pinned via an attribute once so before/after
 * measurements read the same node — resolving it twice can pick different elements
 * as the layout changes.
 */
export async function pinScroller(page: Page): Promise<void> {
  await page.evaluate(() => {
    const scrollers = [...document.querySelectorAll('div')].filter(
      (el) => el.scrollHeight > el.clientHeight + 50,
    );
    const deepest = scrollers[scrollers.length - 1];
    if (deepest) deepest.setAttribute('data-e2e-scroller', '');
  });
}

export async function scrollFeed(page: Page, wheelSteps = 9): Promise<void> {
  await pinScroller(page);
  await page.mouse.move(187, 500);
  for (let i = 0; i < wheelSteps; i += 1) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(600);
}

export async function scrollOffset(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-e2e-scroller]');
    return el ? Math.round(el.scrollTop) : -1;
  });
}

/** Only tap cards that are genuinely on screen — Playwright scrolls to reach one that isn't. */
export async function visibleCardLabel(page: Page): Promise<string> {
  const label = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[aria-label]')].filter((el) =>
      el.getAttribute('aria-label')?.includes('going'),
    );
    const onScreen = cards.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top > 200 && rect.bottom < window.innerHeight;
    });
    return onScreen?.getAttribute('aria-label') ?? null;
  });
  expect(label, 'no fully visible card to tap').not.toBeNull();
  return label as string;
}
