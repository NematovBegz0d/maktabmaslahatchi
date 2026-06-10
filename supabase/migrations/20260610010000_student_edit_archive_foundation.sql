-- ============================================================================
-- O'quvchini tahrirlash + arxivlash asosi (1-bosqich)
--   - profiles.is_active (arxivlash uchun)
--   - admin barcha profilni UPDATE qila olishi (tahrirlash/arxivlash)
--   - student_directory faqat aktiv o'quvchilarni ko'rsatadi
-- Idempotent.
-- ============================================================================

-- 1) Arxivlash bayrog'i (mavjud o'quvchilar avtomatik aktiv)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2) UPDATE policy: o'quvchi o'zinikini + admin hammasini (birlashgan, initplan-optimized)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile or admin all" ON public.profiles;
CREATE POLICY "Update own profile or admin all" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id OR (select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select auth.uid()) = id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));

-- 3) student_directory faqat AKTIV o'quvchilarni ko'rsatsin
CREATE OR REPLACE VIEW public.student_directory
WITH (security_invoker = true) AS
SELECT p.id, p.full_name, p.passport_series, p.class_number, p.class_letter,
       p.school_id, p.parent_id, p.gender, p.birth_date, p.created_at,
       s.name AS school_name
FROM public.profiles p
LEFT JOIN public.schools s ON s.id = p.school_id
WHERE p.is_active = true
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student');
GRANT SELECT ON public.student_directory TO authenticated;
