-- ============================================================================
-- TEST_RESULTS UNIQUE / UPSERT TESTI (pgTAP) — Bosqich 2 isboti
--
-- complete-session funksiyasi service_role bilan UPSERT(onConflict) ishlatadi.
-- Bu yerda DB-darajadagi invariantni isbotlaymiz:
--   1. (student_id, test_id) bo'yicha takroriy oddiy INSERT RAD etiladi (unique).
--   2. UPSERT (on conflict do update) ishlaydi — dublikat yaratmaydi.
--   3. UPSERT'dan keyin ham faqat BITTA qator qoladi.
--   4. UPSERT qiymatni yangilaydi (eski natija o'chmaydi, atomik almashinadi).
--
-- service_role kontekstini superuser bilan modellaymiz (funksiya RLS chetlab
-- o'tadi). Butun test bitta tranzaksiyada — oxirida ROLLBACK.
-- ============================================================================
begin;
select plan(4);

-- ─── Seed ───────────────────────────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-0000-0000-000000000003', 'student-a@test.local',
   '{"role":"student","full_name":"O''quvchi A"}');

-- Boshlang'ich natija (percent = 50)
insert into public.test_results (student_id, test_id, scaled_scores)
values (
  'cccccccc-0000-0000-0000-000000000003',
  (select id from public.tests limit 1),
  '{"percent":50}'::jsonb
);

-- ─── 1. Takroriy oddiy INSERT — unique_violation (23505) ────────────────────
select throws_ok(
  $$ insert into public.test_results (student_id, test_id, scaled_scores)
     values ('cccccccc-0000-0000-0000-000000000003',
             (select id from public.tests limit 1), '{"percent":99}'::jsonb) $$,
  '23505', NULL,
  'takroriy (student_id, test_id) oddiy INSERT RAD etiladi (unique indeks)'
);

-- ─── 2. UPSERT — ishlashi kerak (dublikatsiz qayta yozish) ──────────────────
select lives_ok(
  $$ insert into public.test_results (student_id, test_id, scaled_scores)
     values ('cccccccc-0000-0000-0000-000000000003',
             (select id from public.tests limit 1), '{"percent":90}'::jsonb)
     on conflict (student_id, test_id)
     do update set scaled_scores = excluded.scaled_scores $$,
  'UPSERT (on conflict) ishlaydi'
);

-- ─── 3. Faqat bitta qator qoldi ─────────────────────────────────────────────
select is(
  (select count(*)::int from public.test_results
     where student_id = 'cccccccc-0000-0000-0000-000000000003'),
  1, 'UPSERT dublikat yaratmadi — bitta qator'
);

-- ─── 4. Qiymat atomik yangilandi ────────────────────────────────────────────
select is(
  (select scaled_scores->>'percent' from public.test_results
     where student_id = 'cccccccc-0000-0000-0000-000000000003'),
  '90', 'UPSERT natijani yangiladi (eski 50 yo''qolmasdan 90 ga almashdi)'
);

select * from finish();
rollback;
