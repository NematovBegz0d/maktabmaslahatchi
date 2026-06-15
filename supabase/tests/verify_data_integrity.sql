-- ============================================================================
-- MA'LUMOT YAXLITLIGI TEKSHIRUVI (faqat O'QISH — productionda xavfsiz)
--
-- Supabase SQL editor'da yoki:  supabase db execute --file supabase/tests/verify_data_integrity.sql
-- Hech narsa o'zgartirmaydi — faqat hisobotlar qaytaradi.
-- ============================================================================

-- ─── 1. Test savollari soni: e'lon qilingan vs haqiqiy ──────────────────────
-- 'ogohlantirish' ustuni muammoli qatorlarni belgilaydi.
SELECT
  t.name_uz,
  t.test_type,
  t.question_count                                   AS declared_count,
  count(q.id)                                         AS actual_count,
  CASE
    WHEN count(q.id) = 0 THEN '❌ SAVOLSIZ — o''ynab bo''lmaydi'
    WHEN t.question_count <> count(q.id) THEN '⚠️ count mos emas'
    ELSE '✅'
  END                                                 AS ogohlantirish
FROM public.tests t
LEFT JOIN public.questions q ON q.test_id = t.id
GROUP BY t.id, t.name_uz, t.test_type, t.question_count
ORDER BY actual_count ASC;

-- ─── 2. IQ/fan savollarida javob kaliti bormi? ──────────────────────────────
-- Kalitsiz savol → har doim "noto'g'ri" deb hisoblanadi (ball buziladi).
SELECT
  t.test_type,
  count(q.id)                                          AS questions,
  count(k.question_id)                                 AS with_answer_key,
  CASE WHEN count(q.id) <> count(k.question_id)
       THEN '⚠️ ba''zi savollarda kalit yo''q' ELSE '✅' END AS holat
FROM public.tests t
JOIN public.questions q ON q.test_id = t.id
LEFT JOIN public.question_answer_keys k ON k.question_id = q.id
WHERE t.test_type IN ('raven', 'math_iq', 'subject')
GROUP BY t.test_type;

-- ─── 3. Yetim profillar: maktabga biriktirilmagan o'quvchilar ───────────────
-- (maktabsiz o'quvchi RLS bo'yicha hech kimga ko'rinmaydi)
SELECT count(*) AS schoolsiz_oquvchilar
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
WHERE p.school_id IS NULL;

-- ─── 4. RLS auditi: "hammaga ochiq" (USING true) qolib ketgan SELECT'lar ────
-- Maktab-ichki jadvallarda 'true' yoki 'everyone' policy QOLMASLIGI kerak.
SELECT
  tablename,
  policyname,
  qual AS using_expr,
  '⚠️ ko''rib chiqing — maktab izolyatsiyasini buzishi mumkin' AS izoh
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND qual = 'true'
  AND tablename IN (
    'profiles', 'user_roles', 'test_results', 'test_sessions',
    'student_profiles', 'clubs', 'council_members', 'council_activities',
    'student_achievements', 'extracurricular_enrollments'
  )
ORDER BY tablename;
-- Bo'sh natija = ✅ yaxshi (maktab jadvallarida ochiq SELECT yo'q).
