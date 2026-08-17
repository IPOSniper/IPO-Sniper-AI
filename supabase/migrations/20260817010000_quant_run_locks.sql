-- Real run idempotency -- per Section 7I's explicit requirement:
-- "The same autonomous run must never execute twice because of:
-- browser refresh, duplicate scheduler request, retry, network
-- timeout, Vercel retry, user double-click."
--
-- One real row per attempted autonomous run, keyed by a real,
-- caller-supplied idempotency_key (e.g. a real scheduler's own
-- invocation ID, or a deterministic key derived from the intended
-- run's watchlist + a real time bucket). A unique constraint on
-- (user_id, idempotency_key) is the actual enforcement mechanism --
-- a second real attempt with the same key fails at the database
-- level, not just an application-level check that could race.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists quant_run_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  idempotency_key text not null,
  status text not null check (status in ('STARTED', 'RUNNING', 'COMPLETED', 'FAILED', 'ABORTED')),

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  created_at timestamptz not null default now(),

  unique (user_id, idempotency_key)
);

create index if not exists quant_run_locks_user_id_idx
  on quant_run_locks (user_id);

alter table quant_run_locks enable row level security;

create policy "Users can view their own run locks"
  on quant_run_locks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own run locks"
  on quant_run_locks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own run locks"
  on quant_run_locks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
