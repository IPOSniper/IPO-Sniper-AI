-- Real, persistent memory for the existing OpportunityEngine's real
-- output (RankedOpportunity[] from buildOpportunityUniverseWithStatus()
-- in engine/quant/OpportunityEngine.ts). Previously this data only
-- existed transiently in-memory per manual BatchScannerPanel run --
-- there was no ambient "Current Opportunities" a user could return to
-- later. This table is that memory, populated by a new dedicated cron
-- (not the existing quant-harness cron, which is a real trading/
-- decision cycle -- ObservationCycle.ts -- and does not call
-- OpportunityEngine at all; confirmed by reading its real content).
--
-- v1 scope, deliberately narrow: only fields RankedOpportunity
-- actually has (ticker, score, events, scoreBreakdown) plus real
-- bookkeeping. Environment/Instrument/downstream lifecycle status are
-- explicitly NOT modeled here yet -- no real source exists for them,
-- and adding fake columns for them would misrepresent what this table
-- actually knows. Catalyst is deliberately NOT a separate column --
-- it's derived at render time from events[0], keeping this table
-- faithful to OpportunityEngine's real contract rather than
-- duplicating/reinterpreting it.
--
-- fingerprint incorporates the top event's category + timestamp (not
-- just ticker + date), since one ticker can generate multiple
-- meaningful opportunities in a single day as new events arrive --
-- the unique constraint on (user_id, fingerprint) prevents duplicate
-- rows from repeated cron runs while still allowing genuinely new
-- evidence for the same ticker to create a new row.
--
-- last_seen_at is tracked separately from updated_at/detected_at so
-- the UI can later distinguish "still being actively re-detected" from
-- "record unchanged, but hasn't been seen by a scan recently" -- a
-- real, deliberate distinction, not yet acted on in v1.
--
-- status starts and stays "discovered" in v1. Real downstream lifecycle
-- states (analyzing/plan/risk_review/approved/ordering/open/fading/
-- rejected/completed) are explicitly deferred -- they must be driven
-- by real Quant lifecycle events, not invented by the discovery cron.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access here).
-- Run this via the Supabase SQL editor or CLI, and verify -- including
-- enabling Row Level Security, since this table will be read by a
-- client component (unlike quant_test_harness/paper_trade_orders,
-- which are only ever read server-side with an explicit user_id filter).

create table if not exists opportunities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    fingerprint text not null,
    ticker text not null,
    score numeric not null,
    events jsonb not null default '[]'::jsonb,
    score_breakdown jsonb not null default '[]'::jsonb,
    status text not null default 'discovered',
    detected_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, fingerprint)
);

create index if not exists opportunities_user_status_idx
    on opportunities(user_id, status);

create index if not exists opportunities_user_updated_idx
    on opportunities(user_id, updated_at desc);

create index if not exists opportunities_ticker_idx
    on opportunities(user_id, ticker);

alter table opportunities enable row level security;

create policy "Users can view their own opportunities"
    on opportunities for select
    using (auth.uid() = user_id);