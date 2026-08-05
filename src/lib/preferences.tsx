/**
 * Persisted preferences: where you are and how far you're willing to go.
 *
 * Stored locally, never sent anywhere. We keep a town name and its center rather than
 * a GPS trace — it is all the feed needs, and it means there is no location history
 * here to leak, subpoena, or be asked to sell.
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

import { DEFAULT_TOWN, type Town } from './towns';
import { EVENT_CATEGORIES, METERS_PER_MILE, type EventCategory } from '@/types/event';

const STORAGE_KEY = 'eventr.preferences.v1';

export type Preferences = {
  readonly town: Town;
  readonly radiusM: number;
  /** False until the user has actually chosen, so we know to show the location gate. */
  readonly chosen: boolean;
  /**
   * Price and category live here rather than in screen state so they survive a
   * relaunch — and, more visibly, so changing your town does not silently wipe them.
   * The time tab deliberately does not persist: reopening the app tomorrow on "Now"
   * from yesterday would be wrong.
   */
  readonly freeOnly: boolean;
  readonly maxPrice: number | null;
  readonly categories: readonly EventCategory[] | null;
};

const DEFAULT_PREFERENCES: Preferences = {
  town: DEFAULT_TOWN,
  radiusM: 10 * METERS_PER_MILE,
  chosen: false,
  freeOnly: false,
  maxPrice: null,
  categories: null,
};

type PreferencesContextValue = {
  readonly preferences: Preferences;
  readonly ready: boolean;
  setTown: (town: Town) => void;
  setRadius: (radiusM: number) => void;
  setPrice: (next: { freeOnly: boolean; maxPrice: number | null }) => void;
  setCategories: (categories: readonly EventCategory[] | null) => void;
};

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  ready: false,
  setTown: () => {},
  setRadius: () => {},
  setPrice: () => {},
  setCategories: () => {},
});

function parse(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    if (!parsed.town || typeof parsed.radiusM !== 'number') return DEFAULT_PREFERENCES;

    // Categories are validated against the enum rather than trusted: a stale value
    // from an older build would otherwise filter the feed down to nothing with no
    // way for the user to tell why.
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((c): c is EventCategory =>
          (EVENT_CATEGORIES as readonly string[]).includes(c),
        )
      : null;

    return {
      town: parsed.town,
      radiusM: parsed.radiusM,
      chosen: parsed.chosen === true,
      freeOnly: parsed.freeOnly === true,
      maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
      categories: categories && categories.length > 0 ? categories : null,
    };
  } catch {
    // Corrupt storage should reset to defaults, never crash the app on launch.
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  // One-shot read on mount. This has to be an effect, not a memo: a memo body runs
  // during render, and the promise can resolve before the component has mounted,
  // which React correctly complains about.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) setPreferences(parse(raw));
      })
      .catch(() => {
        if (active) setPreferences(DEFAULT_PREFERENCES);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: Preferences) => {
    setPreferences(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // A failed write costs the user their saved town next launch, which is
      // recoverable in two taps. Not worth interrupting them over.
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      ready,
      setTown: (town) => persist({ ...preferences, town, chosen: true }),
      setRadius: (radiusM) => persist({ ...preferences, radiusM }),
      setPrice: ({ freeOnly, maxPrice }) => persist({ ...preferences, freeOnly, maxPrice }),
      setCategories: (categories) => persist({ ...preferences, categories }),
    }),
    [preferences, ready, persist],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  return use(PreferencesContext);
}
