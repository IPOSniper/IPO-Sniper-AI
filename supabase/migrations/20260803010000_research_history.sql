-- Research history: lets a user save a research run and see their
-- past research later. Each row is a snapshot at save time (ticker,
-- recommendation, conviction, confidence) — not a live link that
-- updates if the company's numbers change later, since re-running
-- research is cheap and this is meant as "what did I look at and
-- what did the committee say at the time," not a live watchlist.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists research_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  company_name text not null,
  recommendation text not null,
  conviction integer not null,
  confidence integer not null,
  created_at timestamptz not null default now()
);

create index if not exists research_history_user_id_created_at_idx
  on research_history (user_id, created_at desc);

alter table research_history enable row level security;

create policy "Users can view their own research history"
  on research_history for select
  using (auth.uid() = user_id);

create policy "Users can save their own research history"
  on research_history for insert
  with check (auth.uid() = user_id);

-- No update/delete policy: history entries are append-only snapshots
-- by design. If you want a "clear history" feature later, add a
-- delete policy explicitly rather than defaulting to allowing it.
