-- Audit log of orders this app submitted to Alpaca's paper trading
-- API. This is NOT the source of truth for positions or P&L —
-- Alpaca's /v2/positions and /v2/account are (see
-- AlpacaPaperTradingProvider.ts) — this table exists so every order
-- the app placed is traceable after the fact, including the risk
-- check result and, when present, the research/conviction reasoning
-- that produced it.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists paper_trade_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  ticker text not null,
  side text not null check (side in ('buy', 'sell')),
  qty numeric not null check (qty > 0),

  -- Null when the risk engine blocked the order before it ever
  -- reached Alpaca — broker_order_id/status stay null in that case,
  -- and risk_blocked_reason explains why.
  broker_order_id text,
  status text,
  estimated_order_value numeric,

  risk_allowed boolean not null,
  risk_blocked_reason text,

  reasoning text,

  created_at timestamptz not null default now()
);

create index if not exists paper_trade_orders_user_id_idx
  on paper_trade_orders (user_id);

create index if not exists paper_trade_orders_created_at_idx
  on paper_trade_orders (created_at desc);

alter table paper_trade_orders enable row level security;

create policy "Users can view their own paper trade orders"
  on paper_trade_orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own paper trade orders"
  on paper_trade_orders for insert
  with check (auth.uid() = user_id);

-- Deliberately no update/delete policy — this is an audit log.
-- Orders are cancelled/closed via new rows or via Alpaca directly,
-- not by editing history.
