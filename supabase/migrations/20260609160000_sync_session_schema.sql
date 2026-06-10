-- ============================================================================
-- SESSIYA O'ZGARISHLARI SINXRONI (2026-06-09)
-- Bu migratsiya sessiya davomida MCP orqali remote'ga qo'llangan, lekin lokal
-- fayllarda bo'lmagan schema/RLS/funksiya o'zgarishlarini lokalga oladi.
-- TO'LIQ IDEMPOTENT — qayta qo'llansa xato bermaydi.
-- Eslatma: Ayzenk savollari tuzatishi (data) bu yerda EMAS — alohida ko'rib chiqing.
-- ============================================================================

-- ─── 1. profiles.passport_series ustuni (o'quvchi login = guvohnoma seriyasi) ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_series text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_passport_series_key ON public.profiles(passport_series);
CREATE INDEX IF NOT EXISTS idx_profiles_passport_series ON public.profiles(lower(passport_series));

-- ─── 2. has_role: SECURITY DEFINER (RLS rekursiyasini buzadi) + EXECUTE grant ──
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ─── 3. get_my_role RPC: o'z rolini RLS'siz olish (use-auth.ts ishlatadi) ─────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ─── 4. Yangi user trigger: yagona, to'g'ri (search_path=public, sxema bilan) ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'));
  RETURN NEW;
END;
$$;
-- Ortiqcha VA buzuq (search_path'siz) triggerlarni o'chiramiz
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user_role();
-- Yagona to'g'ri trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. student_directory view: faqat 'student' rolli profillar (admin chiqadi) ─
CREATE OR REPLACE VIEW public.student_directory
WITH (security_invoker = true) AS
SELECT p.id, p.full_name, p.passport_series, p.class_number, p.class_letter,
       p.school_id, p.parent_id, p.gender, p.birth_date, p.created_at,
       s.name AS school_name
FROM public.profiles p
LEFT JOIN public.schools s ON s.id = p.school_id
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student');
GRANT SELECT ON public.student_directory TO authenticated;

-- ─── 6. tests/questions: admin boshqaruvi uchun yozish policylari ─────────────
DROP POLICY IF EXISTS "Admins insert tests" ON public.tests;
CREATE POLICY "Admins insert tests" ON public.tests
  FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update tests" ON public.tests;
CREATE POLICY "Admins update tests" ON public.tests
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete tests" ON public.tests;
CREATE POLICY "Admins delete tests" ON public.tests
  FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins insert questions" ON public.questions;
CREATE POLICY "Admins insert questions" ON public.questions
  FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update questions" ON public.questions;
CREATE POLICY "Admins update questions" ON public.questions
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete questions" ON public.questions;
CREATE POLICY "Admins delete questions" ON public.questions
  FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 7. FK indekslar (D-2) ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_club_members_added_by ON public.club_members(added_by);
CREATE INDEX IF NOT EXISTS idx_council_activities_added_by ON public.council_activities(added_by);
CREATE INDEX IF NOT EXISTS idx_council_members_added_by ON public.council_members(added_by);
CREATE INDEX IF NOT EXISTS idx_extracurricular_enrollments_added_by ON public.extracurricular_enrollments(added_by);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_added_by ON public.student_achievements(added_by);
CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON public.test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_student_id ON public.test_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON public.test_sessions(test_id);

-- ─── 8. Optimizatsiyalangan RLS policylari (D-3 + D-4): yakuniy holat ──────────
-- Ifoda (select auth.uid()) va (select has_role((select auth.uid()),...)) — initplan.
-- "o'quvchi o'zinikini" + "admin hammasini" birlashtirilgan OR-SELECT policylari.

-- answers
DROP POLICY IF EXISTS "Students manage own answers" ON public.answers;
CREATE POLICY "Students manage own answers" ON public.answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.test_sessions s WHERE s.id = answers.session_id AND s.student_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_sessions s WHERE s.id = answers.session_id AND s.student_id = (select auth.uid())));

-- profiles
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Read own profile or admin all" ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Read own roles or admin all" ON public.user_roles FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));

-- test_results
DROP POLICY IF EXISTS "Students read own results" ON public.test_results;
DROP POLICY IF EXISTS "Admins read results" ON public.test_results;
CREATE POLICY "Read own results or admin all" ON public.test_results FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));

