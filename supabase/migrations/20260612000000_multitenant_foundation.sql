-- ============================================================================
-- KO'P MAKTABLI (MULTI-TENANT) POYDEVOR — 1-BOSQICH (2026-06-12)
--
-- 3 rolli model:
--   admin     — super admin: maktablar va maslahatchilarni boshqaradi
--   counselor — maktab maslahatchisi: FAQAT o'z maktabi o'quvchilari bilan ishlaydi
--   student   — o'quvchi: o'z ma'lumotlari bilan ishlaydi (o'zgarishsiz)
--
-- Bu migratsiya:
--   1. Yordamchi funksiyalar: get_my_school_id(), in_my_school()
--   2. schools: expected_students ustuni + admin boshqaruv policylari
--   3. Maslahatchi RLS policylari (profiles, user_roles, test_*, student_profiles)
--   4. clubs / council_*: school_id ustunlari + maslahatchi policylari
--   5. student_achievements / extracurricular_enrollments: maslahatchi policylari
--   6. activity_log: faoliyat jurnali (o'zgarmas — faqat INSERT)
--
-- Mavjud "Admins ..." policylar TEGILMAYDI — super admin hammasini ko'raveradi.
-- TO'LIQ IDEMPOTENT — qayta qo'llansa xato bermaydi.
-- ============================================================================

-- ─── 1. Yordamchi funksiyalar ────────────────────────────────────────────────
-- SECURITY DEFINER — profiles RLS'ini chetlab o'tadi (policy rekursiyasini buzadi)

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO authenticated;

-- _user_id chaqiruvchi bilan bitta maktabda ekanini tekshiradi.
-- Ikkala tomonda ham school_id NULL bo'lsa — FALSE (maktabsiz hech narsa ko'rinmaydi).
CREATE OR REPLACE FUNCTION public.in_my_school(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles tp
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE tp.id = _user_id
      AND tp.school_id IS NOT NULL
      AND tp.school_id = me.school_id
  )
$$;
GRANT EXECUTE ON FUNCTION public.in_my_school(uuid) TO authenticated;

-- ─── 2. schools: sig'im + admin boshqaruvi ──────────────────────────────────
-- expected_students — maktabdagi taxminiy o'quvchilar soni (qamrov % hisoblash uchun)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS expected_students integer;

-- Hozirgacha schools'da faqat SELECT policy bor edi — admin yoza olmasdi
DROP POLICY IF EXISTS "Admins insert schools" ON public.schools;
CREATE POLICY "Admins insert schools" ON public.schools
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update schools" ON public.schools;
CREATE POLICY "Admins update schools" ON public.schools
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins delete schools" ON public.schools;
CREATE POLICY "Admins delete schools" ON public.schools
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

GRANT INSERT, UPDATE, DELETE ON public.schools TO authenticated;

-- ─── 3. profiles: maslahatchi o'z maktabini ko'radi/tahrirlaydi ─────────────
DROP POLICY IF EXISTS "Counselors read own school profiles" ON public.profiles;
CREATE POLICY "Counselors read own school profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(id)
  );

-- Faqat O'QUVCHI profillarini tahrirlaydi; WITH CHECK school_id'ni o'z maktabiga
-- qulflaydi — o'quvchini boshqa maktabga "ko'chirib yuborish" mumkin emas.
DROP POLICY IF EXISTS "Counselors update own school students" ON public.profiles;
CREATE POLICY "Counselors update own school students" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(id)
    AND public.has_role(id, 'student'::app_role)
  )
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
    AND public.has_role(id, 'student'::app_role)
  );

-- ─── 4. user_roles: maslahatchi o'z maktabi rollarini o'qiydi ───────────────
-- (student_directory view'idagi EXISTS sharti uchun zarur)
DROP POLICY IF EXISTS "Counselors read own school roles" ON public.user_roles;
CREATE POLICY "Counselors read own school roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(user_id)
  );

-- ─── 5. Test ma'lumotlari: maslahatchi o'z maktabini o'qiydi ────────────────
DROP POLICY IF EXISTS "Counselors read own school sessions" ON public.test_sessions;
CREATE POLICY "Counselors read own school sessions" ON public.test_sessions
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors read own school results" ON public.test_results;
CREATE POLICY "Counselors read own school results" ON public.test_results
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors read own school student_profiles" ON public.student_profiles;
CREATE POLICY "Counselors read own school student_profiles" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

-- ─── 6. clubs: maktabga bog'lash + maslahatchi boshqaruvi ───────────────────
-- school_id NULL = eski (global) klublar; yangi klublar maktabga biriktiriladi
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
CREATE INDEX IF NOT EXISTS idx_clubs_school_id ON public.clubs(school_id);

