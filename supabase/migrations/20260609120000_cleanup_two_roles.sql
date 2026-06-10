-- ============================================================================
-- 2 rolli model uchun tozalash (admin + student)
-- Frontend allaqachon 2 rolga o'tgan; bu DB darajasidagi orphan counselor/parent
-- policylarni olib tashlaydi va eski rol yozuvlarini normallashtiradi.
-- ============================================================================

-- ─── 1. Orphan counselor/parent RLS policylarini o'chirish ────────────────────
-- Har bir jadvalda mustaqil "Admins ..." policysi mavjud, shuning uchun bularni
-- olib tashlash admin huquqlariga ta'sir qilmaydi.
DROP POLICY IF EXISTS "Counselors read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents read child profiles" ON public.profiles;

DROP POLICY IF EXISTS "Counselors view sessions" ON public.test_sessions;

DROP POLICY IF EXISTS "Counselors read results" ON public.test_results;
DROP POLICY IF EXISTS "Parents read child results" ON public.test_results;

DROP POLICY IF EXISTS "Counselors read student_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Parents read child student_profile" ON public.student_profiles;

-- ─── 2. Eski rol yozuvlarini normallashtirish (himoya chorasi) ────────────────
-- Odatda bunday yozuvlar yo'q, lekin bo'lsa — 2 rolli modelga moslashtiriladi.
UPDATE public.user_roles SET role = 'admin' WHERE role = 'counselor';
UPDATE public.user_roles SET role = 'student' WHERE role = 'parent';

-- Izoh: app_role enum qiymatlari ('counselor', 'parent') ataylab qoldirildi.
-- Ularni olib tashlash has_role() funksiyasi va unga bog'liq barcha RLS
-- policylarni qayta qurishni talab qiladi (yuqori xavf). Qiymatlar ishlatilmaydi
-- va zararsiz, shuning uchun enum o'zgartirilmaydi.

-- ─── 3. club_members: izohni tahrirlash uchun UPDATE huquqi ───────────────────
GRANT UPDATE ON public.club_members TO authenticated;
DROP POLICY IF EXISTS "Admins update memberships" ON public.club_members;
CREATE POLICY "Admins update memberships" ON public.club_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
