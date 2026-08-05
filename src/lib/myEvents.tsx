/**
 * Events posted from this device.
 *
 * There is no backend yet, so a posted event lives locally. That is not a shortcut
 * around the moderation model — it *matches* it. `BUILD-PLAN.md` §1 says a new
 * poster's first event goes to a human review queue before anyone else sees it, so an
 * event you just posted being visible only to you is the correct end state, not a
 * placeholder for one. The card and detail view both say so plainly rather than
 * implying it is live to the town.
 *
 * The data shape and the module-level mirror live in `myEventsStore.ts`; this file is
 * only the React surface over them.
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

import {
  MY_EVENTS_STORAGE_KEY,
  parseMyEvents,
  writeMyEventsMirror,
  type BoostReach,
  type DraftEvent,
} from './myEventsStore';

export type { BoostReach, BoostRequest, DraftEvent } from './myEventsStore';

type MyEventsContextValue = {
  readonly myEvents: readonly DraftEvent[];
  readonly ready: boolean;
  addEvent: (event: DraftEvent) => void;
  removeEvent: (id: string) => void;
  /** Records that the poster wants this boosted. Charges nothing, because it cannot. */
  requestBoost: (id: string, reach: BoostReach) => void;
  cancelBoost: (id: string) => void;
};

const MyEventsContext = createContext<MyEventsContextValue>({
  myEvents: [],
  ready: false,
  addEvent: () => {},
  removeEvent: () => {},
  requestBoost: () => {},
  cancelBoost: () => {},
});

export function MyEventsProvider({ children }: { children: ReactNode }) {
  const [myEvents, setMyEvents] = useState<readonly DraftEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(MY_EVENTS_STORAGE_KEY)
      .then((raw) => {
        const loaded = parseMyEvents(raw);
        writeMyEventsMirror(loaded);
        if (active) setMyEvents(loaded);
      })
      .catch(() => {
        writeMyEventsMirror([]);
        if (active) setMyEvents([]);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: readonly DraftEvent[]) => {
    writeMyEventsMirror(next);
    setMyEvents(next);
    AsyncStorage.setItem(MY_EVENTS_STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // A failed write loses the post on next launch. Worth not crashing over.
    });
  }, []);

  const value = useMemo<MyEventsContextValue>(
    () => ({
      myEvents,
      ready,
      addEvent: (event) => persist([event, ...myEvents]),
      removeEvent: (id) => persist(myEvents.filter((event) => event.id !== id)),
      requestBoost: (id, reach) =>
        persist(
          myEvents.map((event) =>
            event.id === id
              ? { ...event, boost: { reach, requestedAt: new Date().toISOString(), paidAt: null } }
              : event,
          ),
        ),
      cancelBoost: (id) =>
        persist(myEvents.map((event) => (event.id === id ? { ...event, boost: null } : event))),
    }),
    [myEvents, ready, persist],
  );

  return <MyEventsContext value={value}>{children}</MyEventsContext>;
}

export function useMyEvents(): MyEventsContextValue {
  return use(MyEventsContext);
}
