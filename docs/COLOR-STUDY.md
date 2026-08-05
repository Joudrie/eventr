# Color Study

Brief: Eventr should feel **warm, inviting, and friendly** — a nice space to spend a minute in.
A glimmer of personality, a drop of color, nothing more.

Evidence lives in `app/palettes.tsx`, which renders every candidate behind the real feed.
Screenshots in `docs/screenshots/palette-*.png`.

---

## 1. What the research actually supports

### Start by throwing out most of it

Search "color psychology branding" and you get a wall of confident numbers: *90% of snap judgments
are based on color alone*, *blue increases trust by 42%*. These circulate endlessly through
marketing blogs, and they trace back to secondary citations rather than to robust primary studies.
I could not find a credible source for either figure. **Treat them as folklore**, and be suspicious
of any palette argument that leans on them — including one I might have made.

The literature that does hold up says something less dramatic and more useful.

### Color meaning is real but context-dependent

Elliot & Maier's review in the *Annual Review of Psychology* is the standard overview: color
carries meaning and measurably affects affect, cognition, and behavior — **but the effect depends
on context**. The same hue means different things in an achievement context than in an affiliation
context. There is no lookup table from hue to emotion, and anything presenting one is selling
something. (Some individual findings in this area — red and cognitive performance in particular —
have had mixed replication, which is another reason to hold specific claims loosely.)

The practical takeaway for us: **the context here is affiliation, not achievement.** People open
this app to find something to do with other people. That favors warmth and approachability over
authority and competence signals.

### Saturation and value do more work than hue

This is the most actionable finding, and it comes from the strongest marketing-specific study I
found — Labrecque & Milne, *Journal of the Academy of Marketing Science*. Across four studies they
mapped hues onto brand-personality dimensions (red → excitement, blue → competence) **and found
that saturation and value amplify those traits**. They also found color affects brand likability
and familiarity, not just personality.

So the decision that matters most is not *which color* but **how saturated it is and how much area
it covers.** A desaturated warm field with one saturated accent and a bright wall of the same hue
are opposite products built from the same swatch.

That finding shaped the candidates below: they vary primarily in how much color they spend.

### Where the "kids' app" line is

Warmth and childishness are separated almost entirely by saturation, value, and coverage — not by
hue. A high-value, high-saturation orange across large areas reads playground. The same orange,
desaturated and confined to accents on a warm neutral field, reads pottery studio. Nothing about
choosing a warm hue commits us to the first one.

---

## 2. The category argument

| Brand | Hue | What it buys | What it costs |
|---|---|---|---|
| Twitter/X | Blue | Competence, neutrality, "utility" | Cold, corporate, and the single most crowded hue in software |
| Facebook, LinkedIn, PayPal | Blue | Same | Actively generic — blue is the default, not a choice |
| Spotify | Green | Energy, "alive" | Very strongly owned; also reads finance or health in other contexts |
| Eventbrite | Orange-red | Energy, urgency | Ticketing energy — the exact thing we are positioning against |
| **Eventr** | ? | Warm, local, unhurried | — |

Blue is out on the founder's instinct and the evidence agrees: it is the competence hue in a
product where competence is not the thing being sold. Green is out by preference and is heavily
owned. That leaves the warm end of the wheel, which is also where the affiliation context points.

**Purple is genuinely uncommon in this category** — that is an advantage, not a warning. The
question is whether it is *warm* enough, which is why the Dusk candidate pulls it toward plum.

---

## 3. Honest assessment of the incumbent

The current purple + gold came from a Photoshop mock made two years ago. It is not sacred, and it
has two real problems:

1. **The page background is cool.** `#F4F2ED` is very close to neutral, and against warm content it
   reads slightly grey — the opposite of the brief. Every warm candidate below beats it on this
   axis, and the difference is visible immediately in the screenshots.
