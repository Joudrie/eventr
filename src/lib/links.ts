/**
 * Outbound actions: maps, phone, tickets, share, calendar download.
 *
 * Every one of these leaves the app, which is the point. We list events and send
 * people to the organizer — we never sit in the middle of the transaction.
 */

import { Linking, Platform, Share } from 'react-native';

import { buildICS } from './calendar';
import type { FeedEvent } from '@/types/event';

function open(url: string): void {
  Linking.openURL(url).catch(() => {
    // A handler that isn't installed is not worth interrupting the user over.
  });
}

export function openDirections(
  event: Pick<FeedEvent, 'venueName' | 'addressLine' | 'town' | 'latitude' | 'longitude'>,
): void {
  const label = [event.venueName, event.addressLine, event.town]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  const query = encodeURIComponent(
    label.length > 0 ? label : `${event.latitude},${event.longitude}`,
  );

  // Apple Maps on iOS, Google Maps elsewhere — using the wrong one is a jarring
  // handoff on a device where the other is the default.
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${query}&ll=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

  open(url);
}

export function callPhone(phone: string): void {
  open(`tel:${phone.replace(/[^\d+]/g, '')}`);
}

export function emailContact(address: string, subject: string): void {
  open(`mailto:${address}?subject=${encodeURIComponent(subject)}`);
}

export function openExternal(url: string): void {
  open(url);
}

export async function shareEvent(
  event: Pick<FeedEvent, 'id' | 'title' | 'summary'>,
): Promise<void> {
  const url = `https://eventr.app/event/${event.id}`;
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message: `${event.title} — ${event.summary}`, url }
        : { message: `${event.title} — ${event.summary}\n${url}` },
    );
  } catch {
    // Cancelling a share sheet is a normal outcome, not an error.
  }
}

/**
 * Hands the user a real `.ics`. On web that is a download; on native the OS share
 * sheet is the route into whichever calendar app they actually use, which avoids
 * asking for calendar write permission we do not otherwise need.
 */
export function addToCalendar(event: FeedEvent, now: Date): void {
  const ics = buildICS(event, now);

  if (Platform.OS === 'web') {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${
      event.title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .slice(0, 60) || 'event'
    }.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    return;
  }

  void Share.share({ message: ics, title: event.title }).catch(() => {});
}
