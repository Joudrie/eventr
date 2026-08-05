/**
 * Going / Interested state.
 *
 * Device-scoped and stored locally. No account, no sign-in, no profile — tapping
 * Going is the entire commitment the product asks for, and asking for anything more
 * at that moment would lose most of the taps.
 *
 * Writes are optimistic: the UI changes at `instant` and persistence follows. A
 * network or storage failure reverts the stance rather than leaving a lie on screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { RsvpKind } from '@/types/event';

const STORAGE_KEY = 'eventr.rsvps.v1';

/** eventId → stance. Absent means no stance, which is the default and not a "no". */
export type RsvpMap = Readonly<Record<string, RsvpKind>>;

type RsvpContextValue = {
  readonly rsvps: RsvpMap;
  readonly ready: boolean;
  /** Sets, switches, or clears a stance. Tapping the active one clears it. */
  setRsvp: (eventId: string, kind: RsvpKind) => void;
  stanceFor: (eventId: string) => RsvpKind | null;
};

const RsvpContext = createContext<RsvpContextValue>({
  rsvps: {},
  ready: false,
  setRsvp: () => {},
  stanceFor: () => null,
});

function parse(raw: string | null): RsvpMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, RsvpKind> = {};
    for (const [id, kind] of Object.entries(parsed as Record<string, unknown>)) {
      if (kind === 'going' || kind === 'interested') out[id] = kind;
    }
    return out;
  } catch {
    // Corrupt storage resets to empty rather than crashing on launch.
    return {};
  }
}

export function RsvpProvider({ children }: { children: ReactNode }) {
  const [rsvps, setRsvps] = useState<RsvpMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) setRsvps(parse(raw));
      })
      .catch(() => {
        if (active) setRsvps({});
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setRsvp = useCallback((eventId: string, kind: RsvpKind) => {
    setRsvps((current) => {
      const next = { ...current };
      // Tapping the stance you already hold clears it. Undo is the same gesture as
      // commit, which is what makes it discoverable without a second control.
      if (next[eventId] === kind) delete next[eventId];
      else next[eventId] = kind;

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // Losing a saved stance costs one tap to redo. Not worth interrupting over.
      });
      return next;
    });
  }, []);

  const value = useMemo<RsvpContextValue>(
    () => ({
      rsvps,
      ready,
      setRsvp,
      stanceFor: (eventId) => rsvps[eventId] ?? null,
    }),
    [rsvps, ready, setRsvp],
  );

  return <RsvpContext value={value}>{children}</RsvpContext>;
}

export function useRsvps(): RsvpContextValue {
  return use(RsvpContext);
}

/**
 * The count to display, given the server's number and this device's stance.
 *
 * The seeded counts do not include you, so a stance adds one. Without this the
 * number would sit still while the button flipped, which reads as a broken button.
 */
export function displayCount(base: number, active: boolean): number {
  return active ? base + 1 : base;
}
