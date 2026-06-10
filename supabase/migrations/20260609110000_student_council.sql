-- ============================================================================
-- O'quvchilar Kengashi moduli — council_members + council_activities
-- NIZOM: "O'quvchilar kengashi" saylovi, faoliyati va ishlarini ommalashtirish
-- Rollar: admin (to'liq boshqaruv) + hamma (ko'rish — ommalashtirish uchun)
-- Idempotent: qayta qo'llansa xato bermaydi.
-- ============================================================================

-- ─── Kengash a'zolari jadvali ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.council_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'member', -- chairman | deputy | secretary | member
  sector TEXT NOT NULL DEFAULT '',         -- yo'nalish (Ma'naviyat, Sport, Media, ...)
  term TEXT NOT NULL DEFAULT '',           -- o'quv yili (masalan: 2025-2026)
  elected_at DATE,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, term)
);
GRANT SELECT ON public.council_members TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.council_members TO authenticated;
GRANT ALL ON public.council_members TO service_role;
ALTER TABLE public.council_members ENABLE ROW LEVEL SECURITY;

-- Kengash a'zolarini hamma ko'ra oladi (ommalashtirish)
DROP POLICY IF EXISTS "Council members readable by everyone" ON public.council_members;
CREATE POLICY "Council members readable by everyone" ON public.council_members
  FOR SELECT USING (true);
-- Faqat admin yozish/tahrirlash/o'chirish
DROP POLICY IF EXISTS "Admins insert council members" ON public.council_members;
CREATE POLICY "Admins insert council members" ON public.council_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update council members" ON public.council_members;
CREATE POLICY "Admins update council members" ON public.council_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete council members" ON public.council_members;
CREATE POLICY "Admins delete council members" ON public.council_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_council_members_student_id ON public.council_members(student_id);

-- ─── Kengash faoliyati jadvali (tadbirlar, seminarlar, tashabbuslar) ──────────
CREATE TABLE IF NOT EXISTS public.council_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.council_activities TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.council_activities TO authenticated;
GRANT ALL ON public.council_activities TO service_role;
ALTER TABLE public.council_activities ENABLE ROW LEVEL SECURITY;

-- Faoliyatni hamma ko'ra oladi (ommalashtirish)
DROP POLICY IF EXISTS "Council activities readable by everyone" ON public.council_activities;
CREATE POLICY "Council activities readable by everyone" ON public.council_activities
  FOR SELECT USING (true);
-- Faqat admin yozish/tahrirlash/o'chirish
DROP POLICY IF EXISTS "Admins insert council activities" ON public.council_activities;
CREATE POLICY "Admins insert council activities" ON public.council_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update council activities" ON public.council_activities;
CREATE POLICY "Admins update council activities" ON public.council_activities
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete council activities" ON public.council_activities;
CREATE POLICY "Admins delete council activities" ON public.council_activities
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_council_activities_date ON public.council_activities(activity_date);
