/**
 * Backend selection. The only place in the app that knows which data source is live.
 *
 * Falls back to bundled seed data when no Supabase project is configured, so the app
 * runs end to end with nothing but a checkout. Phase 1 ships only the local source;
 * `SupabaseSource` slots in here when a project exists.
 */

import { localSource } from './local';
import type { DataSource } from './source';
import { isBackendConfigured } from '@/lib/env';

export function getDataSource(): DataSource {
  if (isBackendConfigured()) {
    // Phase 1 deliberately does not ship a half-wired Supabase client. Until
    // SupabaseSource lands, a configured project still reads from seed data —
    // and says so, rather than failing in a way that looks like a network bug.
    console.warn(
      'Supabase is configured but SupabaseSource is not implemented yet. Using seed data.',
    );
  }
  return localSource;
}

export type { DataSource, FeedPage } from './source';
