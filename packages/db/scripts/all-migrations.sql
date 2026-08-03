-- Combined migrations for one-shot paste into Supabase SQL Editor.
-- Order is significant. Generated from packages/db/migrations/*.sql; do not
-- edit this file directly — edit the source migrations and regenerate.
--
-- Usage:
--   1. Open Supabase dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Click Run
--   4. Should report "Success. No rows returned"
--
-- Safe to re-run partially: the team_member seed uses on conflict do nothing.
-- Re-running CREATE TABLE will error — that's expected on a fresh project
-- only.

-- ============================================================================
-- 20260504000000_init_extensions.sql
-- ============================================================================

-- Initial extensions and shared helpers.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ============================================================================
-- 20260504000100_org_team_member.sql
-- ============================================================================

-- Org and team_member tables. Planner allow-list enforced at signup.

create table public.org (
  id          bigserial primary key,
  public_id   uuid not null default gen_random_uuid() unique,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_org_updated_at
before update on public.org
for each row execute function public.tg_set_updated_at();

insert into public.org (name) values ('Crystal Events');

create type public.team_role as enum (
  'owner',
  'planner',
  'stylist',
  'admin',
  'external_assistant'
);

create table public.team_member (
  id           bigserial primary key,
  public_id    uuid not null default gen_random_uuid() unique,
  org_id       bigint not null references public.org(id),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null,
  email        text not null unique,
  phone_e164   text unique,
  role         public.team_role not null,
  is_active    boolean not null default true,
  coi_disclosure_acknowledged_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  deleted_at   timestamptz
);

create trigger trg_team_member_updated_at
before update on public.team_member
for each row execute function public.tg_set_updated_at();

create index team_member_email_idx on public.team_member (lower(email));
create index team_member_phone_idx on public.team_member (phone_e164);
create index team_member_auth_user_idx on public.team_member (auth_user_id);

-- Helper functions used by every RLS policy.
create or replace function auth.uid_team_member()
returns bigint
language sql stable
security definer
set search_path = public
as $$
  select id from public.team_member
   where auth_user_id = auth.uid()
     and is_active = true
     and deleted_at is null
$$;

-- Seed Jennifer only. Other planners are added later via Jennifer's admin
-- account (team-member management lands in a future phase). on conflict
-- makes this migration replayable.
insert into public.team_member (org_id, display_name, email, role)
values
  ((select id from public.org limit 1), 'Jennifer May', 'jennifer@crystalevents.eu', 'owner')
on conflict (email) do nothing;

-- Allow-list trigger: new auth.users rows must match a team_member.email.
-- If matched, link auth_user_id; otherwise reject the signup.
create or replace function auth.tg_link_team_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id bigint;
begin
  select id into v_member_id
    from public.team_member
   where lower(email) = lower(new.email)
     and is_active = true
     and deleted_at is null;

  if v_member_id is null then
    raise exception 'Email % is not on the planner allow-list', new.email
      using errcode = 'P0001';
  end if;

  update public.team_member
     set auth_user_id = new.id,
         updated_at = now()
   where id = v_member_id;

  return new;
end;
$$;

create trigger trg_auth_users_allow_list
before insert on auth.users
for each row execute function auth.tg_link_team_member();

alter table public.org enable row level security;
alter table public.team_member enable row level security;

create policy org_read_all
on public.org for select
to authenticated
using (true);

create policy team_member_read_all
on public.team_member for select
to authenticated
using (deleted_at is null);

create policy team_member_self_update
on public.team_member for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());


-- ============================================================================
-- 20260504000200_couple_project_event.sql
-- ============================================================================

-- Phase 2: couple, wedding_project, event tables

create type public.photo_consent_level as enum ('none', 'internal', 'web', 'press');

create type public.project_status as enum (
  'enquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'
);

create type public.event_phase as enum ('pre', 'wedding_day', 'post');

create type public.event_kind as enum (
  'welcome_dinner', 'haldi', 'mehendi', 'sangeet', 'baraat',
  'civil_ceremony', 'religious_ceremony', 'interfaith_ceremony',
  'cocktail', 'reception', 'brunch', 'other'
);

-- ---------------------------------------------------------------------------
-- couple
-- ---------------------------------------------------------------------------

create table public.couple (
  id                      bigserial primary key,
  public_id               uuid not null default gen_random_uuid() unique,
  org_id                  bigint not null references public.org(id),
  display_name            text not null,        -- "Sham & Shwan" — safe for internal display
  partner1_full_name      text,                 -- Phase 8: encrypt with pgcrypto
  partner2_full_name      text,                 -- Phase 8: encrypt with pgcrypto
  email_primary           text,
  phone_primary_e164      text,
  nationality_1           text,
  nationality_2           text,
  photo_consent_level     public.photo_consent_level not null default 'none',
  gdpr_consent_given_at   timestamptz,
  notes                   text,
  lead_planner_id         bigint references public.team_member(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid references auth.users(id),
  deleted_at              timestamptz
);

create trigger trg_couple_updated_at
before update on public.couple
for each row execute function public.tg_set_updated_at();

create index couple_org_idx          on public.couple (org_id);
create index couple_lead_planner_idx on public.couple (lead_planner_id);
create index couple_deleted_at_idx   on public.couple (deleted_at) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- wedding_project
-- ---------------------------------------------------------------------------

create table public.wedding_project (
  id                    bigserial primary key,
  public_id             uuid not null default gen_random_uuid() unique,
  org_id                bigint not null references public.org(id),
  couple_id             bigint not null references public.couple(id),
  name                  text not null,          -- "Sham & Shwan · June 2025"
  wedding_date          date,
  status                public.project_status not null default 'enquiry',
  guest_count_min       int,
  guest_count_max       int,
  budget_eur_min        numeric(12,2),
  budget_eur_max        numeric(12,2),
  is_hindu_sikh         bool not null default false,
  is_jewish             bool not null default false,
  is_civil              bool not null default false,
  lead_planner_id       bigint references public.team_member(id),
  secondary_planner_id  bigint references public.team_member(id),
  venue_primary         text,
  location_city         text not null default 'Barcelona',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create trigger trg_wedding_project_updated_at
before update on public.wedding_project
for each row execute function public.tg_set_updated_at();

create index wedding_project_couple_idx       on public.wedding_project (couple_id);
create index wedding_project_lead_planner_idx on public.wedding_project (lead_planner_id);
create index wedding_project_deleted_at_idx   on public.wedding_project (deleted_at) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- event (sub-events within a wedding project)
-- ---------------------------------------------------------------------------

create table public.event (
  id                  bigserial primary key,
  public_id           uuid not null default gen_random_uuid() unique,
  wedding_project_id  bigint not null references public.wedding_project(id),
  kind                public.event_kind not null,
  phase               public.event_phase not null,
  name                text not null,
  event_date          date,
  start_time          time,
  end_time            time,
  venue               text,
  guest_count         int,
  sort_order          int not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id)
);

create trigger trg_event_updated_at
before update on public.event
for each row execute function public.tg_set_updated_at();

create index event_project_idx    on public.event (wedding_project_id);
create index event_phase_sort_idx on public.event (wedding_project_id, phase, sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.couple         enable row level security;
alter table public.wedding_project enable row level security;
alter table public.event           enable row level security;

-- couple: all org members read; owner/admin/lead_planner write
create policy couple_read_all on public.couple
  for select to authenticated
  using (deleted_at is null);

create policy couple_insert on public.couple
  for insert to authenticated
  with check (
    org_id = (
      select org_id from public.team_member
       where auth_user_id = auth.uid() and deleted_at is null
       limit 1
    )
  );

create policy couple_update on public.couple
  for update to authenticated
  using (
    deleted_at is null
    and (
      lead_planner_id = auth.uid_team_member()
      or exists (
        select 1 from public.team_member
         where auth_user_id = auth.uid()
           and role in ('owner', 'admin')
           and deleted_at is null
      )
    )
  );

-- wedding_project: all org members read; lead/secondary planner + owner/admin write
create policy wedding_project_read_all on public.wedding_project
  for select to authenticated
  using (deleted_at is null);

create policy wedding_project_insert on public.wedding_project
  for insert to authenticated
  with check (
    org_id = (
      select org_id from public.team_member
       where auth_user_id = auth.uid() and deleted_at is null
       limit 1
    )
  );

create policy wedding_project_update on public.wedding_project
  for update to authenticated
  using (
    deleted_at is null
    and (
      lead_planner_id = auth.uid_team_member()
      or secondary_planner_id = auth.uid_team_member()
      or exists (
        select 1 from public.team_member
         where auth_user_id = auth.uid()
           and role in ('owner', 'admin')
           and deleted_at is null
      )
    )
  );

-- event: all org members read/write (project-level access guards which projects exist)
create policy event_read_all on public.event
  for select to authenticated
  using (true);

create policy event_insert on public.event
  for insert to authenticated
  with check (
    exists (
      select 1 from public.wedding_project wp
       where wp.id = wedding_project_id
         and wp.deleted_at is null
         and wp.org_id = (
           select org_id from public.team_member
            where auth_user_id = auth.uid() and deleted_at is null
            limit 1
         )
    )
  );

create policy event_update on public.event
  for update to authenticated
  using (
    exists (
      select 1 from public.wedding_project wp
       where wp.id = wedding_project_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  );


-- ============================================================================
-- 20260504000300_budget.sql
-- ============================================================================

-- Phase 3: budget module (provider DB + budget tree + snapshots + FX)

create type public.provider_status as enum ('pending', 'confirmed', 'declined');

create type public.provider_category as enum (
  'venue', 'catering', 'photography', 'videography', 'florals',
  'music_dj', 'music_band', 'lighting', 'decor', 'transport',
  'hair_makeup', 'attire', 'stationery', 'cake', 'priest_officiant',
  'planner_external', 'rentals', 'other'
);

-- ---------------------------------------------------------------------------
-- provider (org-wide directory, reusable across weddings)
-- ---------------------------------------------------------------------------

create table public.provider (
  id                       bigserial primary key,
  public_id                uuid not null default gen_random_uuid() unique,
  org_id                   bigint not null references public.org(id),
  legal_name               text not null,
  trade_name               text,
  category                 public.provider_category not null,
  email                    text,
  phone_e164               text,
  website                  text,
  languages                text[] not null default '{}',
  notes                    text,
  is_internal_conflict     bool not null default false,
  conflict_team_member_id  bigint references public.team_member(id),
  hindu_sikh_experience    bool not null default false,
  jewish_experience        bool not null default false,
  dietary_capabilities     text[] not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid references auth.users(id),
  deleted_at               timestamptz
);

create trigger trg_provider_updated_at
before update on public.provider
for each row execute function public.tg_set_updated_at();

create index provider_org_idx        on public.provider (org_id);
create index provider_category_idx   on public.provider (category);
create index provider_conflict_idx   on public.provider (conflict_team_member_id) where is_internal_conflict = true;

-- ---------------------------------------------------------------------------
-- budget_service (a service line — e.g. "Catering" — attached to an event)
-- ---------------------------------------------------------------------------

create table public.budget_service (
  id          bigserial primary key,
  public_id   uuid not null default gen_random_uuid() unique,
  event_id    bigint not null references public.event(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

create trigger trg_budget_service_updated_at
before update on public.budget_service
for each row execute function public.tg_set_updated_at();

create index budget_service_event_idx on public.budget_service (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- budget_provider_option (a provider quote/proposal under a service)
-- ---------------------------------------------------------------------------

create table public.budget_provider_option (
  id              bigserial primary key,
  public_id       uuid not null default gen_random_uuid() unique,
  service_id      bigint not null references public.budget_service(id) on delete cascade,
  provider_id     bigint references public.provider(id),
  display_name    text not null,            -- frozen at creation; doesn't follow provider rename
  status          public.provider_status not null default 'pending',
  notes           text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

create trigger trg_budget_provider_option_updated_at
before update on public.budget_provider_option
for each row execute function public.tg_set_updated_at();

create index budget_provider_option_service_idx  on public.budget_provider_option (service_id, sort_order);
create index budget_provider_option_provider_idx on public.budget_provider_option (provider_id);
create index budget_provider_option_status_idx   on public.budget_provider_option (service_id, status);

-- Trigger: confirming one option auto-declines siblings in the same service
create or replace function public.tg_cascade_confirm_provider_option()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    update public.budget_provider_option
       set status = 'declined', updated_at = now()
     where service_id = new.service_id
       and id <> new.id
       and status <> 'declined';
  end if;
  return new;
end;
$$;

create trigger trg_cascade_confirm_provider_option
after insert or update of status on public.budget_provider_option
for each row execute function public.tg_cascade_confirm_provider_option();

-- ---------------------------------------------------------------------------
-- budget_line_item (cost breakdown per provider option)
-- ---------------------------------------------------------------------------

create table public.budget_line_item (
  id                bigserial primary key,
  public_id         uuid not null default gen_random_uuid() unique,
  provider_option_id bigint not null references public.budget_provider_option(id) on delete cascade,
  description       text not null,
  price_eur         numeric(12,2) not null default 0,
  vat_pct           numeric(5,2) not null default 21.00,
  vat_inclusive     bool not null default false,        -- true = price_eur already includes VAT
  sort_order        int not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id)
);

create trigger trg_budget_line_item_updated_at
before update on public.budget_line_item
for each row execute function public.tg_set_updated_at();

create index budget_line_item_option_idx on public.budget_line_item (provider_option_id, sort_order);

-- ---------------------------------------------------------------------------
-- payment_milestone (% of provider total, due date as text for flexibility)
-- ---------------------------------------------------------------------------

create table public.payment_milestone (
  id                 bigserial primary key,
  public_id          uuid not null default gen_random_uuid() unique,
  provider_option_id bigint not null references public.budget_provider_option(id) on delete cascade,
  label              text not null,
  pct                numeric(5,2) not null,
  due_date_text      text,                    -- free-form e.g. "End Aug 2025", "On signature"
  due_date           date,                    -- structured when known; nullable
  paid_at            timestamptz,
  notes              text,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users(id)
);

create trigger trg_payment_milestone_updated_at
before update on public.payment_milestone
for each row execute function public.tg_set_updated_at();

create index payment_milestone_option_idx on public.payment_milestone (provider_option_id, sort_order);
create index payment_milestone_due_idx    on public.payment_milestone (due_date) where paid_at is null;

-- ---------------------------------------------------------------------------
-- budget_version (whole-tree snapshots; supports sandbox + history)
-- ---------------------------------------------------------------------------

create table public.budget_version (
  id                  bigserial primary key,
  public_id           uuid not null default gen_random_uuid() unique,
  wedding_project_id  bigint not null references public.wedding_project(id) on delete cascade,
  label               text not null,                -- "Initial proposal", "After call 14 Jan", etc.
  is_sandbox          bool not null default false,
  snapshot_blob       jsonb not null,               -- full event/service/provider/line/milestone tree
  total_eur           numeric(14,2),                -- denormalised top-line for fast list rendering
  notes               text,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id)
);

create index budget_version_project_idx on public.budget_version (wedding_project_id, created_at desc);
create index budget_version_sandbox_idx on public.budget_version (wedding_project_id) where is_sandbox = true;

-- ---------------------------------------------------------------------------
-- currency_fx_snapshot (cached frankfurter rates, keyed by date)
-- ---------------------------------------------------------------------------

create table public.currency_fx_snapshot (
  id            bigserial primary key,
  base_ccy      text not null,         -- e.g. 'EUR'
  target_ccy    text not null,         -- e.g. 'USD' / 'GBP'
  rate          numeric(14,6) not null,
  fetched_at    timestamptz not null default now(),
  source        text not null default 'frankfurter.app',
  unique (base_ccy, target_ccy, fetched_at)
);

create index currency_fx_snapshot_lookup_idx on public.currency_fx_snapshot (base_ccy, target_ccy, fetched_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.provider                enable row level security;
alter table public.budget_service          enable row level security;
alter table public.budget_provider_option  enable row level security;
alter table public.budget_line_item        enable row level security;
alter table public.payment_milestone       enable row level security;
alter table public.budget_version          enable row level security;
alter table public.currency_fx_snapshot    enable row level security;

-- provider: org members can read/write
create policy provider_read on public.provider
  for select to authenticated using (deleted_at is null);

create policy provider_write on public.provider
  for all to authenticated
  using (
    deleted_at is null
    and org_id = (select org_id from public.team_member where auth_user_id = auth.uid() and deleted_at is null limit 1)
  )
  with check (
    org_id = (select org_id from public.team_member where auth_user_id = auth.uid() and deleted_at is null limit 1)
  );

-- budget_service: read all org rows; write requires planner role
create policy budget_service_read on public.budget_service
  for select to authenticated using (true);

create policy budget_service_write on public.budget_service
  for all to authenticated
  using (
    exists (
      select 1 from public.event ev
        join public.wedding_project wp on wp.id = ev.wedding_project_id
       where ev.id = event_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  )
  with check (true);

-- budget_provider_option: same as service
create policy budget_provider_option_read on public.budget_provider_option
  for select to authenticated using (true);

create policy budget_provider_option_write on public.budget_provider_option
  for all to authenticated
  using (
    exists (
      select 1 from public.budget_service bs
        join public.event ev on ev.id = bs.event_id
        join public.wedding_project wp on wp.id = ev.wedding_project_id
       where bs.id = service_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  )
  with check (true);

-- budget_line_item & payment_milestone: gated via provider_option's project
create policy budget_line_item_read on public.budget_line_item
  for select to authenticated using (true);

create policy budget_line_item_write on public.budget_line_item
  for all to authenticated
  using (
    exists (
      select 1 from public.budget_provider_option po
        join public.budget_service bs on bs.id = po.service_id
        join public.event ev on ev.id = bs.event_id
        join public.wedding_project wp on wp.id = ev.wedding_project_id
       where po.id = provider_option_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  )
  with check (true);

create policy payment_milestone_read on public.payment_milestone
  for select to authenticated using (true);

create policy payment_milestone_write on public.payment_milestone
  for all to authenticated
  using (
    exists (
      select 1 from public.budget_provider_option po
        join public.budget_service bs on bs.id = po.service_id
        join public.event ev on ev.id = bs.event_id
        join public.wedding_project wp on wp.id = ev.wedding_project_id
       where po.id = provider_option_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  )
  with check (true);

-- budget_version: scoped to project planners
create policy budget_version_read on public.budget_version
  for select to authenticated using (true);

create policy budget_version_write on public.budget_version
  for all to authenticated
  using (
    exists (
      select 1 from public.wedding_project wp
       where wp.id = wedding_project_id
         and (
           wp.lead_planner_id = auth.uid_team_member()
           or wp.secondary_planner_id = auth.uid_team_member()
           or exists (
             select 1 from public.team_member
              where auth_user_id = auth.uid()
                and role in ('owner', 'admin')
                and deleted_at is null
           )
         )
    )
  )
  with check (true);

-- currency_fx_snapshot: read-all; writes from cron / service-role only
create policy currency_fx_read on public.currency_fx_snapshot
  for select to authenticated using (true);