-- student_profiles
DROP POLICY IF EXISTS "Students read own student_profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Admins read student_profiles" ON public.student_profiles;
CREATE POLICY "Read own student_profile or admin all" ON public.student_profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Students insert own student_profile" ON public.student_profiles;
CREATE POLICY "Students insert own student_profile" ON public.student_profiles FOR INSERT WITH CHECK ((select auth.uid()) = student_id);
DROP POLICY IF EXISTS "Students update own student_profile" ON public.student_profiles;
CREATE POLICY "Students update own student_profile" ON public.student_profiles FOR UPDATE USING ((select auth.uid()) = student_id);

-- test_sessions (SELECT birlashgan, yozish amallari alohida)
DROP POLICY IF EXISTS "Students manage own sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Admins view sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Read own sessions or admin all" ON public.test_sessions;
CREATE POLICY "Read own sessions or admin all" ON public.test_sessions FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Students insert own sessions" ON public.test_sessions;
CREATE POLICY "Students insert own sessions" ON public.test_sessions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = student_id);
DROP POLICY IF EXISTS "Students update own sessions" ON public.test_sessions;
CREATE POLICY "Students update own sessions" ON public.test_sessions FOR UPDATE TO authenticated USING ((select auth.uid()) = student_id) WITH CHECK ((select auth.uid()) = student_id);
DROP POLICY IF EXISTS "Students delete own sessions" ON public.test_sessions;
CREATE POLICY "Students delete own sessions" ON public.test_sessions FOR DELETE TO authenticated USING ((select auth.uid()) = student_id);

-- club_members
DROP POLICY IF EXISTS "Students read own memberships" ON public.club_members;
DROP POLICY IF EXISTS "Admins read memberships" ON public.club_members;
CREATE POLICY "Read own memberships or admin all" ON public.club_members FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins add members" ON public.club_members;
CREATE POLICY "Admins add members" ON public.club_members FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update memberships" ON public.club_members;
CREATE POLICY "Admins update memberships" ON public.club_members FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins remove members" ON public.club_members;
CREATE POLICY "Admins remove members" ON public.club_members FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- student_achievements
DROP POLICY IF EXISTS "Students read own achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "Admins read achievements" ON public.student_achievements;
CREATE POLICY "Read own achievements or admin all" ON public.student_achievements FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins insert achievements" ON public.student_achievements;
CREATE POLICY "Admins insert achievements" ON public.student_achievements FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update achievements" ON public.student_achievements;
CREATE POLICY "Admins update achievements" ON public.student_achievements FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete achievements" ON public.student_achievements;
CREATE POLICY "Admins delete achievements" ON public.student_achievements FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- extracurricular_enrollments
DROP POLICY IF EXISTS "Students read own enrollments" ON public.extracurricular_enrollments;
DROP POLICY IF EXISTS "Admins read enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Read own enrollments or admin all" ON public.extracurricular_enrollments FOR SELECT TO authenticated
  USING ((select auth.uid()) = student_id OR (select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins insert enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins insert enrollments" ON public.extracurricular_enrollments FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins update enrollments" ON public.extracurricular_enrollments FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins delete enrollments" ON public.extracurricular_enrollments FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- clubs (admin yozish)
DROP POLICY IF EXISTS "Admins insert clubs" ON public.clubs;
CREATE POLICY "Admins insert clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update clubs" ON public.clubs;
CREATE POLICY "Admins update clubs" ON public.clubs FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete clubs" ON public.clubs;
CREATE POLICY "Admins delete clubs" ON public.clubs FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- council_members (admin yozish)
DROP POLICY IF EXISTS "Admins insert council members" ON public.council_members;
CREATE POLICY "Admins insert council members" ON public.council_members FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update council members" ON public.council_members;
CREATE POLICY "Admins update council members" ON public.council_members FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete council members" ON public.council_members;
CREATE POLICY "Admins delete council members" ON public.council_members FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- council_activities (admin yozish)
DROP POLICY IF EXISTS "Admins insert council activities" ON public.council_activities;
CREATE POLICY "Admins insert council activities" ON public.council_activities FOR INSERT TO authenticated WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins update council activities" ON public.council_activities;
CREATE POLICY "Admins update council activities" ON public.council_activities FOR UPDATE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins delete council activities" ON public.council_activities;
CREATE POLICY "Admins delete council activities" ON public.council_activities FOR DELETE TO authenticated USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