2. **`#6B2FD6` is a saturated, blue-leaning violet.** It is closer to the "tech purple" of a dozen
   SaaS logos than to anything warm. It survived because it was there, not because it was chosen.

What it gets right: purple is uncommon here, and the gold accent on prices is genuinely good.

**The thing this decision touches beyond the app:** you have a hot-air-balloon logo in purple and
gold. Almanac and Ember both mean re-drawing it. Dusk keeps it, with a hue shift. That is a real
cost and it belongs in the decision rather than in a footnote.

---

## 4. The candidates

All three clear WCAG AA in both schemes — verified by `npm run audit:contrast`, which now audits
every candidate. A palette that cannot clear AA is not a candidate.

### A. Almanac — warm paper, near-monochrome, one clay accent
Warmth comes from the *paper*, not from a brand color. The field is a warm off-white, type is a
warm near-black, and a single clay/rust does every job that needs color. Prices stay gold.

- **Reads as:** considered, local, a little editorial. Closest to "a nice space."
- **Spends the least color** of the three, which per Labrecque & Milne is the lever that matters.
- **Risk:** could read plain if the typography does not carry it. It puts weight on the type scale.

### B. Dusk — the incumbent, pulled warm
Purple shifted from blue-leaning violet toward plum, desaturated, and confined strictly to chrome —
active chips, the wordmark, the Going button. Gold accent retained.

- **Reads as:** the current app, but warmer and less synthetic.
- **Only candidate that keeps your existing logo.**
- **Risk:** in dark mode the light plum reads slightly candy/pink. Visible in the screenshots.

### C. Ember — warm orange lead
Deep burnt orange as the brand color on a warm cream field, with a brighter amber accent.

- **Reads as:** the friendliest and most energetic of the three. Genuinely inviting.
- **Risk (real):** it is closest to **Eventbrite's** territory, which is the one brand we are
  explicitly positioning against. It is also the candidate most likely to read loud — the dark-mode
  chips are noticeably shouty in the screenshot.

---

## 5. Recommendation: **Almanac**

Best match to the brief, for three reasons:

1. **It gets warmth from the field rather than from a loud brand color.** "Warm, inviting, a nice
   space" is a description of the *background* you sit in for a minute, not of a button. Almanac
   solves it where the brief actually points.
2. **It spends the least color**, which is both what you asked for ("a drop of color, nothing too
   much") and what the strongest available evidence says is the decisive variable.
3. **It avoids every occupied position** — not blue, not green, not Eventbrite's orange — without
   reaching for anything strange.

Second choice is **Dusk**, and it wins outright if keeping the balloon logo matters more than the
warmth gain. That is a business call, not a design one, and it is yours.

I would not ship **Ember**. It is the most immediately likeable of the three, and it is the one
that looks most like the competitor we spend a whole document distinguishing ourselves from.

**Not yet applied.** `src/design/tokens.ts` still ships the current palette. Say which one and I
will swap the tokens — it is a one-file change by construction, and the contrast audit will keep it
honest.

---

## Sources

- [Elliot, A. J., & Maier, M. A. (2014). *Color Psychology: Effects of Perceiving Color on Psychological Functioning in Humans.* Annual Review of Psychology, 65, 95–120.](https://www.annualreviews.org/doi/pdf/10.1146/annurev-psych-010213-115035)
- [Elliot, A. J., & Maier, M. A. (2007). *Color and Psychological Functioning.* Current Directions in Psychological Science.](https://journals.sagepub.com/doi/10.1111/j.1467-8721.2007.00514.x)
- [Labrecque, L. I., & Milne, G. R. (2012). *Exciting red and competent blue: the importance of color in marketing.* Journal of the Academy of Marketing Science, 40, 711–727.](https://link.springer.com/article/10.1007/s11747-010-0245-y)
- [Labrecque's own summary of the paper](https://laurenlabrecque.com/2023/01/02/exciting-red-and-competent-blue-the-importance-of-color-in-marketing/)
