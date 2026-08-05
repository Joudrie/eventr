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
    endOfList: "That's everything nearby.",
  },

  filters: {
    radius: (miles: number) => `Within ${miles} mi`,
    radiusSlider: 'Search radius',
    radiusExact: (miles: number) => (miles === 1 ? 'Within 1 mile' : `Within ${miles} miles`),
    anyPrice: 'Any price',
    freeOnly: 'Free only',
    allCategories: 'All categories',
    verifiedOnly: 'Verified only',
    clear: 'Clear',
    apply: 'Apply',
    // The live match count in the radius sheet — the number is the whole point of the
    // control, so it is shown before you commit rather than after.
    matchCount: (count: number, miles: number) =>
      `${count} ${count === 1 ? 'event' : 'events'} within ${miles} ${miles === 1 ? 'mile' : 'miles'}`,
  },

  rsvp: {
    going: 'Going',
    goingActive: "You're going",
    interested: 'Interested',
    interestedActive: 'Saved',
    goingCount: (count: number) => `${count} going`,
    interestedCount: (count: number) => `${count} interested`,
  },

  verified: {
    label: (organizer: string) => `${organizer}, verified organiser`,
    hint: 'Explains what verified means here',
    /**
     * Says what was actually checked, not just that something was. A mark whose meaning
     * nobody can find out is decoration — it certifies nothing because no one knows what
     * it certifies.
     */
    explainer: (organizer: string) =>
      `${organizer} is a verified organiser. A person confirmed they run this venue or group before this went out.`,
  },

  ads: {
    // "Ad", not "Sponsored content" or "Partner" — the shortest true word, because the
    // point of a disclosure is that nobody has to work out what it means.
    label: 'Ad',
    house: 'From the makers of Eventr',
  },

  moderate: {
    eyebrow: 'Review queue',
    title: 'Waiting on you',
    waiting: (n: number) =>
      n === 0 ? 'Nothing waiting' : n === 1 ? '1 post to read' : `${n} posts to read`,
    /**
     * Stated up front rather than left for the next person to discover. An unlisted
     * route is not access control, and pretending otherwise is how a review queue ends
     * up editable by anyone who guesses a URL.
     */
    localOnly:
      'This reads posts saved on this device. There is no server yet, so it cannot show anyone else\u2019s, and the unlisted address is not a login. Both change when the backend lands.',
    approve: 'Approve',
    reject: 'Reject',
    reopen: 'Put back in the queue',
    boostRequested: 'Boost requested',
    defaultReason: "Didn't pass review.",
    loading: 'Reading what you have saved.',
    empty: {
      pending: 'Nothing waiting. Everything posted here has been decided.',
      approved: 'Nothing approved yet.',
      rejected: 'Nothing rejected. Good.',
    },
  },

  location: {
    eventCount: (n: number) =>
      n === 0 ? 'Nothing on right now' : n === 1 ? '1 event' : `${n} events`,
  },

  boost: {
    title: 'Boost this event',
    action: 'Boost',
    intro: 'Move it to the top of the feed for people nearby. It stays labelled as boosted.',
    confirm: 'Boost it',
    update: 'Change reach',
    cancel: "Don't boost",
    /**
     * The whole point of this screen is that it does not lie about what just happened.
     * Miming a checkout and quietly doing nothing would be worse than having no flow.
     */
    noBilling:
      "Payments aren't set up yet, so nothing is charged and no card is asked for. This records what you want boosted, and it still has to pass review like any other event.",
    requested: (reach: string) => `Boost requested · ${reach}`,
    reachTown: 'this town',
    reachRegion: 'within 50 miles',
  },

  promoted: {
    /**
     * "Boosted", not "Hyped" or "Featured". Paid placement has to be unmistakable: the
     * FTC treats a label a reader could take as organic popularity as no label at all,
     * and "hyped" describes enthusiasm rather than payment. "Boosted" is the plainest
     * word for someone put money behind this, and reads community rather than corporate.
     */
    label: 'Boosted',
    why: 'Someone paid to move this up. It still had to pass review like everything else.',
  },

  event: {
    getTickets: 'Get tickets',
    directions: 'Directions',
    addToCalendar: 'Add to calendar',
    share: 'Share',
    report: 'Report',
    full: 'Nearly full',
    filling: 'Filling up',
    // A going count is a show of hands, not a ticket sale. Saying "sold out" here would
    // be a claim the data cannot support, and would turn people away from an event they
    // could have walked into.
    over: 'More going than spots',
    spotsLeft: (n: number) => (n === 1 ? '1 spot left' : `${n} spots left`),
    capacityOf: (capacity: number) => `Room for ${capacity}`,
    cancelled: 'Cancelled',
    justPosted: 'Just posted',
    pending: 'Pending review',
    // Says what is actually true: it exists, it is yours, nobody else can see it yet.
    pendingNotice:
      'Only you can see this. A person reviews first posts before they go out to the town.',
    tags: 'Tags',
    organizer: 'Organizer',
    commentsLocked: 'The organizer turned off comments.',
  },

  empty: {
    // Names the constraint that produced the empty result, and offers the fix. The
    // wording follows the tab you are on: "nothing today" is wrong and slightly
    // confusing when you are looking at the Now tab.
    noneNow: (town: string) => `Nothing happening in ${town} right now.`,
    noneToday: (town: string) => `Nothing left in ${town} today.`,
    noneWeekend: (town: string) => `Nothing in ${town} this weekend.`,
    noneNearby: (miles: number) => `Nothing within ${miles} ${miles === 1 ? 'mile' : 'miles'}.`,
    searchedWithin: (miles: number, town: string) =>
      `Searched ${miles} ${miles === 1 ? 'mile' : 'miles'} around ${town}.`,
    widen: (miles: number) => `Widen to ${miles} ${miles === 1 ? 'mile' : 'miles'}`,
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
