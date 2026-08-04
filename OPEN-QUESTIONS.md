# Open Questions

## Decided ✅

| Question | Decision |
|---|---|
| **Platform** | Mobile-first **web app**. Ships fast, no App Store review, textable link. Native later if it earns it. |
| **RSVP model** | **Going + Interested.** "Going" is the headline count; "Interested" doubles as the bookmark. No downvote. |
| **Paid events** | **Listed, with outbound links.** Price is display-only, "Get tickets" leaves the app. We never touch money — no PCI scope, no ticketing regulation. |
| **Moderation** | **First post from a new poster is human-reviewed; that poster is then trusted forever.** Spammers never reach the feed, regulars post same-day. Trust is revocable on reports. |

---

## Still open — blocking

**1. Name: "Event" or "Eventr"?**
The logo mock says EVENT. The app header mock says Eventr. The repo is `eventr`.
→ *Rec: Eventr.* "Event" is unsearchable, untrademarkable, and un-domainable. Eventr is
distinct and the mock header already uses it. **Defaulting to Eventr unless you say otherwise.**

**2. Location: GPS or type your town?**
→ *Rec: ask for GPS, fall back to a town/ZIP picker, and remember it.* No account, no
permission wall. Storing a town instead of raw coordinates is also much cleaner privacy-wise.

---

## Assumed — say the word and I'll change any of these

**3. How long after an event ends does it archive?**
→ *Assuming ~2 hours after end time,* then it drops out of the feed into Archive.

**4. Who can mark an event "full" / "filling up"?**
→ *Assuming the poster,* via their magic edit link.

**5. Ad slots now or later?**
→ *Assuming placeholder slots now* — same card shape, labeled "Sponsored," so the feed rhythm is
right and real inventory drops in later.

**6. Which categories ship first?**
→ *Assuming:* Music, Food, Sports & Rec, Running, Arts, Nightlife, Family, Market, Community,
Campus.

**7. How fast does the review queue need to be?**
→ *Assuming a few hours,* with the poster shown an honest "usually reviewed within a few hours"
message. This is the one real cost of the trusted-poster model — a new poster with a
tonight-only event waits.

---

## Later, but worth thinking about

- Which universities get campus pages first? (BU/Northeastern/UMass Boston are the density plays.)
- Do you want notifications at all in v1? (Adds consent obligations; probably skip.)
- Seeding: are you okay with me pulling real public listings from town/library/campus calendars
  to bootstrap, or do you want it 100% user-posted from day one?
- Do you want a poster-facing view — "142 people said they're going" — as a retention hook for
  organizers? I think this is quietly the strongest reason for a town rec department to keep
  posting.

---

## Round 2 — new direction (from voice notes)

**Locked in:**
- No likes, no followers, no DMs, no profiles. Post + Going/Interested + comments. That's it.
- Comments exist. Author replies get pinned to top (fixes "you never said what time").
- Guest by default. Identity tied to device. Account only needed to post.
- Anyone posts free, always. Money comes from verification (~$3/mo) and cheap event boosts.
- Prices are variable/tiered ($5 GA, $20 front row) — so price is a *range or label*, not one number.
- Native app is the real goal.
- Sort UX modeled on Facebook Marketplace.
- Purple/yellow is a preference, not a requirement.
- Hard constraint: must not read as AI-generated. No emoji. No template smell.

**Also decided:**
- **Whole town, not college-gated.** Campus feeds are a later feature. No .edu verification to build.
- **Greater Boston** for now, Wakefield/North Shore as the seed.
- **Price as a label** (`Free` / `$5+` / `Paid`), real tiers in the detail view.
- **Strict comment moderation.** Author can delete comments on their event and lock the thread.
- **Eventr** as the working name.
- **App Store eventually** → building on Expo so web ships now and iOS ships later from one codebase.

**Still open:**
- Address typed in + free geocoder, vs GPS? (Rec: town picker default, GPS optional.)
- Seeding from public town/library calendars, or 100% user-posted from day one?
- Do you want the organizer-facing "142 going" view in v1? (Rec: yes, it's the retention hook.)