DROP POLICY IF EXISTS "Counselors insert own school clubs" ON public.clubs;
CREATE POLICY "Counselors insert own school clubs" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors update own school clubs" ON public.clubs;
CREATE POLICY "Counselors update own school clubs" ON public.clubs
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  )
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors delete own school clubs" ON public.clubs;
CREATE POLICY "Counselors delete own school clubs" ON public.clubs
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

-- club_members: maslahatchi o'z maktabi o'quvchilarining a'zoliklarini boshqaradi
GRANT UPDATE ON public.club_members TO authenticated;

DROP POLICY IF EXISTS "Counselors read own school memberships" ON public.club_members;
CREATE POLICY "Counselors read own school memberships" ON public.club_members
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors add own school members" ON public.club_members;
CREATE POLICY "Counselors add own school members" ON public.club_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors update own school memberships" ON public.club_members;
CREATE POLICY "Counselors update own school memberships" ON public.club_members
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors remove own school members" ON public.club_members;
CREATE POLICY "Counselors remove own school members" ON public.club_members
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

-- ─── 7. Yutuqlar va to'garak qatnovlari: maslahatchi boshqaruvi ─────────────
DROP POLICY IF EXISTS "Counselors read own school achievements" ON public.student_achievements;
CREATE POLICY "Counselors read own school achievements" ON public.student_achievements
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors insert own school achievements" ON public.student_achievements;
CREATE POLICY "Counselors insert own school achievements" ON public.student_achievements
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors update own school achievements" ON public.student_achievements;
CREATE POLICY "Counselors update own school achievements" ON public.student_achievements
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors delete own school achievements" ON public.student_achievements;
CREATE POLICY "Counselors delete own school achievements" ON public.student_achievements
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors read own school enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Counselors read own school enrollments" ON public.extracurricular_enrollments
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors insert own school enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Counselors insert own school enrollments" ON public.extracurricular_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors update own school enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Counselors update own school enrollments" ON public.extracurricular_enrollments
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

DROP POLICY IF EXISTS "Counselors delete own school enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Counselors delete own school enrollments" ON public.extracurricular_enrollments
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND public.in_my_school(student_id)
  );

-- ─── 8. Kengash: maktabga bog'lash + maslahatchi boshqaruvi ─────────────────
ALTER TABLE public.council_members ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.council_activities ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
CREATE INDEX IF NOT EXISTS idx_council_members_school_id ON public.council_members(school_id);
CREATE INDEX IF NOT EXISTS idx_council_activities_school_id ON public.council_activities(school_id);

DROP POLICY IF EXISTS "Counselors insert own school council members" ON public.council_members;
CREATE POLICY "Counselors insert own school council members" ON public.council_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors update own school council members" ON public.council_members;
CREATE POLICY "Counselors update own school council members" ON public.council_members
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  )
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors delete own school council members" ON public.council_members;
CREATE POLICY "Counselors delete own school council members" ON public.council_members
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors insert own school council activities" ON public.council_activities;
CREATE POLICY "Counselors insert own school council activities" ON public.council_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors update own school council activities" ON public.council_activities;
CREATE POLICY "Counselors update own school council activities" ON public.council_activities
  FOR UPDATE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  )
  WITH CHECK (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Counselors delete own school council activities" ON public.council_activities;
CREATE POLICY "Counselors delete own school council activities" ON public.council_activities
  FOR DELETE TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

-- ─── 9. activity_log: faoliyat jurnali ──────────────────────────────────────
-- Har muhim amal (o'quvchi qo'shish/o'chirish, import, ...) shu yerga yoziladi.
-- Jurnal O'ZGARMAS: UPDATE/DELETE policylari ataylab yo'q.
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,                                  -- tarix uchun denormalizatsiya
  action text NOT NULL,                             -- 'student_created' | 'students_imported' | ...
  target_id uuid,
  target_label text,                                -- masalan o'quvchi ismi
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_log_school_created
  ON public.activity_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_created
  ON public.activity_log(actor_id, created_at DESC);

DROP POLICY IF EXISTS "Admins read activity" ON public.activity_log;
CREATE POLICY "Admins read activity" ON public.activity_log
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Counselors read own school activity" ON public.activity_log;
CREATE POLICY "Counselors read own school activity" ON public.activity_log
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND school_id = (select public.get_my_school_id())
  );

DROP POLICY IF EXISTS "Users log own actions" ON public.activity_log;
CREATE POLICY "Users log own actions" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = (select auth.uid()));
