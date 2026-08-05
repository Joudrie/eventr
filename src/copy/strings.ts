/**
 * Every user-facing string in the app.
 *
 * One file, so the DESIGN.md voice audit is a single review rather than a codebase
 * grep. The rules, from tell #5:
 *
 *   - No exclamation points.
 *   - No adjectives about ourselves. Nothing is "seamless" or "amazing".
 *   - Name the place and the number. "Nothing within 5 miles today", not "No events found".
 *   - Say what happened, then what to do about it.
 *   - No emoji. Ever.
 */

export const strings = {
  app: {
    name: 'Eventr',
  },

  feed: {
    heading: "What's happening",
    tabs: {
      now: 'Now',
      today: 'Today',
      weekend: 'This Weekend',
      all: 'All',
    },
    live: 'Happening now',
    sponsored: 'Sponsored',
    endOfList: "That's everything nearby.",
  },

  filters: {
    radius: (miles: number) => `Within ${miles} mi`,
    anyPrice: 'Any price',
    freeOnly: 'Free only',
    allCategories: 'All categories',
    verifiedOnly: 'Verified only',
    clear: 'Clear',
    apply: 'Apply',
    // The live count while dragging the radius slider — the number is the whole point.
    matchCount: (count: number, miles: number) =>
      `${count} ${count === 1 ? 'event' : 'events'} within ${miles} miles`,
  },

  rsvp: {
    going: 'Going',
    goingActive: "You're going",
    interested: 'Interested',
    interestedActive: 'Saved',
    goingCount: (count: number) => `${count} going`,
    interestedCount: (count: number) => `${count} interested`,
  },

  event: {
    getTickets: 'Get tickets',
    directions: 'Directions',
    addToCalendar: 'Add to calendar',
    share: 'Share',
    report: 'Report',
    full: 'Full',
    filling: 'Filling up',
    cancelled: 'Cancelled',
    justPosted: 'Just posted',
    organizer: 'Organizer',
    commentsLocked: 'The organizer turned off comments.',
  },

  empty: {
    // Names the constraint that produced the empty result, and offers the fix.
    noneNearby: (miles: number) => `Nothing within ${miles} miles right now.`,
    noneToday: (town: string) => `Nothing in ${town} today.`,
    widen: (miles: number) => `Widen to ${miles} miles`,
    seeWeekend: 'See this weekend',
    clearFilters: 'Clear filters',
    noneSaved: 'Nothing saved yet.',
  },

  error: {
    loadFailed: "Couldn't load events.",
    retry: 'Retry',
    saveFailed: "Couldn't save that.",
    offline: (time: string) => `Offline — showing events from ${time}.`,
  },

  post: {
    // Honest about the wait rather than silent about it.
    firstPostNotice:
      'First posts are reviewed by a person, usually within a few hours. After that, your events go up instantly.',
    submitted: 'Submitted.',
    live: "Posted. It's live.",
  },
} as const;
