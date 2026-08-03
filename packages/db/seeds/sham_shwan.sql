-- Sham & Shwan demo seed
-- Run after migrations. Safe to re-run (idempotent via ON CONFLICT DO NOTHING).
-- Names are authorised internal-use fixtures; not real personal data.

do $$
declare
  v_org_id       bigint;
  v_jennifer_id  bigint;
  v_nuria_id     bigint;
  v_couple_id    bigint;
  v_project_id   bigint;
begin

  select id into v_org_id from public.org limit 1;
  select id into v_jennifer_id from public.team_member where email = 'jennifer@crystalevents.eu';
  select id into v_nuria_id    from public.team_member where email = 'nuria@crystalevents.eu';

  -- Couple
  insert into public.couple (
    org_id, display_name,
    partner1_full_name, partner2_full_name,
    nationality_1, nationality_2,
    photo_consent_level, gdpr_consent_given_at,
    lead_planner_id, notes
  )
  values (
    v_org_id,
    'Sham & Shwan',
    'Shamira Kapoor',
    'Shwan Mehta',
    'British',
    'Canadian',
    'internal',
    '2024-11-01 10:00:00+00',
    v_jennifer_id,
    '~280 guests. Hindu-Sikh fusion. Venue: Castell de l''Empordà + Masia Can Comas.'
  )
  on conflict do nothing
  returning id into v_couple_id;

  if v_couple_id is null then
    -- Already seeded; grab the id for idempotent event insert
    select id into v_couple_id from public.couple where display_name = 'Sham & Shwan' limit 1;
  end if;

  -- Wedding project
  insert into public.wedding_project (
    org_id, couple_id, name,
    wedding_date, status,
    guest_count_min, guest_count_max,
    is_hindu_sikh, is_civil,
    lead_planner_id, secondary_planner_id,
    venue_primary, location_city
  )
  values (
    v_org_id,
    v_couple_id,
    'Sham & Shwan · June 2025',
    '2025-06-14',
    'in_progress',
    260, 300,
    true, true,
    v_jennifer_id,
    v_nuria_id,
    'Castell de l''Empordà',
    'Barcelona'
  )
  on conflict do nothing
  returning id into v_project_id;

  if v_project_id is null then
    select id into v_project_id
      from public.wedding_project
     where couple_id = v_couple_id
     limit 1;
  end if;

  -- Sub-events (5 total)
  insert into public.event (wedding_project_id, kind, phase, name, event_date, sort_order)
  values
    (v_project_id, 'haldi',      'pre',        'Haldi Ceremony',  '2025-06-11', 10),
    (v_project_id, 'mehendi',    'pre',        'Mehendi Night',   '2025-06-12', 20),
    (v_project_id, 'sangeet',    'pre',        'Sangeet',         '2025-06-13', 30),
    (v_project_id, 'religious_ceremony', 'wedding_day', 'Wedding Ceremony & Baraat', '2025-06-14', 10),
    (v_project_id, 'reception',  'wedding_day','Reception Dinner', '2025-06-14', 20)
  on conflict do nothing;

end $$;
