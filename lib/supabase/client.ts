import { createBrowserClient } from "@supabase/ssr";

/**
 * True only if both required env vars are actually set. Check this
 * BEFORE calling createClient() anywhere Supabase might not be
 * configured yet (local dev without keys, a fresh deploy before
 * secrets are set) — createBrowserClient() throws immediately on
 * missing/undefined values, and since Next.js runs page components
 * once during the build to prerender them, an unguarded call here
 * crashes the entire `next build`, not just a runtime request.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Browser-side Supabase client. Use this in Client Components
 * ("use client"). For Server Components, Server Actions, and
 * middleware, use server.ts instead — a single shared client
 * instance doesn't work correctly across Next.js's server/client
 * boundary with cookie-based sessions.
 *
 * Callers MUST check isSupabaseConfigured() first and render a
 * fallback state instead of calling this when it's false — see
 * app/login/page.tsx and app/signup/page.tsx for the pattern.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
