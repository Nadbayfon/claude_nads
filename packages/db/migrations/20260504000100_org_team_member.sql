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

-- Seed the four planners. Auth users link via the trigger below at first sign-in.
insert into public.team_member (org_id, display_name, email, role)
values
  ((select id from public.org limit 1), 'Jennifer May',  'jennifer@crystalevents.eu', 'owner'),
  ((select id from public.org limit 1), 'Núria Font',    'nuria@crystalevents.eu',     'planner'),
  ((select id from public.org limit 1), 'Róisín',         'roisin@crystalevents.eu',    'stylist'),
  ((select id from public.org limit 1), 'Jackie',         'jackie@crystalevents.eu',    'admin');

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
