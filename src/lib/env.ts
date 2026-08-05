/**
 * Environment access. Everything reachable from the client must be `EXPO_PUBLIC_`
 * prefixed and safe to ship in a bundle — never put a service-role key here.
 *
 * These reads must stay statically analyzable. Expo inlines `EXPO_PUBLIC_*` at build
 * time by scanning for literal member access, so `process.env[name]` would compile to
 * undefined in a production bundle while appearing to work in dev.
 */

type Env = {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
};

function clean(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const env: Env = {
  supabaseUrl: clean(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
};

/** Phase 1 wires the client; until then the app runs without a backend. */
export function isBackendConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
}
