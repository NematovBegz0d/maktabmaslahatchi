-- ============================================================================
-- RLS MAKTAB IZOLYATSIYASI TESTI (pgTAP)
--
-- Maqsad: bir maktab maslahatchisi BOSHQA maktab ma'lumotlarini ko'ra
-- olmasligini runtime'da isbotlash (kod o'qish emas, haqiqiy RLS ijrosi).
--
-- Ishga tushirish (LOKAL stack yoki shadow DB — productionda EMAS):
--   supabase test db
--
-- Butun test bitta tranzaksiyada bajariladi va oxirida ROLLBACK qilinadi —
-- hech qanday ma'lumot saqlanib qolmaydi.
-- ============================================================================
begin;
select plan(6);

-- ─── Seed (superuser huquqida — RLS chetlab o'tiladi) ───────────────────────
insert into public.schools (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Test Maktab A'),
  ('22222222-2222-2222-2222-222222222222', 'Test Maktab B');

-- auth.users INSERT → handle_new_user trigger profiles + user_roles yaratadi
-- (rol va ism raw_user_meta_data'dan olinadi)
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'counselor-a@test.local',
   '{"role":"counselor","full_name":"Maslahatchi A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'counselor-b@test.local',
   '{"role":"counselor","full_name":"Maslahatchi B"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'student-a@test.local',
   '{"role":"student","full_name":"O''quvchi A"}'),
  ('dddddddd-0000-0000-0000-000000000004', 'student-b@test.local',
   '{"role":"student","full_name":"O''quvchi B"}');

-- Profillarni maktablarga biriktiramiz
update public.profiles set school_id = '11111111-1111-1111-1111-111111111111'
  where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003');
update public.profiles set school_id = '22222222-2222-2222-2222-222222222222'
  where id in ('bbbbbbbb-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000004');

-- Har maktabga bittadan test natijasi (cross-school o'qishni ham sinaymiz)
insert into public.test_results (student_id, test_id, scaled_scores)
select id, (select id from public.tests limit 1), '{"percent":80}'::jsonb
from public.profiles where id in (
  'cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000004'
);

-- ─── Maslahatchi A sifatida kirish ──────────────────────────────────────────
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003'),
  1, 'A o''z maktabi o''quvchisini KO''RADI'
);
select is(
  (select count(*)::int from public.profiles where id = 'dddddddd-0000-0000-0000-000000000004'),
  0, 'A boshqa maktab o''quvchisini KO''RMAYDI'
);
select is(
  (select count(*)::int from public.test_results where student_id = 'dddddddd-0000-0000-0000-000000000004'),
  0, 'A boshqa maktab natijasini KO''RMAYDI'
);
select is(
  (select public.get_my_school_id()),
  '11111111-1111-1111-1111-111111111111'::uuid, 'get_my_school_id() A maktabini qaytaradi'
);

-- ─── Maslahatchi B sifatida kirish ──────────────────────────────────────────
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from public.profiles where id = 'dddddddd-0000-0000-0000-000000000004'),
  1, 'B o''z maktabi o''quvchisini KO''RADI'
);
select is(
  (select count(*)::int from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003'),
  0, 'B boshqa maktab o''quvchisini KO''RMAYDI'
);

select * from finish();
rollback;
