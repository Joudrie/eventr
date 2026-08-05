/**
 * Feed behavior tests — the Phase 1 gate.
 *
 * Pins radius filtering, window semantics, price and category filters, sorting, and
 * ranking. These run against a fixed `now`, so they are deterministic despite the seed
 * data being scheduled relative to the current time.
 *
 * Run: npm run test:feed
 */

import { atCapacity, capacityState, spotsLeft } from '../src/lib/capacity.ts';
import { AD_INTERVAL, composeFeed } from '../src/features/feed/feedItems.ts';
import { rankTowns } from '../src/lib/townRanking.ts';
import { TOWNS, DEFAULT_TOWN } from '../src/lib/towns.ts';
import { eventCountsByTown } from '../src/data/local.ts';
import type { Ad } from '../src/data/ads.ts';
import { queryLocalEvents, weekendRange } from '../src/data/local.ts';
import { RANKING, distanceMeters, eventScore } from '../src/data/ranking.ts';
import { SEED_ORIGIN } from '../src/data/seed/events.ts';
import {
  DEFAULT_FILTERS,
  METERS_PER_MILE,
  type FeedEvent,
  type FeedFilters,
} from '../src/types/event.ts';

/* ------------------------------------------------------------ tiny harness */

let passed = 0;
const failures: string[] = [];

function check(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    failures.push(`${name}\n    ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message} — expected ${expected}, got ${actual}`);
}

/* ------------------------------------------------------------------ set-up */

/** A Wednesday at 10:00 local. Mid-week and mid-morning, so no window is degenerate. */
const NOW = new Date(2026, 7, 5, 10, 0, 0, 0);

function filters(overrides: Partial<FeedFilters> = {}): FeedFilters {
  return { ...DEFAULT_FILTERS, origin: SEED_ORIGIN, limit: 100, ...overrides };
}

/* ------------------------------------------------------------------- tests */

check('radius excludes anything beyond it', () => {
  const near = queryLocalEvents(filters({ radiusM: 5 * METERS_PER_MILE }), NOW);
  assert(near.total > 0, 'expected results within 5 miles of Wakefield');
  for (const event of near.events) {
    assert(
      event.distanceM <= 5 * METERS_PER_MILE,
      `${event.title} is ${(event.distanceM / METERS_PER_MILE).toFixed(1)} mi away`,
    );
  }
});

check('a wider radius is a strict superset', () => {
  const tight = queryLocalEvents(filters({ radiusM: 5 * METERS_PER_MILE }), NOW);
  const wide = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(wide.total > tight.total, 'widening the radius should find more');

  const wideIds = new Set(wide.events.map((e) => e.id));
  for (const event of tight.events) {
    assert(wideIds.has(event.id), `${event.title} vanished when the radius widened`);
  }
});

check('the far-away seed event sits between the 25 and 50 mile rings', () => {
  // Wachusett is roughly 42 miles from Wakefield, which makes it the seed row that
  // proves the radius boundary actually bites rather than being decorative.
  const at25 = queryLocalEvents(filters({ radiusM: 25 * METERS_PER_MILE }), NOW);
  const at50 = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);

  assert(
    !at25.events.some((e) => e.id === 'e-far-away'),
    'Wachusett should be excluded at 25 miles',
  );
  assert(
    at50.events.some((e) => e.id === 'e-far-away'),
    'Wachusett should be included at 50 miles',
  );
});

check('ended events never appear', () => {
  const all = queryLocalEvents(filters({ radiusM: 60 * METERS_PER_MILE }), NOW);
  for (const event of all.events) {
    assert(new Date(event.endsAt) > NOW, `${event.title} has already ended`);
  }
});

