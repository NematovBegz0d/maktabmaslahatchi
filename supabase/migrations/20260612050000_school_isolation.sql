-- ============================================================================
-- MAKTABLAR TO'LIQ AJRATILISHI (2026-06-12)
--
-- Muammo: klublar va o'quvchilar kengashi YOZISH bo'yicha maktabga bog'langan
-- edi, lekin KO'RSATISH hali umumiy edi ("readable by everyone") — bir maktab
-- foydalanuvchisi boshqa maktab klublari/kengashini ko'rardi.
--
-- Bu migratsiya:
--   1. Eski (school_id IS NULL) yozuvlarni tegishli maktabga backfill qiladi
--   2. SELECT policylarni maktab chegarasiga almashtiradi:
--      o'z maktabi yozuvlari + super admin hammasini ko'radi
--   3. anon'dan SELECT huquqini olib tashlaydi (landing endi center_clubs'dan
--      foydalanadi, maktab ichki ma'lumotlari ochiq bo'lmasligi kerak)
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. Backfill: klublar ────────────────────────────────────────────────────
-- A'zolari bor klub → a'zolarining maktabi (eng ko'p uchragani)
UPDATE public.clubs c
SET school_id = sub.school_id
FROM (
  SELECT cm.club_id, mode() WITHIN GROUP (ORDER BY p.school_id) AS school_id
  FROM public.club_members cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE p.school_id IS NOT NULL
  GROUP BY cm.club_id
) sub
WHERE c.id = sub.club_id AND c.school_id IS NULL;

-- A'zosiz egasiz klublar → eng ko'p o'quvchili maktab (joriy yagona aktiv maktab).
-- O'quvchi umuman bo'lmasa NULL qoladi — faqat admin ko'radi.
UPDATE public.clubs
SET school_id = (
  SELECT p.school_id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
  WHERE p.school_id IS NOT NULL
  GROUP BY p.school_id
  ORDER BY count(*) DESC
  LIMIT 1
)
WHERE school_id IS NULL;

-- ─── 2. Backfill: kengash ────────────────────────────────────────────────────
-- A'zo → o'quvchining maktabi
UPDATE public.council_members cm
SET school_id = p.school_id
FROM public.profiles p
WHERE p.id = cm.student_id AND cm.school_id IS NULL AND p.school_id IS NOT NULL;

-- Tadbir → kim qo'shgan bo'lsa o'shaning maktabi
UPDATE public.council_activities ca
SET school_id = p.school_id
FROM public.profiles p
WHERE p.id = ca.added_by AND ca.school_id IS NULL AND p.school_id IS NOT NULL;

-- ─── 3. SELECT policylar: maktab chegarasi ───────────────────────────────────
-- Klublar
DROP POLICY IF EXISTS "Clubs readable by everyone" ON public.clubs;
DROP POLICY IF EXISTS "Clubs readable by same school" ON public.clubs;
CREATE POLICY "Clubs readable by same school" ON public.clubs
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'admin'::app_role))
    OR school_id = (select public.get_my_school_id())
  );

-- Kengash a'zolari
DROP POLICY IF EXISTS "Council members readable by everyone" ON public.council_members;
DROP POLICY IF EXISTS "Council members readable by same school" ON public.council_members;
CREATE POLICY "Council members readable by same school" ON public.council_members
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'admin'::app_role))
    OR school_id = (select public.get_my_school_id())
  );

-- Kengash tadbirlari
DROP POLICY IF EXISTS "Council activities readable by everyone" ON public.council_activities;
DROP POLICY IF EXISTS "Council activities readable by same school" ON public.council_activities;
CREATE POLICY "Council activities readable by same school" ON public.council_activities
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'admin'::app_role))
    OR school_id = (select public.get_my_school_id())
  );

-- ─── 4. anon huquqlarini olib tashlash ───────────────────────────────────────
REVOKE SELECT ON public.clubs FROM anon;
REVOKE SELECT ON public.council_members FROM anon;
REVOKE SELECT ON public.council_activities FROM anon;
