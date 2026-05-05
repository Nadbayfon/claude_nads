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
