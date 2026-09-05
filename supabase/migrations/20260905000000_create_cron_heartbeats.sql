-- Cron heartbeat table: lets any scheduled job (quant-harness,
-- quant-opportunities, future crons) record when it started, when it
-- last succeeded, and its last error. This is the mechanism that would
-- have surfaced the Sept 2 cron failure on Sept 2, not Sept 5.

create table if not exists cron_heartbeats (
  job_name text primary key,
  last_started_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table cron_heartbeats enable row level security;

-- Cron routes write via the service role key, not a user session --
-- no anon/public policy needed.
create policy "service role full access"
  on cron_heartbeats
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
