/**
 * iCalendar generation.
 *
 * "Add to calendar" has to produce a real `.ics` with the title, time, and address
 * already filled in — a link that opens an empty calendar form is worse than nothing,
 * because the user has already decided and now has to retype what we already knew.
 */

import type { FeedEvent } from '@/types/event';

/** RFC 5545 wants UTC basic format: 20260815T130000Z */
export function toICSDate(date: Date): string {
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Escapes per RFC 5545 §3.3.11. Backslash first, or the escapes we add get re-escaped.
 * An unescaped comma in a venue name silently truncates the field in most calendars.
 */
export function escapeICSText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Lines must not exceed 75 octets; continuations start with a single space.
 * Long descriptions are the common case here, so this is not optional.
 */
export function foldICSLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join('\r\n');
}

export function buildICS(
  event: Pick<
    FeedEvent,
    | 'id'
    | 'title'
    | 'summary'
    | 'description'
    | 'venueName'
    | 'addressLine'
    | 'town'
    | 'startsAt'
    | 'endsAt'
  >,
  stamp: Date,
): string {
  const location = [event.venueName, event.addressLine, event.town]
    .filter((part): part is string => Boolean(part))
    .join(', ');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventr//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventr.app`,
    `DTSTAMP:${toICSDate(stamp)}`,
    `DTSTART:${toICSDate(new Date(event.startsAt))}`,
    `DTEND:${toICSDate(new Date(event.endsAt))}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description ?? event.summary)}`,
    `LOCATION:${escapeICSText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // CRLF, not LF. Some calendar clients reject LF-only files outright.
  return lines.map(foldICSLine).join('\r\n');
}
