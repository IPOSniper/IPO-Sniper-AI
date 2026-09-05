import { createClient } from "@supabase/supabase-js";

// Lazy client creation, matching this project's existing
// createServiceRoleClient() pattern -- creating the client eagerly at
// module load time broke the Next.js build ("Failed to collect page
// data"), since build-time static analysis imports route modules
// without the same env context as runtime.
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function heartbeatStart(jobName: string): Promise<void> {
  await getSupabase().from("cron_heartbeats").upsert({
    job_name: jobName,
    last_started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function heartbeatSuccess(jobName: string): Promise<void> {
  await getSupabase().from("cron_heartbeats").upsert({
    job_name: jobName,
    last_success_at: new Date().toISOString(),
    last_error: null,
    updated_at: new Date().toISOString(),
  });
}

export async function heartbeatFailure(jobName: string, error: string): Promise<void> {
  await getSupabase().from("cron_heartbeats").upsert({
    job_name: jobName,
    last_error: error,
    last_error_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}