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
