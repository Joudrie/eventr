# Phase 0 — Rails · Gate Report

Per `BUILD-PLAN.md` §4. **Status: complete, with one item deferred to hardware I don't have.**

## Delivered

| Item | Result |
|---|---|
| Expo + TypeScript strict + Expo Router | SDK 57, React 19.2, RN 0.86, TS 6.0 |
| Runs on web | Static export builds; renders with zero console errors |
| Runs on iOS | Hermes bytecode bundle exports clean — **simulator run deferred, see below** |
| ESLint + Prettier + typecheck | `npm run verify`, wired to a pre-commit hook |
| `design/tokens.ts` | Full palette, semantic light + dark themes, type scale, space, radius, elevation |
| `design/motion.ts` | Duration ladder, easings, spring, haptic map, reduced-motion resolution |
| Reanimated 3 + gesture-handler | Installed, running on the UI thread |
| Env/secrets handling | `EXPO_PUBLIC_` only, `.env.example` committed, no secrets in git |

Extra, not in the original scope but earned during the phase:

- **`scripts/contrast-audit.mts`** — computes every text/surface pairing in both themes against
  WCAG AA and fails the build below threshold. Runs inside `npm run verify`.
- **Two lint rules enforcing the token discipline** — hardcoded hex literals are an error outside
  `src/design/`, and importing the raw `palette` instead of `useTheme()` is an error.

## Gate criteria

> *Blank app builds on both targets, lints clean, and a throwaway box animates at 60fps using only
> imported tokens. Zero magic numbers.*

- **Builds on both targets** — web static export and iOS Hermes bundle both succeed.
- **Lints clean** — typecheck, ESLint (`--max-warnings 0`), Prettier, and the contrast audit all pass.
- **Token-driven animation** — `app/index.tsx` presses at `DURATION.tap` in / `DURATION.snap` out
  with `EASING`, `PRESS_SCALE`, and `haptics.commit()`, all imported. Reanimated runs the transform
  on the UI thread.
- **Zero magic numbers** — enforced by lint, not by discipline.

## What the contrast audit caught

Running it immediately found five failures, one of which was a real bug rather than a rounding issue:

1. **`textOnBrand` on dark-scheme `brand` measured 2.98:1.** The dark brand is a *light* purple, so
   inheriting white text from the light theme was genuinely illegible. Dark now uses `ink` on brand.
2. **Dark `brandPressed` inverted lightness** — it was the dark purple, so no single `textOnBrand`
   could serve both states. Pressed is now `grapeMid`, deeper but still light.
3. **`borderStrong` was too faint to delineate a control** (1.88:1 light / 2.55:1 dark). Raised to
   0.50 / 0.38 alpha; now 3.50:1 and 3.32:1.
4. **`slate` measured 4.52:1 on `bone`** — technically passing, but by 0.02, so any future tweak
   would break it. Darkened to `#5F5B6B`, now 5.87:1. `DESIGN.md` updated to match.
5. **`border` reclassified as decorative** and exempted, with the reasoning recorded in the script:
   WCAG 1.4.11 covers only what's *required* to identify a component, and our hairline always pairs
   with a surface-color change. Forcing it to 3:1 would produce the heavy outline that reads as
   unstyled.

## Other real issues fixed

- **React #418 hydration mismatch in dark mode.** Static web rendering emits light server-side, then
  the client hydrates dark. Resolved with `useSyncExternalStore` and a light `getServerSnapshot` —
  the sanctioned React primitive for server/client divergence. Static rendering was kept rather than
  dropped to SPA because crawlable event pages are a real growth channel.
- **`process.env[name]` dynamic access in `env.ts`.** Expo inlines `EXPO_PUBLIC_*` by scanning for
  literal member access, so this would have compiled to `undefined` in a production bundle while
  working fine in dev. Caught by `expo/no-dynamic-env-var`.
- **Reanimated 4 spring API change** — `restDisplacementThreshold`/`restSpeedThreshold` are replaced
  by `energyThreshold`.
- **No `babel.config.js`** — SDK 57 auto-configures Babel, and `babel-preset-expo` is not a
  top-level dependency, so a hand-written config breaks the bundler.

## Deferred

**iOS simulator run.** This container is Linux; there is no iOS simulator and no Xcode. The iOS
JS bundle exports cleanly, which proves no web-only API leaked into shared code, but the
"runs in iOS simulator" half of the gate needs a Mac. Run `npm run ios` when you're on one.

## Screenshots

`docs/screenshots/rails-light.png` · `docs/screenshots/rails-dark.png` — 375×667, both schemes.

## Definition of done (`BUILD-PLAN.md` §5)

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web and iOS simulator | web pass · iOS bundle pass, simulator deferred |
| Empty/loading/error/offline states | n/a — nothing fetches yet |
| Light and dark verified | pass, screenshotted |
| WCAG AA verified with a tool | pass — `npm run audit:contrast` |
| VoiceOver labels on interactive elements | pass — the one control is labeled |
| 375px width and 200% text | pass at 375px; 200% has no fixed-height text containers to break |
| `DESIGN.md` Part 3 audit | pass — no emoji, no gradients, no component library, flat/bordered |
| `INTERACTIONS.md` §9 audit | pass — nothing animates on mount, no bounce, no spinner |
| No hardcoded values outside `design/` | pass, lint-enforced |
| Reduced-motion path verified | pass — `ReduceMotion.System` in every timing config, surfaced on screen |
| Screenshots attached | pass |

## Next

Phase 1 — Data. Supabase schema, RLS, PostGIS radius RPC, ranking function, and ~40 seeded
Greater Boston events. **Needs a Supabase project and its URL + anon key in `.env.local`.**
