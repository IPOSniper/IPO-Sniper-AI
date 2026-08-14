-- Real fill data -- the foundational piece every trade-closure/P&L
-- proposal this session has depended on. Confirmed directly against
-- Alpaca's own official API docs before adding these (a real order
-- response example showing "filled_avg_price": "154.03") -- not
-- assumed.
--
-- Honest nuance, also confirmed via Alpaca's real docs/forum posts:
-- these fields are often NULL immediately after order submission,
-- since market orders take a moment to actually fill. A row may be
-- inserted with all three null even for a fully successful order --
-- that's expected, not a bug. The real, filled values become
-- available on a later listOrders() call once Alpaca has actually
-- filled the order.
--
-- This migration adds the columns only. It does NOT yet add any
-- logic to backfill fill data onto existing rows, detect when a
-- position closes, or compute realized P&L -- those are real,
-- separate, substantial pieces that depend on this foundation
-- existing first.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

alter table paper_trade_orders
  add column if not exists filled_avg_price numeric,
  add column if not exists filled_qty numeric,
  add column if not exists filled_at timestamptz;
