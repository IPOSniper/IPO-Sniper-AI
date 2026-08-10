-- Profiles table + role-based access, per the role model:
-- guest, retail, pro, hedge_admin, admin.
--
-- "Developer Mode" from the design doc is implemented as a boolean
-- flag rather than a 6th role, since it's an orthogonal capability
-- (diagnostics/debugging visibility) rather than a business tier —
-- an admin or hedge_admin could plausibly also want developer tools
-- without that requiring a separate role value.
--
-- NOTE: written against documented Supabase/Postgres syntax, not
-- run against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

create type user_role as enum (
  'guest',
  'retail',
  'pro',
  'hedge_admin',
  'admin'
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role user_role not null default 'retail',
  is_developer boolean not null default false,
  subscription_tier text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth.users row is created,
-- defaulting to 'retail' — new signups should never silently land in
-- a role with more access than intended.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    'retail'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: users can read/update their own profile.
-- hedge_admin/admin can read every profile (needed for any future
-- admin/ops UI). Nobody can change their own role or tier from the
-- client — that must go through a server-side/service-role path
-- (e.g. a Stripe webhook for subscription_tier, or an admin action
-- for role) so a user can't just PATCH themselves into hedge_admin.

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins and hedge admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'hedge_admin')
    )
  );

create policy "Users can update non-privileged fields on their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- role and subscription_tier are intentionally excluded from
    -- what this policy allows changing; enforce that via a
    -- BEFORE UPDATE trigger below rather than trusting the client.
  );

create or replace function public.prevent_self_privilege_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and auth.uid() = old.id then
    raise exception 'Cannot change your own role.';
  end if;
  if new.subscription_tier is distinct from old.subscription_tier and auth.uid() = old.id then
    raise exception 'Cannot change your own subscription tier directly.';
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists before_profile_update on profiles;
create trigger before_profile_update
  before update on profiles
  for each row execute function public.prevent_self_privilege_escalation();
