-- ============================================================================
-- SERVER-TOMON AGREGATSIYA TESTI (pgTAP)
--
-- Tekshiradi: 20260629000000_perf_server_aggregation.sql tomonidan qo'shilgan
--   • analytics_overview()   — "Tahlil" jamlamasi (RLS bilan rol doirasida)
--   • counselor_dashboard()  — maslahatchi bildirishnoma raqamlari (maktab doirasida)
--   • school_stats           — qayta yozilgan bir o'tishli view (RLS saqlangan)
--
-- Asosiy invariantlar:
--   1. Super admin BARCHA maktablar bo'yicha to'g'ri jamlama oladi.
--   2. Maslahatchi FAQAT o'z maktabi raqamlarini oladi (RLS avtomatik chegaralaydi).
--   3. Raqamlar avvalgi JS-agregatsiya bilan bir xil semantikada (null→0 va h.k.).
--
-- Bitta tranzaksiyada bajariladi, oxirida ROLLBACK — ma'lumot saqlanmaydi.
-- ============================================================================
begin;
select plan(31);

-- ─── SEED (superuser huquqida — RLS chetlanadi) ─────────────────────────────
insert into public.schools (id, name, region, district, expected_students) values
  ('11111111-1111-1111-1111-111111111111', 'Maktab A', 'Buxoro', 'Tuman-1', 100),
  ('22222222-2222-2222-2222-222222222222', 'Maktab B', 'Buxoro', 'Tuman-2', 50);

-- Foydalanuvchilar (handle_new_user trigger profiles + user_roles yaratadi)
insert into auth.users (id, email, raw_user_meta_data) values
  ('e0000000-0000-0000-0000-000000000009', 'admin@test.local',      '{"role":"admin","full_name":"Admin"}'),
  ('a0000000-0000-0000-0000-000000000001', 'counselor-a@test.local', '{"role":"counselor","full_name":"Maslahatchi A"}'),
  ('b0000000-0000-0000-0000-000000000002', 'counselor-b@test.local', '{"role":"counselor","full_name":"Maslahatchi B"}'),
  ('c0000000-0000-0000-0000-000000000003', 's1@test.local',          '{"role":"student","full_name":"O''quvchi 1"}'),
  ('c0000000-0000-0000-0000-000000000005', 's2@test.local',          '{"role":"student","full_name":"O''quvchi 2"}'),
  ('c0000000-0000-0000-0000-000000000006', 's3@test.local',          '{"role":"student","full_name":"O''quvchi 3"}'),
  ('d0000000-0000-0000-0000-000000000004', 's4@test.local',          '{"role":"student","full_name":"O''quvchi 4"}'),
  ('d0000000-0000-0000-0000-000000000007', 's5@test.local',          '{"role":"student","full_name":"O''quvchi 5"}');

-- Maktab + sinf biriktirish
-- Maktab A: counselor A, s1(7-sinf), s2(8-sinf), s3(9-sinf)
update public.profiles set school_id = '11111111-1111-1111-1111-111111111111'
  where id = 'a0000000-0000-0000-0000-000000000001';
update public.profiles set school_id = '11111111-1111-1111-1111-111111111111', class_number = 7
  where id = 'c0000000-0000-0000-0000-000000000003';
update public.profiles set school_id = '11111111-1111-1111-1111-111111111111', class_number = 8
  where id = 'c0000000-0000-0000-0000-000000000005';
update public.profiles set school_id = '11111111-1111-1111-1111-111111111111', class_number = 9
  where id = 'c0000000-0000-0000-0000-000000000006';
-- Maktab B: counselor B, s4(9-sinf), s5(11-sinf)
update public.profiles set school_id = '22222222-2222-2222-2222-222222222222'
  where id = 'b0000000-0000-0000-0000-000000000002';
update public.profiles set school_id = '22222222-2222-2222-2222-222222222222', class_number = 9
  where id = 'd0000000-0000-0000-0000-000000000004';
update public.profiles set school_id = '22222222-2222-2222-2222-222222222222', class_number = 11
  where id = 'd0000000-0000-0000-0000-000000000007';

-- Fan testi (test_type='subject')
insert into public.tests (id, name_uz, test_type, question_count)
values ('77777777-7777-7777-7777-777777777777', 'Tarix', 'subject', 10);

