-- Overnight watch: watchlist + evidence_snapshots + alerts.
--
-- Design: alerts are per-ticker, not per-user — the underlying fact
-- ("Rocket Lab filed an 8-K overnight") is the same for everyone
-- watching that ticker, so it's computed once by the cron job and
-- everyone watching that ticker sees the same alert row. watchlist
-- is what maps a user to the tickers they care about; positions
-- (from the earlier migration) count as an implicit watch too — see
-- getWatchedTickers() in the watcher job, which unions both.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlist_user_id_idx on watchlist (user_id);

alter table watchlist enable row level security;

create policy "Users can view their own watchlist"
  on watchlist for select
  using (auth.uid() = user_id);

create policy "Users can add to their own watchlist"
  on watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from their own watchlist"
  on watchlist for delete
  using (auth.uid() = user_id);


-- One row per ticker per day. facts/filings/newsVolume are the
-- specific signals OvernightWatcher diffs against the prior day's
-- row for that ticker — see engine/automation/watchers/OvernightWatcher.ts.
-- Written by the cron job using the service-role key, which bypasses
-- RLS, so there is no insert/update policy for regular users below —
-- that's intentional, not an oversight.
create table if not exists evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  snapshot_date date not null default current_date,
  price numeric,
  latest_filing_accession text,
  news_count_24h integer,
  ark_shares numeric,
  facts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (ticker, snapshot_date)
);

create index if not exists evidence_snapshots_ticker_date_idx
  on evidence_snapshots (ticker, snapshot_date desc);

alter table evidence_snapshots enable row level security;

create policy "Authenticated users can read snapshots"
  on evidence_snapshots for select
  using (auth.role() = 'authenticated');


create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  category text not null check (category in ('sec_filing', 'price_move', 'news_spike', 'institutional_activity')),
  severity text not null default 'info' check (severity in ('info', 'notable', 'material')),
  headline text not null,
  detail text,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists alerts_ticker_created_at_idx
  on alerts (ticker, created_at desc);

alter table alerts enable row level security;

create policy "Authenticated users can read alerts"
  on alerts for select
  using (auth.role() = 'authenticated');


-- Publishing: lets a user snapshot a completed research run as a
-- public, unauthenticated page (for sharing / posting on X / being
-- crawled and cited by AI search). report_snapshot is the full
-- ResearchObject at publish time, frozen — the public page renders
-- from this column, it does not re-run research live. That's a
-- deliberate cost/latency choice (re-running the full committee
-- pipeline on every anonymous visitor would be slow and expensive),
-- and it also means a published report reads as a dated claim
-- ("as of the date shown"), not a live number that could silently
-- drift out from under a link someone already shared.
alter table research_history
  add column if not exists is_public boolean not null default false,
  add column if not exists share_slug text unique,
  add column if not exists report_snapshot jsonb;

create index if not exists research_history_share_slug_idx
  on research_history (share_slug) where share_slug is not null;

create policy "Anyone can read published research"
  on research_history for select
  using (is_public = true);
