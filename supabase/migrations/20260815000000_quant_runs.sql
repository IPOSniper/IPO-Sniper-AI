-- Real Quant Run Ledger -- answers "did the autonomous batch scanner
-- actually run, and what happened" as a real, persisted record, not
-- just the transient in-page results table (which disappears on
-- navigation). Each row is one real invocation of runBatchScan().
--
-- Real counts computed directly from that run's actual
-- BatchRunResult[] -- decisionsCount (tickers evaluated),
-- tradePlansCount (real direction !== "none"), riskApprovedCount
-- (real outcome === "execute", meaning it cleared every real gate
-- including Quant Control and RiskEngine), ordersSubmittedCount
-- (real executed === true), ordersFilledCount (real
-- orderStatus === "filled" specifically, a stricter real subset of
-- submitted).
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists quant_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  started_at timestamptz not null,
  completed_at timestamptz,

  watchlist text[] not null,
  status text not null check (status in ('completed', 'failed')),
  error text,

  tickers_count integer not null default 0,
  decisions_count integer not null default 0,
  trade_plans_count integer not null default 0,
  risk_approved_count integer not null default 0,
  orders_submitted_count integer not null default 0,
  orders_filled_count integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists quant_runs_user_id_created_at_idx
  on quant_runs (user_id, created_at desc);

alter table quant_runs enable row level security;

create policy "Users can view their own quant runs"
  on quant_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quant runs"
  on quant_runs for insert
  with check (auth.uid() = user_id);
