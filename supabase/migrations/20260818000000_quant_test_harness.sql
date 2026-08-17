-- Real, persistent Autonomous Quant Test Harness state -- Stage A
-- only (Section 39 of the bootstrap): configuration + state machine,
-- deliberately with NO actual scheduling/execution wiring yet. This
-- table can exist and be fully functional (start/pause/resume/stop,
-- real progress tracking) without any risk of placing a real order,
-- since nothing calls the real execution path from Stage A code.
--
-- One real row per test run (a user could run multiple sequential
-- tests over time, each with its own real history).
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists quant_test_harness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  environment text not null default 'paper' check (environment = 'paper'),

  status text not null check (status in ('IDLE', 'RUNNING', 'PAUSED', 'STOPPING', 'COMPLETED', 'FAILED', 'EMERGENCY_STOPPED')),
  stop_reason text,

  -- Real, configurable targets (Section 7) -- explicit defaults
  -- matching the bootstrap's own recommended conservative first
  -- profile (Section 35), never silently assumed elsewhere in code.
  target_observations integer not null default 500,
  target_autonomous_runs integer not null default 100,
  target_completed_trade_cycles integer not null default 25,

  observation_interval_seconds integer not null default 600,

  watchlist text[] not null,

  -- Real, live progress counters -- updated as real cycles happen
  -- (once Stage B exists to actually run them). All start at 0 --
  -- Stage A creates the row; nothing increments these yet.
  observations_count integer not null default 0,
  autonomous_decisions_count integer not null default 0,
  completed_trade_cycles_count integer not null default 0,

  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists quant_test_harness_user_id_idx
  on quant_test_harness (user_id);

-- Only one real active (non-terminal) test per user -- enforced via
-- a real partial unique index, not just an application-level check
-- that could race. Simpler than a gist exclusion constraint (which
-- would need the btree_gist extension) -- a plain unique index on a
-- filtered subset achieves the same real guarantee.
create unique index if not exists quant_test_harness_one_active_per_user
  on quant_test_harness (user_id)
  where status in ('IDLE', 'RUNNING', 'PAUSED', 'STOPPING');

alter table quant_test_harness enable row level security;

create policy "Users can view their own test harness runs"
  on quant_test_harness for select
  using (auth.uid() = user_id);

create policy "Users can insert their own test harness runs"
  on quant_test_harness for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own test harness runs"
  on quant_test_harness for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
