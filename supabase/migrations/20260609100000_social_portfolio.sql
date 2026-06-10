-- ============================================================================
-- Ijtimoiy Portfolio moduli — student_achievements + extracurricular_enrollments
-- NIZOM: o'quvchilarning qo'shimcha ta'limga jalb etilganligi ("Ijtimoiy portfolio")
-- Rollar: admin (to'liq boshqaruv) + student (faqat o'z portfoliosini ko'rish)
-- Idempotent: qayta qo'llansa xato bermaydi.
-- ============================================================================

-- ─── Yutuqlar jadvali (sertifikat, tanlov/musobaqa natijalari) ───────────────
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',   -- academic | sport | art | science | social | other
  level TEXT NOT NULL DEFAULT 'school',     -- school | district | region | republic | international
  result TEXT NOT NULL DEFAULT 'participant', -- winner | prize | participant
  achieved_at DATE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- O'quvchi o'z yutuqlarini ko'ra oladi
DROP POLICY IF EXISTS "Students read own achievements" ON public.student_achievements;
CREATE POLICY "Students read own achievements" ON public.student_achievements
  FOR SELECT USING (auth.uid() = student_id);
-- Admin barcha yutuqlarni ko'ra oladi
DROP POLICY IF EXISTS "Admins read achievements" ON public.student_achievements;
CREATE POLICY "Admins read achievements" ON public.student_achievements
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- Faqat admin yozish/tahrirlash/o'chirish
DROP POLICY IF EXISTS "Admins insert achievements" ON public.student_achievements;
CREATE POLICY "Admins insert achievements" ON public.student_achievements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update achievements" ON public.student_achievements;
CREATE POLICY "Admins update achievements" ON public.student_achievements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete achievements" ON public.student_achievements;
CREATE POLICY "Admins delete achievements" ON public.student_achievements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON public.student_achievements(student_id);

-- ─── Maktabdan tashqari ta'lim jadvali ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.extracurricular_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT '',       -- yo'nalish (masalan: Sport, Musiqa, IT)
  schedule TEXT,                            -- jadval (ixtiyoriy)
  status TEXT NOT NULL DEFAULT 'active',    -- active | completed | dropped
  start_date DATE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extracurricular_enrollments TO authenticated;
GRANT ALL ON public.extracurricular_enrollments TO service_role;
ALTER TABLE public.extracurricular_enrollments ENABLE ROW LEVEL SECURITY;

-- O'quvchi o'z mashg'ulotlarini ko'ra oladi
DROP POLICY IF EXISTS "Students read own enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Students read own enrollments" ON public.extracurricular_enrollments
  FOR SELECT USING (auth.uid() = student_id);
-- Admin barcha mashg'ulotlarni ko'ra oladi
DROP POLICY IF EXISTS "Admins read enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins read enrollments" ON public.extracurricular_enrollments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- Faqat admin yozish/tahrirlash/o'chirish
DROP POLICY IF EXISTS "Admins insert enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins insert enrollments" ON public.extracurricular_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins update enrollments" ON public.extracurricular_enrollments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.extracurricular_enrollments;
CREATE POLICY "Admins delete enrollments" ON public.extracurricular_enrollments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_extracurricular_enrollments_student_id ON public.extracurricular_enrollments(student_id);
