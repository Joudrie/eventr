# Open Questions

Things I need decided (or at least leaned on) before building. Each has my recommendation so
"sounds good" is a valid answer.

## Blocking — affects what gets built

**1. Name: "Event" or "Eventr"?**
The logo mock says EVENT. The app header mock says Eventr. The repo is `eventr`.
→ *Rec: Eventr.* "Event" is unsearchable, untrademarkable, and un-domainable. Eventr is
distinct and the mock header already uses it.

**2. Web app or native iOS first?**
→ *Rec: mobile-first web app.* Ships in days not months, no App Store review, anyone in Boston
can open a link. If it takes off, wrap it or go native later. Native first means weeks of
plumbing before a single Wakefield resident sees it.

**3. "Likes" or "I'm going"?**
The mock shows "55 Likes." Your description says yes-I'm-going / no-I'm-not.
→ *Rec: "Going."* It's the number that actually helps someone decide, it's the number a poster
wants to see, and it's the data worth aggregating. "Not going" I'd cut entirely — it adds no
signal and invites pile-ons. Keep a separate save/bookmark for "interested, not committed."

**4. Location: GPS or type your town?**
→ *Rec: ask for GPS, fall back to a town/ZIP picker, and remember it.* No account, no
permission wall. Storing a town instead of coordinates is also much cleaner privacy-wise.

**5. Paid events — in or out?**
You said "we're not selling tickets," but the mock has a $5 museum night and a $35 Theo Von show.
→ *Rec: list them, link out, never process money.* Price is display-only; "Get tickets" opens the
organizer's own link. Keeps PCI and ticketing regulation entirely off the table.

## Non-blocking — I'll assume the recommendation unless you say otherwise

**6. Do unverified posts go live instantly?**
→ *Assuming yes,* with a report button and a "verified only" filter toggle. Gating kills
same-day posts, which are the best posts.

**7. How long after an event ends does it archive?**
→ *Assuming ~2 hours after end time,* then it drops out of the feed into Archive.

**8. Who can mark an event "full" / "filling up"?**
→ *Assuming the poster,* via their magic edit link.

**9. Ad slots now or later?**
→ *Assuming placeholder slots now* — same card shape, labeled "Sponsored," so the feed rhythm is
right and real inventory drops in later.

**10. Which categories ship first?**
→ *Assuming:* Music, Food, Sports & Rec, Running, Arts, Nightlife, Family, Market, Community,
Campus. Easy to change.

## Later, but worth thinking about

- Which universities get campus pages first? (BU/Northeastern/UMass Boston are the density plays.)
- Do you want notifications at all in v1? (Adds consent obligations; probably skip.)
- Seeding: are you okay with me pulling real public listings from town/library/campus calendars
  to bootstrap, or do you want it 100% user-posted from day one?
- Do you want a poster-facing view — "142 people said they're going" — as a retention hook for
  organizers? I think this is quietly the strongest reason for a town rec department to keep
  posting.
