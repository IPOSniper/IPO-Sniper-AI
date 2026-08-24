-- Real, persistent memory for MomentumDetector.ts's actual output.
-- Deliberately scoped to ONLY the fields the real, verified
-- MomentumObservation type returns (rvol, priceChangePercent, stage,
-- currentVolume, averageVolume, latestClose) -- NOT the fuller
-- original design (priceAcceleration, volumeAcceleration,
-- rangeExpansion, breakoutState, catalystCount/Strength,
-- marketEnvironment, dataQuality). Those remain real, deferred future
-- work -- adding columns for them now, before the detector computes
-- them, would mean either fabricated values or permanently-null
-- columns misrepresenting what this table actually knows.
--
-- fingerprint = ticker + observation date (not a full timestamp/hash
-- like opportunities' fingerprint) -- RVOL is a daily-bar-based signal
-- that doesn't meaningfully change intra-day the way a news event
-- does, so one real observation per ticker per trading day is the
-- correct granularity, not per-run.
--
-- Same explicit insert-vs-update discipline as opportunities (NOT
-- upsert()) -- detected_at/status must never be silently reset on
-- re-observation.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access here).
-- Run via the Supabase SQL editor, and enable Row Level Security --
-- this table will be read by a client component.

create table if not exists momentum_observations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    fingerprint text not null,
    ticker text not null,
    rvol numeric,
    price_change_percent numeric,
    stage text not null,
    current_volume numeric,
    average_volume numeric,
    latest_close numeric,
    detected_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, fingerprint)
);

create index if not exists momentum_observations_user_ticker_idx
    on momentum_observations(user_id, ticker);

create index if not exists momentum_observations_user_stage_idx
    on momentum_observations(user_id, stage);

create index if not exists momentum_observations_user_updated_idx
    on momentum_observations(user_id, updated_at desc);

alter table momentum_observations enable row level security;

create policy "Users can view their own momentum observations"
    on momentum_observations for select
    using (auth.uid() = user_id);