import { createClient } from "@supabase/supabase-js";

// Expected max gap between successful runs, in minutes, per job.
// Keep this in sync with the schedules in .github/workflows/*.yml.
const EXPECTED_INTERVAL_MINUTES: Record<string, number> = {
  "quant-harness": 10,
  "quant-opportunities": 30,
};

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.from("cron_heartbeats").select("*");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const jobs = (data ?? []).map((row) => {
    const expectedMs = (EXPECTED_INTERVAL_MINUTES[row.job_name] ?? 60) * 60 * 1000;
    const lastSuccessMs = row.last_success_at ? new Date(row.last_success_at).getTime() : 0;
    const staleMs = now - lastSuccessMs;

    // STALE at 2x the expected interval -- gives normal scheduling
    // jitter (GitHub Actions cron is not exact-minute) room without
    // false-alarming.
    const status = staleMs > expectedMs * 2 ? "STALE" : "OK";

    return {
      job_name: row.job_name,
      last_success_at: row.last_success_at,
      last_error: row.last_error,
      last_error_at: row.last_error_at,
      status,
      minutes_since_success: row.last_success_at ? Math.round(staleMs / 60000) : null,
    };
  });

  const overall = jobs.some((j) => j.status === "STALE") ? "DEGRADED" : "HEALTHY";

  return Response.json({ overall, checked_at: new Date().toISOString(), jobs });
}
