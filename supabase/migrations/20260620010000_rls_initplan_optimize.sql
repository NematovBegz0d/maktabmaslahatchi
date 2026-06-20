-- ============================================================================
-- RLS INITPLAN OPTIMIZATSIYASI (2026-06-20) — auth_rls_initplan ogohlantirishi
--
-- MUAMMO:
--   Eski (baseline) policy'lar `auth.uid()` / `has_role(auth.uid(), ...)` ni
--   HAR QATOR uchun qayta hisoblaydi (Supabase advisor: auth_rls_initplan).
--   Katta jadvallarda bu sekinlashtiradi.
--
-- YECHIM:
--   `auth.uid()` -> `(select auth.uid())` va butun `has_role(...)` ni
--   `(select public.has_role((select auth.uid()), ...))` ga o'rab, Postgres
--   uni BIR MARTA (InitPlan) hisoblaydigan qilamiz. Bu — multitenant_foundation
--   migratsiyasidagi yangi policy'lar bilan bir xil uslub.
--
-- XAVFSIZLIK O'ZGARMAYDI: `(select expr)` `expr` bilan bir xil mantiqiy qiymat
--   beradi — faqat bajarilish rejasi optimallashadi. Faqat modul jadvallaridagi
--   admin + "o'z yozuvini o'qish" policy'lari (24 ta).
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── club_members ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins add members" ON public.club_members;
CREATE POLICY "Admins add members" ON public.club_members
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins read memberships" ON public.club_members;
CREATE POLICY "Admins read memberships" ON public.club_members
  FOR SELECT
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins remove members" ON public.club_members;
CREATE POLICY "Admins remove members" ON public.club_members
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update memberships" ON public.club_members;
CREATE POLICY "Admins update memberships" ON public.club_members
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Students read own memberships" ON public.club_members;
CREATE POLICY "Students read own memberships" ON public.club_members
  FOR SELECT
  USING (((select auth.uid()) = student_id));

-- ─── clubs ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins delete clubs" ON public.clubs;
CREATE POLICY "Admins delete clubs" ON public.clubs
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert clubs" ON public.clubs;
CREATE POLICY "Admins insert clubs" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update clubs" ON public.clubs;
CREATE POLICY "Admins update clubs" ON public.clubs
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── council_activities ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins delete council activities" ON public.council_activities;
CREATE POLICY "Admins delete council activities" ON public.council_activities
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert council activities" ON public.council_activities;
CREATE POLICY "Admins insert council activities" ON public.council_activities
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update council activities" ON public.council_activities;
CREATE POLICY "Admins update council activities" ON public.council_activities
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── council_members ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins delete council members" ON public.council_members;
CREATE POLICY "Admins delete council members" ON public.council_members
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert council members" ON public.council_members;
CREATE POLICY "Admins insert council members" ON public.council_members
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update council members" ON public.council_members;
CREATE POLICY "Admins update council members" ON public.council_members
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── extracurricular_enrollments ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins delete enrollments" ON public.extracurricular_enrollments
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins insert enrollments" ON public.extracurricular_enrollments
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins read enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins read enrollments" ON public.extracurricular_enrollments
  FOR SELECT
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins update enrollments" ON public.extracurricular_enrollments
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Students read own enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Students read own enrollments" ON public.extracurricular_enrollments
  FOR SELECT
  USING (((select auth.uid()) = student_id));

-- ─── student_achievements ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins delete achievements" ON public.student_achievements;
CREATE POLICY "Admins delete achievements" ON public.student_achievements
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert achievements" ON public.student_achievements;
CREATE POLICY "Admins insert achievements" ON public.student_achievements
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins read achievements" ON public.student_achievements;
CREATE POLICY "Admins read achievements" ON public.student_achievements
  FOR SELECT
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update achievements" ON public.student_achievements;
CREATE POLICY "Admins update achievements" ON public.student_achievements
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Students read own achievements" ON public.student_achievements;
CREATE POLICY "Students read own achievements" ON public.student_achievements
  FOR SELECT
  USING (((select auth.uid()) = student_id));
