import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

// Uses the same service-role client (NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY) as every other background job, so heartbeats
// land in the same database the cron routes read and write. Previously this
// built its own client from a separate SUPABASE_URL variable, and
// cron_heartbeats in the production database had zero rows as a result.
//
// Heartbeats are monitoring only: failures are logged, never thrown, so
// observability can never take down the job it observes.
async function writeHeartbeat(jobName: string, fields: Record<string, string | null>): Promise<void> {
  try {
    const { error } = await createServiceRoleClient()
      .from("cron_heartbeats")
      .upsert({ job_name: jobName, ...fields, updated_at: new Date().toISOString() });
    if (error) {
      console.error("[heartbeat] write failed for " + jobName + ": " + error.message);
    }
  } catch (err) {
    console.error("[heartbeat] write threw for " + jobName + ": " + (err instanceof Error ? err.message : String(err)));
  }
}

export async function heartbeatStart(jobName: string): Promise<void> {
  await writeHeartbeat(jobName, { last_started_at: new Date().toISOString() });
}

export async function heartbeatSuccess(jobName: string): Promise<void> {
  await writeHeartbeat(jobName, { last_success_at: new Date().toISOString(), last_error: null });
}

export async function heartbeatFailure(jobName: string, error: string): Promise<void> {
  await writeHeartbeat(jobName, { last_error: error, last_error_at: new Date().toISOString() });
}