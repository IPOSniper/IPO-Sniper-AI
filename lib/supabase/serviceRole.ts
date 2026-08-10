import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * For background/cron jobs only (currently: the overnight watcher).
 * Uses SUPABASE_SERVICE_ROLE_KEY — NOT the NEXT_PUBLIC_ anon key —
 * which bypasses row-level security entirely. Never import this from
 * a Client Component, and never expose SUPABASE_SERVICE_ROLE_KEY with
 * a NEXT_PUBLIC_ prefix or it ships to the browser.
 *
 * Get this key from Supabase Dashboard -> Project Settings -> API ->
 * service_role secret (different from the anon/public key you
 * already have configured).
 */
export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createServiceRoleClient() {
  if (!isServiceRoleConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) is missing. " +
      "This is required for background jobs and is separate from the anon key."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