check('the now window returns only events in progress', () => {
  const live = queryLocalEvents(filters({ window: 'now', radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(live.total > 0, 'seed data should always include something live right now');
  for (const event of live.events) {
    assert(
      new Date(event.startsAt) <= NOW && new Date(event.endsAt) > NOW,
      `${event.title} is not actually live`,
    );
  }
});

check('the today window stays within today', () => {
  const today = queryLocalEvents(filters({ window: 'today', radiusM: 50 * METERS_PER_MILE }), NOW);
  const endOfDay = new Date(2026, 7, 6, 0, 0, 0, 0);
  for (const event of today.events) {
    assert(new Date(event.startsAt) < endOfDay, `${event.title} starts after today`);
  }
});

check('weekendRange lands on Saturday and spans two days', () => {
  const { from, to } = weekendRange(NOW);
  assertEqual(from.getDay(), 6, 'weekend should start on a Saturday');
  assertEqual(to.getDay(), 1, 'weekend should end at Monday 00:00');
  assertEqual((to.getTime() - from.getTime()) / 86_400_000, 2, 'weekend should span 2 days');
});

check('weekendRange on a Saturday means today, not next week', () => {
  const saturday = new Date(2026, 7, 8, 9, 0, 0, 0);
  assertEqual(saturday.getDay(), 6, 'fixture should be a Saturday');
  const { from } = weekendRange(saturday);
  assertEqual(from.getDate(), 8, 'Saturday morning should resolve to the current weekend');
});

check('weekendRange on a Sunday means today', () => {
  const sunday = new Date(2026, 7, 9, 9, 0, 0, 0);
  assertEqual(sunday.getDay(), 0, 'fixture should be a Sunday');
  const { from } = weekendRange(sunday);
  assertEqual(from.getDate(), 8, 'Sunday should resolve back to the current weekend');
});

check('free filter excludes every paid event', () => {
  const free = queryLocalEvents(filters({ freeOnly: true, radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(free.total > 0, 'expected free events');
  for (const event of free.events) {
    assertEqual(event.priceTier, 'free', `${event.title} is not free`);
  }
});

check('max price filter respects the floor price', () => {
  const cheap = queryLocalEvents(filters({ maxPrice: 10, radiusM: 50 * METERS_PER_MILE }), NOW);
  for (const event of cheap.events) {
    assert((event.priceFrom ?? 0) <= 10, `${event.title} starts above $10`);
  }
  assert(
    !cheap.events.some((e) => e.id === 'e-melrose-symphony'),
    'a $22 event should not pass a $10 ceiling',
  );
});

check('category filter is exclusive', () => {
  const music = queryLocalEvents(
    filters({ categories: ['music'], radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  assert(music.total > 0, 'expected music events');
  for (const event of music.events) {
    assertEqual(event.category, 'music', `${event.title} is not music`);
  }
});

check('verified filter only returns verified organizers', () => {
  const verified = queryLocalEvents(
    filters({ verifiedOnly: true, radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  assert(verified.total > 0, 'expected verified events');
  for (const event of verified.events) {
    assert(event.verified, `${event.posterName} is not verified`);
  }
});

check('nearest sort is monotonic by distance', () => {
  const nearest = queryLocalEvents(
    filters({ sort: 'nearest', radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  const open = nearest.events.filter((e) => !atCapacity(e));
  for (let i = 1; i < open.length; i += 1) {
    assert(
      open[i]!.distanceM >= open[i - 1]!.distanceM,
      `nearest sort went backwards at ${open[i]!.title}`,
    );
  }
});

check('soonest sort is monotonic by start time', () => {
  const soonest = queryLocalEvents(
    filters({ sort: 'soonest', radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  const open = soonest.events.filter((e) => !atCapacity(e));
  for (let i = 1; i < open.length; i += 1) {
    assert(
      Date.parse(open[i]!.startsAt) >= Date.parse(open[i - 1]!.startsAt),
      `soonest sort went backwards at ${open[i]!.title}`,
    );
  }
});

check('ranked sort is monotonic by score', () => {
  const ranked = queryLocalEvents(filters({ sort: 'ranked', radiusM: 50 * METERS_PER_MILE }), NOW);
  const open = ranked.events.filter((e) => !atCapacity(e));
  for (let i = 1; i < open.length; i += 1) {
    assert(open[i]!.score <= open[i - 1]!.score, `ranked sort went backwards at ${open[i]!.title}`);
  }
});

check('events with no room left sort below open ones', () => {
  const ranked = queryLocalEvents(filters({ sort: 'ranked', radiusM: 50 * METERS_PER_MILE }), NOW);
  const firstFull = ranked.events.findIndex((e) => atCapacity(e));
  if (firstFull >= 0) {
    const openAfter = ranked.events.slice(firstFull).filter((e) => !atCapacity(e));
    assertEqual(openAfter.length, 0, 'an open event sorted below one with no room');
  }
});

check('a boost cannot beat an event that is both closer and sooner', () => {
  const shared = { radiusM: 10_000, goingCount: 10, useTraction: true, now: NOW };
  const soon = new Date(NOW.getTime() + 3_600_000);
  const later = new Date(NOW.getTime() + 20 * 86_400_000);

  const nearSoon = eventScore({
    ...shared,
    distanceM: 500,
    startsAt: soon,
    endsAt: new Date(soon.getTime() + 3_600_000),
    boosted: false,
  });
  const farLaterBoosted = eventScore({
    ...shared,
    distanceM: 9_500,
    startsAt: later,
    endsAt: new Date(later.getTime() + 3_600_000),
    boosted: true,
  });

  assert(
    nearSoon > farLaterBoosted,
    `a boost bought the top slot: ${farLaterBoosted.toFixed(3)} beat ${nearSoon.toFixed(3)}`,
  );
});

check('traction is dampened so big events cannot bury small ones', () => {
  const shared = {
    radiusM: 10_000,
    startsAt: new Date(NOW.getTime() + 3_600_000),
    endsAt: new Date(NOW.getTime() + 7_200_000),
    boosted: false,
    useTraction: true,
    now: NOW,
  };

  const smallAndClose = eventScore({ ...shared, distanceM: 400, goingCount: 8 });
  const hugeAndFar = eventScore({ ...shared, distanceM: 9_000, goingCount: 5000 });

  assert(
    smallAndClose > hugeAndFar,
    `a 5000-person event buried a local one: ${hugeAndFar.toFixed(3)} vs ${smallAndClose.toFixed(3)}`,
  );
});

check('the now window ignores traction entirely', () => {
  const live = queryLocalEvents(filters({ window: 'now', radiusM: 50 * METERS_PER_MILE }), NOW);
  for (const event of live.events) {
    const withoutTraction = eventScore({
      distanceM: event.distanceM,
      radiusM: 50 * METERS_PER_MILE,
      startsAt: new Date(event.startsAt),
      endsAt: new Date(event.endsAt),
      goingCount: event.goingCount,
      boosted: event.boosted,
      useTraction: false,
      now: NOW,
    });
    assert(
      Math.abs(event.score - withoutTraction) < 1e-9,
      `${event.title} carried a traction term into the Now tab`,
    );
  }
});

check('pagination covers the full set without duplicates', () => {
  const all = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE, limit: 100 }), NOW);
  const seen = new Set<string>();
  let offset = 0;
  let guard = 0;

  for (;;) {
    const page = queryLocalEvents(
      filters({ radiusM: 50 * METERS_PER_MILE, limit: 7, offset }),
      NOW,
    );
    for (const event of page.events) {
      assert(!seen.has(event.id), `${event.title} appeared on two pages`);
      seen.add(event.id);
    }
    if (!page.hasMore) break;
    offset += 7;
    guard += 1;
    assert(guard < 50, 'pagination did not terminate');
  }

  assertEqual(seen.size, all.total, 'paging did not cover every matching event');
});

check('distance math is sane against a known separation', () => {
  // Wakefield center to Boston Common is roughly 11 miles as the crow flies.
  const miles = distanceMeters(SEED_ORIGIN, { latitude: 42.355, longitude: -71.0656 }) / 1609.344;
  assert(miles > 9 && miles < 13, `expected roughly 11 miles, got ${miles.toFixed(1)}`);
});

check('every seed event has a poster and a plausible price shape', () => {
  const all = queryLocalEvents(filters({ radiusM: 200 * METERS_PER_MILE, limit: 100 }), NOW);
  for (const event of all.events) {
    assert(event.posterName !== 'Unknown', `${event.title} references a missing poster`);
    if (event.priceTier === 'free') {
      assert((event.priceFrom ?? 0) === 0, `${event.title} is free but has a price floor`);
    }
    assert(event.summary.length <= 120, `${event.title} has an over-long summary`);
    assert(event.title.length <= 80, `${event.title} has an over-long title`);
  }
});

check('an event with no room never outranks an open one', () => {
  const ranked = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);
  const firstFull = ranked.events.findIndex((e) => atCapacity(e));
  if (firstFull >= 0) {
    const openAfter = ranked.events.slice(firstFull).filter((e) => !atCapacity(e));
    assertEqual(openAfter.length, 0, 'an open event sorted below one with no room');
  }
});

/* ------------------------------------------------------------------ report */

/* ------------------------------------------------------------------ capacity */

check('no stated capacity can never produce a capacity badge', () => {
  // Most events have no meaningful limit. If a missing capacity could produce a badge,
  // the badge would appear on the whole feed and mean nothing.
  assertEqual(capacityState(null, 500), 'open', 'null capacity');
  assertEqual(capacityState(undefined, 500), 'open', 'undefined capacity');
  assertEqual(capacityState(0, 500), 'open', 'zero capacity');
  assertEqual(capacityState(-10, 500), 'open', 'negative capacity');
  assertEqual(spotsLeft(null, 5), null, 'no capacity means no spots figure');
});

check('the capacity thresholds are where they claim to be', () => {
  assertEqual(capacityState(100, 69), 'open', '69 of 100 is still just open');
  assertEqual(capacityState(100, 70), 'filling', '70 of 100 starts filling');
  assertEqual(capacityState(100, 94), 'filling', '94 of 100 is not yet full');
  assertEqual(capacityState(100, 95), 'full', '95 of 100 is effectively full');
  assertEqual(capacityState(100, 100), 'full', 'exactly full is full');
  assertEqual(capacityState(100, 101), 'over', 'more hands than seats');
});

check('spots left never goes negative', () => {
  // An oversubscribed event must not offer "-9 spots left".
  assertEqual(spotsLeft(50, 59), 0, 'oversubscribed reads as zero left');
  assertEqual(spotsLeft(50, 20), 30, 'ordinary case');
});

check('the capacity badge stays rare across the whole feed', () => {
  const { events } = queryLocalEvents(
    { ...DEFAULT_FILTERS, origin: SEED_ORIGIN, radiusM: 50 * METERS_PER_MILE, limit: 200 },
    new Date(),
  );
  const withCapacity = events.filter((event) => event.capacity != null);
  const badged = events.filter((event) => event.capacityState !== 'open');

  assert(withCapacity.length > 0, 'at least one event should state a limit');
  // A badge on a third of the feed is decoration. This keeps it information.
  assert(
    badged.length <= events.length * 0.15,
    `capacity badges on ${badged.length} of ${events.length} events is too many to mean anything`,
  );
  assert(
    badged.every((event) => event.capacity != null),
    'a badge appeared on an event with no stated capacity',
  );
});

/* --------------------------------------------------------- paid placement */

const TEST_AD: Ad = {
  id: 'test-ad',
  advertiser: 'Test',
  headline: 'Headline',
  body: 'Body',
  cta: 'Go',
  url: 'https://example.org',
  image: null,
  house: true,
};

function fakeEvents(count: number, boostedAt = -1): FeedEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    ...({} as FeedEvent),
    id: `e${i}`,
    boosted: i === boostedAt,
  }));
}

check('ads appear once every interval and no more often', () => {
  const items = composeFeed({ events: fakeEvents(40), ads: [TEST_AD], complete: true });
  const ads = items.filter((item) => item.kind === 'ad');
  const events = items.filter((item) => item.kind === 'event');

  assertEqual(events.length, 40, 'every event survives composition');
  assertEqual(ads.length, Math.floor(40 / AD_INTERVAL), 'one ad per interval, no extras');

  // The gap between ads is what a reader actually experiences. Assert it directly
  // rather than trusting the count: a bug that clustered two ads together would still
  // produce the right total.
  const positions = items.flatMap((item, index) => (item.kind === 'ad' ? [index] : []));
  for (let i = 1; i < positions.length; i += 1) {
    assertEqual(positions[i]! - positions[i - 1]!, AD_INTERVAL + 1, 'ads drifted out of step');
  }
});

check('a short list still carries exactly one ad, at the bottom', () => {
  const items = composeFeed({ events: fakeEvents(3), ads: [TEST_AD], complete: true });
  const ads = items.filter((item) => item.kind === 'ad');
  assertEqual(ads.length, 1, 'a short result set gets one ad');
  assertEqual(items[items.length - 1]!.kind, 'ad', 'and it goes below everything asked for');
});

check('an incomplete list does not get a bottom ad', () => {
  // Otherwise the end-of-list ad shows on page one and then jumps into the middle of
  // the feed the moment page two arrives.
  const items = composeFeed({ events: fakeEvents(3), ads: [TEST_AD], complete: false });
  assertEqual(items.filter((item) => item.kind === 'ad').length, 0, 'no ad while still loading');
});

check('an empty result set shows no ad at all', () => {
  // Nothing is worse than searching, finding nothing, and being sold something.
  const items = composeFeed({ events: [], ads: [TEST_AD], complete: true });
  assertEqual(items.length, 0, 'an empty feed stays empty');
});

check('at most one promoted slot, and it never duplicates the event', () => {
  const items = composeFeed({ events: fakeEvents(20, 5), ads: [TEST_AD], complete: true });
  const promoted = items.filter((item) => item.kind === 'promoted');
  assertEqual(promoted.length, 1, 'exactly one paid slot');
  assertEqual(items[0]!.kind, 'promoted', 'and it is at the top');

  const ids = items.flatMap((item) => (item.kind === 'ad' ? [] : [item.event.id]));
  assertEqual(new Set(ids).size, ids.length, 'the boosted event appeared twice');
  assertEqual(ids.length, 20, 'no event was lost to promotion');
});

check('a boosted event buys a slot, not a rank', () => {
  // The organic order must be identical with and without the boost. If promoting an
  // event also reordered the rest, the paid slot would be laundering a ranking change.
  const withBoost = composeFeed({ events: fakeEvents(20, 5), ads: [], complete: true });
  const organic = withBoost.flatMap((item) => (item.kind === 'event' ? [item.event.id] : []));
  const expected = fakeEvents(20)
    .map((event) => event.id)
    .filter((id) => id !== 'e5');
  assertEqual(organic.join(','), expected.join(','), 'promotion disturbed the organic order');
});

check('no paid term survives in the ranking function', () => {
  // The guarantee above is only true while scoring ignores boosting entirely.
  assert(
    !Object.keys(RANKING).some((key) => /boost/i.test(key)),
    'RANKING regained a paid weight — boosting must buy a labelled slot, not a position',
  );
});

/* ------------------------------------------------------------- town order */

const rankOf = (name: string, count: (town: { name: string }) => number): number =>
  rankTowns(TOWNS, DEFAULT_TOWN, count).findIndex((entry) => entry.town.name === name);

check('a lively town beats a closer dead one', () => {
  // The whole reason this is not sorted by distance. Boston is ten miles from
  // Wakefield; if something is always on there and nothing is on next door, it belongs
  // at the top, and pure proximity would bury it under a dozen empty towns.
  const busyBoston = rankOf('Boston', (town) => (town.name === 'Boston' ? 20 : 2));
  assertEqual(busyBoston, 0, 'a far town with real density should lead');

  const deadBoston = rankOf('Boston', (town) => (town.name === 'Boston' ? 0 : 3));
  assert(deadBoston > 5, 'a far town with nothing on should not lead');
});

check('proximity still counts for something', () => {
  // With everything equally busy it collapses to distance, which is the right tiebreak.
  const order = rankTowns(TOWNS, DEFAULT_TOWN, () => 3);
  for (let i = 1; i < order.length; i += 1) {
    assert(
      order[i]!.distanceM >= order[i - 1]!.distanceM,
      `equal density should order by distance, but ${order[i]!.town.name} came after a farther town`,
    );
  }
});

check('density saturates so one city cannot own every list', () => {
  // A town with 300 listings must not outrank a town with 30 by ten times, or a
  // hyperlocal app just funnels everyone into the nearest city forever.
  const at30 = rankTowns(TOWNS, DEFAULT_TOWN, (town) => (town.name === 'Boston' ? 30 : 8));
  const at300 = rankTowns(TOWNS, DEFAULT_TOWN, (town) => (town.name === 'Boston' ? 300 : 8));
  const scoreAt = (list: ReturnType<typeof rankTowns>) =>
    list.find((entry) => entry.town.name === 'Boston')!.score;
  assert(scoreAt(at300) - scoreAt(at30) < 0.02, 'density kept growing past saturation');
});

check('the home town leads its own list', () => {
  const counts = eventCountsByTown();
  const order = rankTowns(TOWNS, DEFAULT_TOWN, (town) => counts.get(town.name) ?? 0);
  assertEqual(order[0]!.town.name, DEFAULT_TOWN.name, 'where you are should come first');
});

console.log(`feed tests — ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.error(`\n${failures.map((f) => `  FAIL  ${f}`).join('\n\n')}`);
  process.exit(1);
}
