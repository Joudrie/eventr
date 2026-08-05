# Competitive Landscape

The useful question isn't "who else does events." It's **where does someone in Wakefield actually
look today, and why does it fail them.** Answer: they check four Facebook groups, the town website,
and a flyer at the coffee shop. That's the real competitor — the scavenger hunt.

---

## The transaction platforms

**Ticketmaster** — arena-scale, fee-driven, hostile. Not a competitor for a free town day; a
competitor for *attention* and for the word "events." Their weakness is that nothing small,
free, or local exists in their world at all.

**Eventbrite** — the closest thing to a real overlap. Organizer-first: built for someone who
already knows what they're hosting and wants a registration page. Discovery is an afterthought
bolted onto a ticketing product, and the free stuff gets buried under paid promotion. To list an
event you effectively set up an organizer account and a ticket type — friction that a high school
senior class posting a Chipotle night will never get through.

**Fever / TickPick** — curated experiences and resale. Both are inventory businesses. Neither is
where the run club posts.

> **Our wedge against all three:** they monetize the transaction, so they rank by revenue. We
> monetize attention, so we can rank by proximity and imminence. A free event is a first-class
> citizen here and structurally can't be one there.

## The community platforms

**Facebook Events / town groups** — the actual incumbent, and it's genuinely useful. But it's
fragmented across a dozen private groups, requires a Facebook account, buries events in a
feed optimized for arguments, and half the town has left the platform. Discovery is by
membership, not by geography.

**Nextdoor** — hyperlocal and geographic, which is the right instinct, but it's a neighborhood
forum where events compete with lost cats and package theft. No time-based structure, no radius
control, no "what's happening in the next two hours."

**Meetup** — recurring-group-centric. Great for a book club that meets monthly, wrong for a
one-off Saturday market. Requires an account, and the group is the unit, not the event.

**Local editorial calendars** (city guides, alt-weeklies, library/town rec calendars) — curated,
good quality, but editorially gatekept, usually just a wall of text, and never geo-aware. Worth
studying for Boston seeding: these are public and would bootstrap real listings before user one.

## The structural inspiration

**Yik Yak** — not an events product at all, but the right *shape*: radius-scoped, no accounts, no
followers, no profiles, post and it's just there. It proved that removing the social graph makes
people post more, not less, because there's no audience to perform for. We're taking the mechanic
and pointing it at something durable instead of gossip. The lesson from its failure is equally
important: with no identity and no moderation, an anonymous local feed rots fast — which is why
strict moderation is a launch feature here, not a v3 feature.

---

## Where Eventr sits

Nobody occupies the intersection of:

| | Free-first | Geo-radius | No account to browse | Zero-friction posting | One-off events |
|---|---|---|---|---|---|
| Eventbrite | ✗ | partial | ✓ | ✗ | ✓ |
| Facebook Events | ✓ | ✗ | ✗ | partial | ✓ |
| Nextdoor | ✓ | ✓ | ✗ | ✓ | ✗ |
| Meetup | ✗ | partial | ✓ | ✗ | ✗ |
| Ticketmaster | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Eventr** | ✓ | ✓ | ✓ | ✓ | ✓ |

## Honest read on defensibility

There's no technical moat here — the app is a feed with a radius query. The moat is **local
supply density**. Once every town rec department, run club, and student org in the North Shore
posts to Eventr by habit, that's very hard to dislodge, and it's worth almost nothing anywhere
else. Which is the argument for going deep on Boston before going anywhere near a second metro.

The second asset is **posture**. "We never sell tickets and posting is always free" is a promise
the incumbents structurally cannot make. Say it constantly. Never break it — the moment there's a
checkout in this app, the whole differentiator evaporates.