-- Test natijalari:
--   s1 (A) → Holland (RIA, Sangvinik)
--   s2 (A) → Fan (Tarix, 90%, baho 5)
--   s4 (B) → Holland (SEC, Xolerik)
insert into public.test_results (student_id, test_id, holland_code, personality_type, scaled_scores)
values
  ('c0000000-0000-0000-0000-000000000003',
   (select id from public.tests where test_type = 'holland' limit 1),
   'RIA', 'Sangvinik', null),
  ('c0000000-0000-0000-0000-000000000005',
   '77777777-7777-7777-7777-777777777777',
   null, null, '{"percent":90,"grade":5}'::jsonb),
  ('d0000000-0000-0000-0000-000000000004',
   (select id from public.tests where test_type = 'holland' limit 1),
   'SEC', 'Xolerik', null);

-- Yig'ma profillar:
--   s1 → 50%, [Dasturchi]
--   s2 → 100%, [Dasturchi, Vrach]
--   s4 → null, null
insert into public.student_profiles (student_id, profile_completeness, top_careers) values
  ('c0000000-0000-0000-0000-000000000003', 50,  '[{"name_uz":"Dasturchi"}]'::jsonb),
  ('c0000000-0000-0000-0000-000000000005', 100, '[{"name_uz":"Dasturchi"},{"name_uz":"Vrach"}]'::jsonb),
  ('d0000000-0000-0000-0000-000000000004', 0, null);

-- To'garaklar: A da 2 ta (clubA1 a'zoli, clubA2 bo'sh), B da 1 ta
insert into public.clubs (id, name, school_id) values
  ('f0000000-0000-0000-0000-0000000000a1', 'Shaxmat',  '11111111-1111-1111-1111-111111111111'),
  ('f0000000-0000-0000-0000-0000000000a2', 'Robototexnika', '11111111-1111-1111-1111-111111111111'),
  ('f0000000-0000-0000-0000-0000000000b1', 'Sport (B)', '22222222-2222-2222-2222-222222222222');
insert into public.club_members (club_id, student_id) values
  ('f0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-000000000003'); -- s1

