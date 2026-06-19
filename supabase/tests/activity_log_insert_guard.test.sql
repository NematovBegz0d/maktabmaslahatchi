-- ============================================================================
-- ACTIVITY_LOG INSERT QULFI TESTI (pgTAP) — Bosqich 1 isboti
--
-- Isbotlaymiz (runtime RLS + trigger ijrosi):
--   1. O'quvchi activity_log ga UMUMAN yoza olmaydi (rol tekshiruvi).
--   2. Maslahatchi ruxsat etilgan action'ni yoza oladi.
--   3. Trigger school_id ni o'z maktabiga MAJBURLAYDI (soxta boshqa maktab rad).
--   4. Trigger actor_name ni profildan oladi (soxta ism rad).
--   5. actor_id = auth.uid() (boshqa nom bilan ham).
--   6. Maslahatchi whitelist tashqaridagi action'ni yoza olmaydi.
--
-- Butun test bitta tranzaksiyada — oxirida ROLLBACK.
-- ============================================================================
begin;
select plan(6);

-- ─── Seed (superuser — RLS chetlab o'tiladi) ────────────────────────────────
insert into public.schools (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Test Maktab A'),
  ('22222222-2222-2222-2222-222222222222', 'Test Maktab B');

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'counselor-a@test.local',
   '{"role":"counselor","full_name":"Maslahatchi A"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'student-a@test.local',
   '{"role":"student","full_name":"O''quvchi A"}');

update public.profiles set school_id = '11111111-1111-1111-1111-111111111111'
  where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003');

-- ─── 1. O'QUVCHI sifatida — yoza olmasligi kerak ────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub','cccccccc-0000-0000-0000-000000000003','role','authenticated')::text, true);

select throws_ok(
  $$ insert into public.activity_log (action) values ('task_submitted') $$,
  '42501', NULL,
  'o''quvchi activity_log ga yoza OLMAYDI (rol tekshiruvi bloklaydi)'
);

-- ─── MASLAHATCHI A sifatida — soxta school_id + soxta ism bilan yozadi ───────
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub','aaaaaaaa-0000-0000-0000-000000000001','role','authenticated')::text, true);

-- Soxta B maktabi va soxta ism yuboramiz — trigger ularni majburan tuzatishi kerak.
insert into public.activity_log (action, school_id, actor_name, target_label)
  values ('task_submitted', '22222222-2222-2222-2222-222222222222', 'SOXTA ISM', 'probe-row');

-- ─── 6. Whitelist tashqaridagi action — yoza olmasligi kerak ────────────────
select throws_ok(
  $$ insert into public.activity_log (action, target_label) values ('student_deleted', 'x') $$,
  '42501', NULL,
  'maslahatchi whitelist tashqaridagi action yoza OLMAYDI'
);

-- ─── Tekshiruvlar (superuser — saqlangan qatorni o'qiymiz) ───────────────────
reset role;

select is(
  (select count(*)::int from public.activity_log where target_label = 'probe-row'),
  1, 'maslahatchi ruxsat etilgan action yozdi'
);
select is(
  (select school_id from public.activity_log where target_label = 'probe-row'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'trigger school_id ni A maktabiga majburladi (soxta B rad etildi)'
);
select is(
  (select actor_name from public.activity_log where target_label = 'probe-row'),
  'Maslahatchi A', 'trigger actor_name ni profildan oldi (soxta ism rad etildi)'
);
select is(
  (select actor_id from public.activity_log where target_label = 'probe-row'),
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'actor_id = auth.uid()'
);

select * from finish();
rollback;
