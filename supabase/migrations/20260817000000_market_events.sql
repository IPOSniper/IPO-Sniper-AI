-- Real event persistence -- the actual missing piece Novelty Engine
-- (deferred twice now, rounds 89 and 90) has been genuinely blocked
-- on. MarketEvent objects (round86's schema) have existed as an
-- in-memory type only; nothing has stored one until this table.
--
-- One real row per ingested event (e.g. via round90's
-- ingestRecentEvents()). Real, honest column choices matching
-- MarketEvent's actual fields exactly -- no invented columns.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists market_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  event_id text not null,
  ticker text not null,
  occurred_at timestamptz not null,
  detected_at timestamptz not null,

  event_type text not null,
  source_id text not null,
  intended_purpose text not null,

  source_confidence numeric not null,
  materiality text not null,
  novelty_score numeric,

  headline text not null,
  summary text,

  created_at timestamptz not null default now()
);

create index if not exists market_events_user_id_ticker_idx
  on market_events (user_id, ticker);

create index if not exists market_events_user_id_event_type_idx
  on market_events (user_id, event_type);

alter table market_events enable row level security;

create policy "Users can view their own market events"
  on market_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own market events"
  on market_events for insert
  with check (auth.uid() = user_id);