-- Ijtimoiy portfolio: s1 ga yutuq (A da portfoliosi bor yagona o'quvchi)
insert into public.student_achievements (student_id, title) values
  ('c0000000-0000-0000-0000-000000000003', 'Matematika olimpiadasi');

-- Kengash: A da 1 a'zo (s1)
insert into public.council_members (student_id, school_id) values
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111');

-- Vazifa + biriktirish: counselor A ga 'assigned'
insert into public.tasks (id, title, created_by)
  values ('a1a1a1a1-0000-0000-0000-000000000001', 'Hisobot topshiring', 'e0000000-0000-0000-0000-000000000009');
insert into public.task_assignments (task_id, counselor_id, status)
  values ('a1a1a1a1-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'assigned');

-- E'lon (broadcast, recipient_id NULL) — A o'qimagan
insert into public.messages (sender_id, recipient_id, body)
  values ('e0000000-0000-0000-0000-000000000009', null, 'Barchaga e''lon');

-- ════════════════════════════════════════════════════════════════════════════
-- 1-BLOK: SUPER ADMIN (barcha maktablarni ko'radi)
-- ════════════════════════════════════════════════════════════════════════════
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'e0000000-0000-0000-0000-000000000009', 'role', 'authenticated')::text, true);

select is((public.analytics_overview()->>'total_students')::int, 5,
  'admin: total_students = 5 (barcha maktablar)');
select is((public.analytics_overview()->>'completed_tests')::int, 3,
  'admin: completed_tests = 3');
select is((public.analytics_overview()->>'active_students')::int, 3,
  'admin: active_students = 3 (yig''ma profillar)');
select is((public.analytics_overview()->>'avg_completeness')::int, 50,
  'admin: avg_completeness = 50 ((50+100+0)/3, null→0)');
select is(jsonb_array_length(public.analytics_overview()->'holland'), 2,
  'admin: holland taqsimotida 2 yo''nalish (R, S)');
select is(public.analytics_overview()->'top_careers'->0->>'name', 'Dasturchi',
  'admin: eng mashhur kasb = Dasturchi');
select is((public.analytics_overview()->'top_careers'->0->>'value')::int, 2,
  'admin: Dasturchi 2 marta tavsiya etilgan');
select is(jsonb_array_length(public.analytics_overview()->'subjects'), 1,
  'admin: 1 ta fan testi statistikasi');
select is((public.analytics_overview()->'subjects'->0->>'avgPercent')::int, 90,
  'admin: Tarix o''rtacha foiz = 90');
select is((public.analytics_overview()->'subjects'->0->>'avgGrade')::float8, 5::float8,
  'admin: Tarix o''rtacha baho = 5');
select is((public.analytics_overview()->'subjects'->0->>'count')::int, 1,
  'admin: Tarix natijalari soni = 1');
select is((public.analytics_overview()->'test_popularity'->0->>'value')::int, 2,
  'admin: eng mashhur test 2 marta yechilgan (Holland)');

-- school_stats (admin → barcha maktablar)
select is(
  (select student_count::int from public.school_stats where id = '11111111-1111-1111-1111-111111111111'),
  3, 'admin: Maktab A student_count = 3');
select is(
  (select tested_students::int from public.school_stats where id = '11111111-1111-1111-1111-111111111111'),
  2, 'admin: Maktab A tested_students = 2 (s1, s2)');
select is(
  (select student_count::int from public.school_stats where id = '22222222-2222-2222-2222-222222222222'),
  2, 'admin: Maktab B student_count = 2');
select is(
  (select counselor_name from public.school_stats where id = '11111111-1111-1111-1111-111111111111'),
  'Maslahatchi A', 'admin: Maktab A maslahatchisi to''g''ri');

-- ════════════════════════════════════════════════════════════════════════════
-- 2-BLOK: MASLAHATCHI A (faqat Maktab A)
-- ════════════════════════════════════════════════════════════════════════════
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

-- analytics_overview RLS bilan A maktabiga chegaralanadi
select is((public.analytics_overview()->>'total_students')::int, 3,
  'counselor A: total_students = 3 (faqat o''z maktabi)');
select is((public.analytics_overview()->>'completed_tests')::int, 2,
  'counselor A: completed_tests = 2 (s1 Holland + s2 Fan)');
select is((public.analytics_overview()->>'avg_completeness')::int, 75,
  'counselor A: avg_completeness = 75 ((50+100)/2)');

-- counselor_dashboard raqamlari
select is((public.counselor_dashboard()->>'studentCount')::int, 3,
  'counselor A: studentCount = 3');
select is((public.counselor_dashboard()->>'untestedCount')::int, 1,
  'counselor A: untestedCount = 1 (s3)');
select is((public.counselor_dashboard()->>'clubCount')::int, 2,
  'counselor A: clubCount = 2 (faqat A to''garaklari)');
select is(jsonb_array_length(public.counselor_dashboard()->'emptyClubNames'), 1,
  'counselor A: emptyClubNames = 1 (Robototexnika)');
select is((public.counselor_dashboard()->>'studentsWithoutClub')::int, 2,
  'counselor A: studentsWithoutClub = 2 (s2, s3)');
select is((public.counselor_dashboard()->>'pendingTasks')::int, 1,
  'counselor A: pendingTasks = 1 (assigned)');
select is((public.counselor_dashboard()->>'unreadAnnouncements')::int, 1,
  'counselor A: unreadAnnouncements = 1 (broadcast)');
select is((public.counselor_dashboard()->>'councilMembers')::int, 1,
  'counselor A: councilMembers = 1');
select is((public.counselor_dashboard()->>'studentsWithoutPortfolio')::int, 2,
  'counselor A: studentsWithoutPortfolio = 2 (s2, s3 — s1 da yutuq bor)');
select is((public.counselor_dashboard()->>'careerUnoriented79')::int, 1,
  'counselor A: careerUnoriented79 = 1 (s3, 9-sinf, profilsiz)');

-- school_stats maslahatchi A nuqtai nazaridan RLS bilan chegaralangan
select is(
  (select student_count::int from public.school_stats where id = '11111111-1111-1111-1111-111111111111'),
  3, 'counselor A: o''z maktabi student_count = 3');
select is(
  (select student_count::int from public.school_stats where id = '22222222-2222-2222-2222-222222222222'),
  0, 'counselor A: boshqa maktab student_count = 0 (RLS)');

select * from finish();
rollback;
