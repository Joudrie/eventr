/**
 * Build-time event access.
 *
 * Static export needs event data *synchronously*, during render, to put a real title
 * and description into each generated page. The async `DataSource` cannot serve that:
 * during static rendering a promise never resolves, so anything gated on it
 * contributes nothing to the HTML.
 *
 * This exists so `/event/<id>` is a real page rather than one template shared by every
 * event — which is what makes a shared link unfurl with the event's own name, and what
 * makes the pages crawlable at all. That was the stated reason for choosing static web
 * rendering back in Phase 0; without this it was not actually true.
 *
 * When Supabase lands, `generateStaticParams` fetches the live event list at build time
 * and this file becomes a thin adapter over that snapshot.
 */

import { SEED_EVENTS, SEED_POSTERS } from './seed/events';
import { shortPrice } from '@/lib/geo';

export type StaticEventMeta = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

export function staticEventIds(): readonly string[] {
  return SEED_EVENTS.map((event) => event.id);
}

export function staticEventMeta(id: string | undefined): StaticEventMeta | null {
  const event = SEED_EVENTS.find((candidate) => candidate.id === id);
  if (!event) return null;

  const poster = SEED_POSTERS.find((candidate) => candidate.id === event.posterId);

  /**
   * Deliberately no date. Seed schedules are relative to the moment of the build, so a
   * baked-in "Thu, Aug 6" would be quietly wrong a week later. Everything here is
   * stable for the life of the listing.
   */
  const description = [
    event.summary,
    [event.venueName, event.town].filter(Boolean).join(', '),
    shortPrice({
      priceTier: event.priceTier,
      priceLabel: event.priceLabel,
      priceFrom: event.priceFrom,
    }),
    poster ? `Posted by ${poster.displayName}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  return { id: event.id, title: event.title, description };
}
