/**
 * Formatting tests — time, distance, and price display.
 *
 * These are the strings a user reads on every single card, so they are worth pinning.
 * Run: npm run test:format
 */

import { buildICS, escapeICSText, foldICSLine, toICSDate } from '../src/lib/calendar.ts';
import { formatDistance, shortPrice } from '../src/lib/geo.ts';
import { formatClock, formatEventTime, isLive } from '../src/lib/time.ts';
import { searchTowns, nearestTown } from '../src/lib/towns.ts';
import { METERS_PER_MILE } from '../src/types/event.ts';

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

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message} — expected "${expected}", got "${actual}"`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Wednesday 2026-08-05, 10:00 local. */
const NOW = new Date(2026, 7, 5, 10, 0, 0, 0);
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 7, 5 + day, hour, minute, 0, 0);

/* -------------------------------------------------------------------- clock */

check('clock has no leading zero and a real meridiem', () => {
  assertEqual(formatClock(at(0, 9, 0)), '9:00 AM', 'morning');
  assertEqual(formatClock(at(0, 18, 45)), '6:45 PM', 'evening');
  assertEqual(formatClock(at(0, 0, 5)), '12:05 AM', 'after midnight');
  assertEqual(formatClock(at(0, 12, 0)), '12:00 PM', 'noon');
});

/* --------------------------------------------------------------- event time */

check('an event in progress reports time remaining, not start time', () => {
  const startsAt = at(0, 9, 30);
  const endsAt = at(0, 12, 0);
  assert(isLive(startsAt, endsAt, NOW), 'fixture should be live');
  assertEqual(formatEventTime(startsAt, endsAt, NOW), 'Ends in 2 hr', 'live event');
});

check('a live event ending within the hour counts down in minutes', () => {
  assertEqual(formatEventTime(at(0, 9, 30), at(0, 10, 40), NOW), 'Ends in 40 min', 'ending soon');
});

check('an event starting within the hour counts up in minutes', () => {
  assertEqual(
    formatEventTime(at(0, 10, 40), at(0, 12, 0), NOW),
    'Starts in 40 min',
    'starting soon',
  );
});

check('evening events today read as Tonight', () => {
  assertEqual(formatEventTime(at(0, 18, 30), at(0, 20, 0), NOW), 'Tonight 6:30 PM', 'tonight');
});

check('daytime events today read as Today', () => {
  assertEqual(formatEventTime(at(0, 14, 0), at(0, 16, 0), NOW), 'Today 2:00 PM', 'today');
});

check('tomorrow is named', () => {
  assertEqual(formatEventTime(at(1, 9, 0), at(1, 13, 0), NOW), 'Tomorrow 9:00 AM', 'tomorrow');
});

check('inside a week uses the weekday', () => {
  // 2026-08-05 is a Wednesday, so +3 days is Saturday.
  assertEqual(formatEventTime(at(3, 9, 0), at(3, 13, 0), NOW), 'Sat 9:00 AM', 'this week');
});

check('beyond a week falls back to a date', () => {
  assertEqual(formatEventTime(at(12, 4, 30), at(12, 9, 30), NOW), 'Aug 17', 'far out');
});

check('a day boundary is a calendar day, not 24 hours', () => {
  // 11pm tonight is "Tonight" even though it is 13 hours away; 1am is "Tomorrow"
  // even though it is only two hours after that.
  assertEqual(formatEventTime(at(0, 23, 0), at(1, 1, 0), NOW), 'Tonight 11:00 PM', 'late tonight');
  assertEqual(formatEventTime(at(1, 1, 0), at(1, 3, 0), NOW), 'Tomorrow 1:00 AM', 'early tomorrow');
});

/* ----------------------------------------------------------------- distance */

check('distance carries a decimal only where it changes a decision', () => {
  assertEqual(formatDistance(2.34 * METERS_PER_MILE), '2.3 mi', 'close');
  assertEqual(formatDistance(9.96 * METERS_PER_MILE), '10.0 mi', 'just under ten');
  assertEqual(formatDistance(27.4 * METERS_PER_MILE), '27 mi', 'far');
  assertEqual(formatDistance(30), 'Right here', 'basically here');
});

/* -------------------------------------------------------------------- price */

check('free events say Free', () => {
  assertEqual(
    shortPrice({ priceTier: 'free', priceLabel: 'Free', priceFrom: null }),
    'Free',
    'free',
  );
});

check('a tiered price shows the floor with a plus', () => {
  assertEqual(
    shortPrice({ priceTier: 'paid', priceLabel: '$5 general / $20 sideline', priceFrom: 5 }),
    '$5+',
    'tiered',
  );
});

check('a single price shows exactly that price', () => {
  assertEqual(shortPrice({ priceTier: 'paid', priceLabel: '$12', priceFrom: 12 }), '$12', 'flat');
});

check('a paid event with no floor says Paid rather than inventing a number', () => {
  assertEqual(
    shortPrice({ priceTier: 'paid', priceLabel: 'Whatever you order', priceFrom: null }),
    'Paid',
    'unknown price',
  );
});

/* -------------------------------------------------------------------- towns */

check('town search puts prefix matches ahead of substring matches', () => {
  const results = searchTowns('me');
  assert(results.length >= 2, 'expected matches for "me"');
  assertEqual(results[0]?.name, 'Melrose', 'first prefix match');
  assert(
    results.findIndex((t) => t.name === 'Medford') <
      results.findIndex((t) => t.name === 'Somerville'),
    'prefix matches should outrank substring matches',
  );
});

check('town search is case insensitive and trims', () => {
  assertEqual(searchTowns('  WAKEfield ')[0]?.name, 'Wakefield', 'messy input');
});

check('nearest town resolves a coordinate to a real place', () => {
  assertEqual(nearestTown({ latitude: 42.5065, longitude: -71.0723 }).name, 'Wakefield', 'exact');
  assertEqual(nearestTown({ latitude: 42.3601, longitude: -71.0589 }).name, 'Boston', 'downtown');
});

/* ---------------------------------------------------------------- calendar */

const icsEvent = {
  id: 'e-wakefield-market',
  title: 'Wakefield Farmers Market',
  summary: 'Twenty-two vendors on the common.',
  description: 'Rain or shine; parking fills by 9:15. Bring bags, cash, and a friend.',
  venueName: 'Hall Park',
  addressLine: 'Church St',
  town: 'Wakefield',
  startsAt: new Date(Date.UTC(2026, 7, 15, 13, 0, 0)).toISOString(),
  endsAt: new Date(Date.UTC(2026, 7, 15, 17, 0, 0)).toISOString(),
};

check('ICS uses UTC basic format', () => {
  assertEqual(toICSDate(new Date(Date.UTC(2026, 7, 15, 13, 0, 0))), '20260815T130000Z', 'utc');
  assertEqual(toICSDate(new Date(Date.UTC(2026, 0, 2, 3, 4, 5))), '20260102T030405Z', 'padding');
});

check('ICS escapes the characters that would truncate a field', () => {
  assertEqual(escapeICSText('Hall Park, Church St'), 'Hall Park\\, Church St', 'comma');
  assertEqual(escapeICSText('a;b'), 'a\\;b', 'semicolon');
  assertEqual(escapeICSText('line\nbreak'), 'line\\nbreak', 'newline');
  // Backslash must be escaped first or the escapes we add get re-escaped.
  assertEqual(escapeICSText('back\\slash'), 'back\\\\slash', 'backslash');
});

check('ICS folds lines at 75 octets with a leading space', () => {
  const folded = foldICSLine(`DESCRIPTION:${'x'.repeat(200)}`);
  const lines = folded.split('\r\n');
  assert(lines.length > 1, 'a 200 character line should fold');
  assert(lines[0]!.length <= 75, `first line was ${lines[0]!.length} octets`);
  for (const continuation of lines.slice(1)) {
    assertEqual(continuation[0], ' ', 'continuations start with a space');
    assert(continuation.length <= 75, `continuation was ${continuation.length} octets`);
  }
});

check('ICS carries the real title, time, and address', () => {
  const ics = buildICS(icsEvent, new Date(Date.UTC(2026, 7, 1, 0, 0, 0)));
  assert(ics.includes('BEGIN:VCALENDAR'), 'has a calendar wrapper');
  assert(ics.includes('SUMMARY:Wakefield Farmers Market'), 'has the title');
  assert(ics.includes('DTSTART:20260815T130000Z'), 'has the start');
  assert(ics.includes('DTEND:20260815T170000Z'), 'has the end');
  assert(ics.includes('LOCATION:Hall Park\\, Church St\\, Wakefield'), 'has an escaped address');
  assert(ics.includes('UID:e-wakefield-market@eventr.app'), 'has a stable uid');
  // Some clients reject LF-only files outright.
  assert(!/[^\r]\n/.test(ics), 'every line break is CRLF');
});

check('ICS falls back to the summary when there is no description', () => {
  const ics = buildICS({ ...icsEvent, description: null }, new Date(Date.UTC(2026, 7, 1)));
  assert(ics.includes('Twenty-two vendors'), 'summary used as description');
});

/* ------------------------------------------------------------------- report */

console.log(`format tests — ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.error(`\n${failures.map((f) => `  FAIL  ${f}`).join('\n\n')}`);
  process.exit(1);
}
