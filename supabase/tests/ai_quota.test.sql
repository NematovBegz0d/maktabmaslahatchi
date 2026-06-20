-- ============================================================================
-- AI KVOTA ATOMIK TESTI (pgTAP) — Bosqich 3.2 isboti
--
-- claim_ai_quota(_user_id, _limit) DB-darajadagi atomik increment-and-check:
--   1. Limit ichidagi chaqiruvlar -> true
--   2. Limitdan oshgan chaqiruv -> false
--   3. Hisoblagich har chaqiruvda oshadi
--   4. Foydalanuvchilar bir-biridan MUSTAQIL hisoblanadi
--   5. Kun bo'yicha izolyatsiya: kechagi yuqori hisob bugungi limitga ta'sir qilmaydi
--
-- Funksiya SECURITY DEFINER + service_role'ga grant; bu yerda superuser
-- (supabase_admin) bilan chaqiramiz — service_role kabi RLS chetlab o'tadi.
-- Butun test bitta tranzaksiyada — oxirida ROLLBACK.
-- ============================================================================
begin;
select plan(6);

-- ─── Seed: ikkita o'quvchi (handle_new_user trigger profil/rol yaratadi) ─────
insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-0000-0000-0000-000000000004', 'ai-user-a@test.local', '{"role":"student"}'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'ai-user-b@test.local', '{"role":"student"}');

-- ─── 1-2. Limit (2) ichidagi ikki chaqiruv -> true ──────────────────────────
select is(
  public.claim_ai_quota('dddddddd-0000-0000-0000-000000000004', 2),
  true, '1-chaqiruv limit ichida -> true'
);
select is(
  public.claim_ai_quota('dddddddd-0000-0000-0000-000000000004', 2),
  true, '2-chaqiruv limit ichida -> true'
);

-- ─── 3. Uchinchi chaqiruv limitdan oshdi -> false ───────────────────────────
select is(
  public.claim_ai_quota('dddddddd-0000-0000-0000-000000000004', 2),
  false, '3-chaqiruv limitdan oshdi -> false'
);

-- ─── 4. Hisoblagich bugun uchun 3 ga yetdi ──────────────────────────────────
select is(
  (select cnt from public.ai_daily_usage
     where user_id = 'dddddddd-0000-0000-0000-000000000004'
       and usage_date = (now() at time zone 'utc')::date),
  3, 'hisoblagich har chaqiruvda oshdi (=3)'
);

-- ─── 5. Boshqa foydalanuvchi MUSTAQIL hisoblanadi -> true ───────────────────
select is(
  public.claim_ai_quota('eeeeeeee-0000-0000-0000-000000000005', 2),
  true, 'boshqa foydalanuvchi mustaqil -> true'
);

-- ─── 6. Kun izolyatsiyasi: kechagi yuqori hisob bugungi limitga ta'sir qilmaydi ──
insert into public.ai_daily_usage (user_id, usage_date, cnt)
  values ('eeeeeeee-0000-0000-0000-000000000005', (now() at time zone 'utc')::date - 1, 99);
select is(
  public.claim_ai_quota('eeeeeeee-0000-0000-0000-000000000005', 2),
  true, 'kechagi yuqori hisob bugungi claimga ta''sir qilmaydi (kun bo''yicha)'
);

select * from finish();
rollback;
