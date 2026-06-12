-- ============================================================================
-- LANDING ARIZALARI VA OCHIQ STATISTIKA (2026-06-12)
--
--   club_applications — landing'dagi "Qiziqish bildirish" formasi arizalari
--                       (login'siz, anon yuboradi; faqat admin ko'radi)
--   landing_stats()   — landing hisoblagichlari uchun ochiq jamlama raqamlar
--                       (anon alohida jadvallarni o'qiy olmaydi — bitta xavfsiz
--                        SECURITY DEFINER funksiya faqat sonlarni qaytaradi)
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. club_applications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_club_id uuid REFERENCES public.center_clubs(id) ON DELETE SET NULL,
  club_name text,                              -- tarix uchun denormalizatsiya
  full_name text NOT NULL,
  phone text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'enrolled', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.club_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.club_applications TO authenticated;
GRANT ALL ON public.club_applications TO service_role;
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_club_applications_status
  ON public.club_applications(status, created_at DESC);

-- Hamma (login'siz ham) ariza yubora oladi — faqat 'new' holatda
DROP POLICY IF EXISTS "Anyone can apply" ON public.club_applications;
CREATE POLICY "Anyone can apply" ON public.club_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');

-- Faqat admin ko'radi va boshqaradi
DROP POLICY IF EXISTS "Admins manage applications" ON public.club_applications;
CREATE POLICY "Admins manage applications" ON public.club_applications
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 2. landing_stats() — ochiq hisoblagichlar ──────────────────────────────
CREATE OR REPLACE FUNCTION public.landing_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'schools',  (SELECT count(*) FROM public.schools),
    'students', (SELECT count(*) FROM public.user_roles WHERE role = 'student'),
    'clubs',    (SELECT count(*) FROM public.center_clubs WHERE is_published),
    'tests',    (SELECT count(*) FROM public.test_results)
  )
$$;
GRANT EXECUTE ON FUNCTION public.landing_stats() TO anon, authenticated;
