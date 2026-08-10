-- Positions: real per-user holdings, the piece the Hedge Fund layer
-- has been missing (see docs/HEDGE_FUND_ARCHITECTURE.md — "the app
-- currently has zero concept of what do I currently hold"). This is
-- the minimum needed for PortfolioRiskAggregator to weight results
-- by market value: ticker, shares, and a cost basis for reference.
-- Still no trade/order concept here on purpose — this table records
-- what a user says they hold, not anything the app executed.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  shares numeric not null check (shares > 0),
  cost_basis numeric not null check (cost_basis >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One row per ticker per user — "add shares" updates the
  -- existing row rather than creating a duplicate.
  unique (user_id, ticker)
);

create index if not exists positions_user_id_idx
  on positions (user_id);

alter table positions enable row level security;

create policy "Users can view their own positions"
  on positions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own positions"
  on positions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own positions"
  on positions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own positions"
  on positions for delete
  using (auth.uid() = user_id);

-- Keeps updated_at honest on edits (e.g. "add to position") without
-- relying on every call site to set it manually.
create or replace function positions_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger positions_updated_at
  before update on positions
  for each row
  execute function positions_set_updated_at();
