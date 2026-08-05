# Eventr — Design System & Anti-Tells

The hard requirement: **this must not read as generated.** That's not a vibe, it's a checklist.
Below is what actually gives an AI-built app away, and what we do instead.

---

## Part 1 — The tells

People can't always name why an app looks generated, but they clock it in about two seconds.
It's almost always these, in roughly this order of guilt:

### 1. Emoji as interface
🎉 in the empty state, 📍 next to the address, 🔥 on the trending tab. Nothing screams *nobody
designed this* louder. **Rule: zero emoji in the product.** Ever. Icons are a real drawn set,
used sparingly, at consistent stroke weight.

### 2. The purple gradient
`linear-gradient(135deg, #667eea, #764ba2)` is the single most recognizable AI-app fingerprint on
earth. We have a purple brand, which makes this a live hazard.
**Rule: no gradients on backgrounds, buttons, or cards.** Flat color only. Purple appears as
solid blocks and solid type, never as a fade.

### 3. Everything is a soft-shadowed rounded rectangle
Same 12px radius, same `0 4px 6px rgba(0,0,0,0.1)`, same white card on grey, endlessly.
**Rule: flat, hard-edged, bordered.** Our reference mock is bold and chunky — heavy black type,
solid color blocks, real edges. Lean all the way into that. Shadows only where something
genuinely floats above the page (sheets, the post button). Radius is 4px, not 16px.

### 4. Airiness
Generated apps pad everything to 24px and center it. Real apps used by real people are **dense** —
a feed should show 3+ events per screen, not 1.5. Density signals that someone thought about the
user's actual task.

### 5. Marketing voice
"Discover amazing events happening near you!" — exclamation points, "seamless," "effortless,"
"your journey starts here." **Rule: no exclamation points. No adjectives about ourselves.**
Empty state is *"Nothing in Wakefield today. Try widening to 25 miles."* not *"No events yet — but
exciting things are coming!"*

### 6. Fake data that reads fake
"Community Event," "John Doe," "Sample Venue," prices of exactly $10.00, everything starting at
2:00 PM. **Rule: seed data is specifically, boringly real** — *Wakefield Farmers Market, Hall Park,
Sat 9:00–1:00, Free* · *Open Mic at Deep Cuts, Medford, Thu 8pm, $5* · times like 7:30 and 6:45,
prices like $5 and "Free, donations welcome."

### 7. No states
The tell of a demo: it only works when data exists. **Rule: no screen is done without an empty
state, a loading state, an error state, and a too-long-content state.** Loading is a skeleton that
matches the real layout, not a spinner in the middle of a blank page.

### 8. Perfect symmetry
Three cards in a row, equal widths, centered hero, everything balanced. Real editorial layouts
have a dominant element and a hierarchy. Our cards should have a clear focal point — the title —
not four elements of equal visual weight.

### 9. Default type
System font at 16px/1.5 everywhere, or Inter for absolutely everything. **Rule: a real type pairing
with real hierarchy** — a heavy condensed display face for titles and prices, one workhorse for
body. Sizes jump decisively (32 / 20 / 15 / 13), not by 2px increments.

### 10. Icon soup
An icon next to every single label. **Rule: icons only where they replace a word, never where they
decorate one.**

---

## Part 2 — What we build instead

### Color

Purple and yellow stay, but disciplined — they're a **brand**, not a paint bucket.

```
ink        #14121A   near-black. body text, borders, most type.
paper      #FFFFFF   card and sheet backgrounds
bone       #F4F2ED   page background. warm, not blue-grey.
grape      #6B2FD6   brand purple. headers, active states, the wordmark.
grape-deep #3E1A80   pressed states, dark surfaces
sun        #FFC72C   accent only. prices, verified state, the post button.
slate      #5F5B6B   secondary text. the only grey.
flag       #C4342B   destructive, cancelled, report
```

Rules:
- Purple is chrome (header, active chips, wordmark). It is **not** the page background — a wall of
  saturated purple behind scrolling content is both a tell and an accessibility problem.
- Yellow is accent only. Never a large fill. Never a text color on white (fails contrast).
- Everything ships checked at **WCAG AA**. `sun` on `ink` passes; `sun` on `paper` does not.

### Type

Display: a heavy grotesque or condensed sans — titles, prices, section heads. Tight tracking.
Body: a clean workhorse — descriptions, metadata.

```
display-xl  32/34  heavy    price on detail
display-l   24/26  heavy    event title, detail
title       18/22  bold     event title, card
body        15/21  regular  descriptions
meta        13/16  medium   distance, time, counts
label       11/12  bold     ALL CAPS, tracked +0.08em — category chips, SPONSORED
```

### Space & shape

4px base grid. Card padding 12–16, not 24. Radius **4px** on everything except the post button
(pill) and photos (4px). Borders `1px solid ink @ 12%` instead of shadows.

### The card

Structured, not centered. Photo left at a fixed 88px square. Title dominant. Price right-aligned
in display weight — the mock's big loud price is the best idea in it, keep it. Meta row along the
bottom: distance · start time · going count. Verified check inline after the title at text size,
not a floating badge sticker.

### Motion

Fast, few, and always functional — motion is feedback, never decoration. No staggered list
fade-ins, no bounce, no confetti; animated *entrances* are a tell, animated *responses* are what
cheap apps skip. Full spec in **`INTERACTIONS.md`**.

### Copy

Short. Specific. Lowercase where natural. Names the place and the number.

| Instead of | Write |
|---|---|
| "No events found!" | "Nothing within 5 miles today." |
| "Discover events near you" | "What's happening" |
| "Successfully posted! 🎉" | "Posted. It's live." |
| "Oops! Something went wrong" | "Couldn't load. Tap to retry." |
| "Join the community today!" | *(delete it)* |

---

## Part 3 — Pre-ship audit

No phase is complete until every line passes:

- [ ] Zero emoji in any UI string
- [ ] Zero CSS/style gradients
- [ ] No component library defaults visible anywhere
- [ ] Every list: empty, loading (skeleton), error, and end-of-list states exist
- [ ] Feed shows 3+ events on a 375×667 screen
- [ ] All text passes WCAG AA against its actual background
- [ ] No exclamation points in product copy
- [ ] Seed data names real places, real times, realistic prices
- [ ] Long titles, missing photos, and 2000-char descriptions all render correctly
- [ ] Every tap target ≥ 44×44
- [ ] Works at 375px wide and at 200% text size
- [ ] Nothing animates on mount without a user action
- [ ] `INTERACTIONS.md` §9 motion anti-tells: none present
- [ ] `prefers-reduced-motion` honored
