-- Real, centralized Quant autonomous control state -- one source of
-- truth every AI-driven execution path checks before acting. Built
-- as an append-only log of state CHANGES (not a single mutable row)
-- so every transition is permanently auditable with a real reason
-- and timestamp, per direct instruction ("Log every state change
-- with timestamp and reason"). The CURRENT state is simply the most
-- recent row for a user -- same real pattern already used
-- throughout this app (quant_trade_decisions, paper_trade_orders
-- are also append-only logs, not mutable state tables).
--
-- Real states: OFF, ASSISTED, AUTONOMOUS, SAFE_MODE, EMERGENCY_STOP.
-- Enforced at the server-action level (see
-- quant-control/actions.ts), not just displayed in the UI -- per
-- direct instruction, this must be a real security control, not a
-- dashboard toggle that execution code can bypass.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create table if not exists quant_control_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  state text not null check (state in ('OFF', 'ASSISTED', 'AUTONOMOUS', 'SAFE_MODE', 'EMERGENCY_STOP')),
  reason text not null,

  created_at timestamptz not null default now()
);

create index if not exists quant_control_state_user_id_created_at_idx
  on quant_control_state (user_id, created_at desc);

alter table quant_control_state enable row level security;

create policy "Users can view their own quant control state"
  on quant_control_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quant control state"
  on quant_control_state for insert
  with check (auth.uid() = user_id);

-- Deliberately no update/delete policy -- this is an append-only
-- audit log, same real reasoning as quant_trade_decisions and
-- paper_trade_orders. A state "change" is a new row, not an edit to
-- history.
