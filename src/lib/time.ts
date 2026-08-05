/**
 * Time formatting. Relative when it's soon, absolute when it isn't.
 *
 * INTERACTIONS.md §8. The point is that "Starts in 40 min" and "Sat, Aug 15" answer
 * different questions, and which question the user is asking depends entirely on how
 * far away the event is. A single format for everything makes the near ones useless.
 *
 * Everything is computed from a passed-in `now` so the tests are deterministic.
 */

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Evening starts at 5pm — after that "Tonight" is how people actually talk. */
const EVENING_HOUR = 17;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysApart(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** "7:30 PM", "9:00 AM". No leading zero on the hour — nobody writes 09:00. */
export function formatClock(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours < 12 ? 'AM' : 'PM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function isLive(startsAt: Date, endsAt: Date, now: Date): boolean {
  return startsAt.getTime() <= now.getTime() && endsAt.getTime() > now.getTime();
}

/**
 * The single line of time text on a card. Live events report how long is left,
 * because at that point "when does it start" is the wrong question.
 */
export function formatEventTime(startsAt: Date, endsAt: Date, now: Date): string {
  if (isLive(startsAt, endsAt, now)) {
    const remaining = endsAt.getTime() - now.getTime();
    if (remaining < MS_PER_HOUR) {
      return `Ends in ${Math.max(1, Math.round(remaining / MS_PER_MIN))} min`;
    }
    return `Ends in ${Math.round(remaining / MS_PER_HOUR)} hr`;
  }

  const untilStart = startsAt.getTime() - now.getTime();

  if (untilStart > 0 && untilStart < MS_PER_HOUR) {
    return `Starts in ${Math.max(1, Math.round(untilStart / MS_PER_MIN))} min`;
  }

  const dayGap = daysApart(now, startsAt);

  if (dayGap === 0) {
    return startsAt.getHours() >= EVENING_HOUR
      ? `Tonight ${formatClock(startsAt)}`
      : `Today ${formatClock(startsAt)}`;
  }
  if (dayGap === 1) return `Tomorrow ${formatClock(startsAt)}`;
  if (dayGap > 1 && dayGap < 7) {
    return `${DAY_NAMES[startsAt.getDay()]} ${formatClock(startsAt)}`;
  }
  return `${MONTH_NAMES[startsAt.getMonth()]} ${startsAt.getDate()}`;
}

/** The detail view's fuller line: "Saturday, Aug 15 · 9:00 AM – 1:00 PM". */
export function formatEventRange(startsAt: Date, endsAt: Date): string {
  const day = `${DAY_NAMES[startsAt.getDay()]}, ${MONTH_NAMES[startsAt.getMonth()]} ${startsAt.getDate()}`;
  return `${day} · ${formatClock(startsAt)} – ${formatClock(endsAt)}`;
}

/** Anything posted in the last two hours is worth marking as new. */
export function isJustPosted(createdAt: Date, now: Date): boolean {
  return now.getTime() - createdAt.getTime() < 2 * MS_PER_HOUR;
}
