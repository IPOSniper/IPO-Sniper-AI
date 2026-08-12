-- Real decision-context log for every Quant Strategist trade plan --
-- both "we traded" and "we decided not to" cases, per direct
-- instruction: "log everything... committee scores, quant
-- decisions" and "learning = collecting evidence about what worked
-- and what didn't", starting BEFORE any actual learning/pattern-
-- detection logic exists. This table is the raw material for that,
-- nothing more -- no self-modifying logic reads from this table
-- yet, and none should until a real, separate, later phase.
--
-- Separate from paper_trade_orders (the generic order-level audit
-- log for ALL orders, equity or options, Quant-originated or
-- manual) rather than duplicating its columns -- this table holds
-- the rich Quant-specific DECISION context; paper_trade_order_id
-- cross-references the actual order when one was placed. A "No
-- Trade" decision has no order and that's fine -- still logged,
-- since the whole point is capturing why Quant declined, not just
-- what it executed.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists quant_trade_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Set only if the user clicked Execute and Alpaca accepted the
  -- order -- null for every "No Trade" decision, and for a trade
  -- plan the user simply never acted on. Links via the real
  -- broker_order_id (also stored in paper_trade_orders) rather than
  -- an internal foreign key -- avoids needing to change the
  -- existing order-logging code path just to return its row id.
  broker_order_id text,

  ticker text not null,
  direction text not null check (direction in ('call', 'put', 'none')),

  -- Real committee snapshot at the moment this decision was made
  committee_confidence numeric not null,
  committee_agreement numeric not null,
  evidence_quality numeric,
  trade_quality_score numeric not null,

  -- Real decision-gate checks (see QuantStrategist.ts's
  -- DecisionCheck[]), stored as-is: [{label, value, threshold,
  -- passed, gap}, ...]
  decision_checks jsonb not null,

  -- Real standard params used, when a plan actually formed
  -- (null across all of these when direction = 'none')
  target_dte_min integer,
  target_dte_max integer,
  target_delta_min numeric,
  target_delta_max numeric,
  suggested_max_risk_percent numeric,
  profit_target_percent numeric,
  stop_loss_percent numeric,

  -- Real selected contract snapshot, when the live chain had one
  -- matching the plan's own target ranges
  contract_symbol text,
  contract_strike numeric,
  contract_expiration date,
  contract_delta numeric,
  contract_iv numeric,
  contract_ask_price numeric,

  -- Real plain-language reasoning shown to the user at decision time
  reasoning text[] not null default '{}',

  created_at timestamptz not null default now()
);

create index if not exists quant_trade_decisions_user_id_idx
  on quant_trade_decisions (user_id);

create index if not exists quant_trade_decisions_ticker_idx
  on quant_trade_decisions (ticker);

create index if not exists quant_trade_decisions_created_at_idx
  on quant_trade_decisions (created_at desc);

alter table quant_trade_decisions enable row level security;

create policy "Users can view their own quant trade decisions"
  on quant_trade_decisions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quant trade decisions"
  on quant_trade_decisions for insert
  with check (auth.uid() = user_id);

-- Deliberately no update/delete policy -- same reasoning as
-- paper_trade_orders: this is a decision log, not a mutable record.
-- Outcome data (P&L, exit reason, win/loss) belongs in a SEPARATE
-- future table once a real way to detect position closure exists
-- (a scheduler, or a manual "record outcome" action) -- not bolted
-- onto this table as nullable columns filled in later, which would
-- make "decision at the time" and "outcome after the fact" harder
-- to tell apart.
