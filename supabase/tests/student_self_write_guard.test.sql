-- ============================================================================
-- O'QUVCHI SELF-WRITE QULFI TESTI (pgTAP) — Bosqich 2 isboti
--
-- Isbotlanadi (runtime RLS + trigger ijrosi, kod o'qish emas):
--   1. O'quvchi student_profiles ni TO'G'RIDAN-TO'G'RI yoza olmaydi (grant yo'q).
--   2. O'quvchi o'z school_id'sini o'zgartira olmaydi (trigger eski qiymatni saqlaydi).
--   3. O'quvchi o'z passport_series'ini o'zgartira olmaydi.
--   4. O'quvchi o'z is_active'ini o'zgartira olmaydi.
--
-- Butun test bitta tranzaksiyada — oxirida ROLLBACK (hech narsa saqlanmaydi).
-- ============================================================================
begin;
select plan(4);

-- ─── Seed (superuser huquqida — RLS chetlab o'tiladi) ───────────────────────
insert into public.schools (id, name) values
  ('aaaa1111-0000-0000-0000-000000000001', 'Test Maktab A'),
  ('bbbb2222-0000-0000-0000-000000000002', 'Test Maktab B');

-- auth.users INSERT → handle_new_user trigger profiles + user_roles yaratadi
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-0000-0000-000000000003', 'student-a@test.local',
   '{"role":"student","full_name":"O''quvchi A"}');

update public.profiles
   set school_id = 'aaaa1111-0000-0000-0000-000000000001',
       passport_series = 'abc1234567',
       is_active = true
 where id = 'cccccccc-0000-0000-0000-000000000003';

insert into public.student_profiles (student_id, iq_scores, profile_completeness)
values ('cccccccc-0000-0000-0000-000000000003',
        '[{"type":"Umumiy","score":100}]'::jsonb, 50);

-- ─── O'quvchi sifatida kirish ───────────────────────────────────────────────
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'cccccccc-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

-- ─── 1. student_profiles UPDATE — ruxsat YO'Q (grant olib tashlangan → 42501) ─
select throws_ok(
  $$ update public.student_profiles
        set iq_scores = '[{"type":"Umumiy","score":200}]'::jsonb
      where student_id = 'cccccccc-0000-0000-0000-000000000003' $$,
  '42501', NULL,
  'o''quvchi student_profiles ni TO''G''RIDAN-TO''G''RI yoza olmaydi (grant yo''q)'
);

-- ─── 2. profiles.school_id — trigger eski qiymatni saqlaydi ─────────────────
update public.profiles set school_id = 'bbbb2222-0000-0000-0000-000000000002'
  where id = 'cccccccc-0000-0000-0000-000000000003';
select is(
  (select school_id from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003'),
  'aaaa1111-0000-0000-0000-000000000001'::uuid,
  'o''quvchi o''z school_id sini o''zgartira olmaydi (boshqa maktabga ko''cha olmaydi)'
);

-- ─── 3. profiles.passport_series — o'zgarmaydi ──────────────────────────────
update public.profiles set passport_series = 'xyz9999999'
  where id = 'cccccccc-0000-0000-0000-000000000003';
select is(
  (select passport_series from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003'),
  'abc1234567',
  'o''quvchi o''z passport_series (login) ini o''zgartira olmaydi'
);

-- ─── 4. profiles.is_active — o'zgarmaydi ────────────────────────────────────
update public.profiles set is_active = false
  where id = 'cccccccc-0000-0000-0000-000000000003';
select is(
  (select is_active from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003'),
  true,
  'o''quvchi o''z is_active (arxiv holati) ini o''zgartira olmaydi'
);

select * from finish();
rollback;
