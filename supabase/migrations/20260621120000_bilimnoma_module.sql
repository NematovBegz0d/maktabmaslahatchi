-- ============================================================================
-- BILIMNOMA MODULI (2026-06-21)
--
--   O'quvchilar uchun ma'lumot-qo'llanma. 4 ta asosiy bo'lim (kod tomonda
--   qat'iy: SECTIONS) — har biri ostida kategoriya va yozuvlar bazada saqlanadi,
--   super admin panelidan boshqariladi.
--
--     Bo'limlar (section):
--       kasblar               — Kasblar (yo'qolayotgan / yangi / an'anaviy ...)
--       prezident_iqtidorli   — Prezident iqtidorli farzandlari
--       prezident_maktablari  — Prezident maktablari
--       oliy_talim            — Oliy ta'lim haqida
--
--     bilimnoma_categories — bo'lim ichidagi guruhlar (masalan Kasblar uchun
--                            "Yo'qolayotgan kasblar", "Yangi kasblar" ...)
--     bilimnoma_entries    — kartochka/maqola yozuvlari (kategoriyaga ixtiyoriy
--                            bog'lanadi; category_id NULL bo'lsa — bo'lim darajasida)
--
--   E'lon qilingan (is_published) kontent landing'da login'siz (anon) o'qiladi.
--   TO'LIQ IDEMPOTENT.
-- ============================================================================

-- Bo'lim qiymatlari kod (src/lib/bilimnoma.ts) bilan bir xil bo'lishi shart.
-- CHECK domeni — noto'g'ri bo'lim yozilishini bazada to'sadi.

-- ─── 1. bilimnoma_categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bilimnoma_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (
    section IN ('kasblar', 'prezident_iqtidorli', 'prezident_maktablari', 'oliy_talim')
  ),
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '📚',                 -- emoji belgi
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bilimnoma_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bilimnoma_categories TO authenticated;
GRANT ALL ON public.bilimnoma_categories TO service_role;
ALTER TABLE public.bilimnoma_categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bilimnoma_categories_section
  ON public.bilimnoma_categories(section, sort_order);

DROP POLICY IF EXISTS "Published bilimnoma categories readable by everyone" ON public.bilimnoma_categories;
CREATE POLICY "Published bilimnoma categories readable by everyone" ON public.bilimnoma_categories
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins read all bilimnoma categories" ON public.bilimnoma_categories;
CREATE POLICY "Admins read all bilimnoma categories" ON public.bilimnoma_categories
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins manage bilimnoma categories" ON public.bilimnoma_categories;
CREATE POLICY "Admins manage bilimnoma categories" ON public.bilimnoma_categories
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 2. bilimnoma_entries ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bilimnoma_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (
    section IN ('kasblar', 'prezident_iqtidorli', 'prezident_maktablari', 'oliy_talim')
  ),
  category_id uuid REFERENCES public.bilimnoma_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text,                                    -- ro'yxatda ko'rinadigan qisqa matn
  body text,                                       -- to'liq matn (oddiy matn, whitespace saqlanadi)
  icon text NOT NULL DEFAULT '💼',                 -- emoji belgi (rasm bo'lmasa kartada ko'rinadi)
  demand text CHECK (demand IS NULL OR demand IN ('growing', 'stable', 'declining')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,      -- structured bo'limlar (what/skills/subjects/study/fun_fact/extra*)
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bilimnoma_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bilimnoma_entries TO authenticated;
GRANT ALL ON public.bilimnoma_entries TO service_role;
ALTER TABLE public.bilimnoma_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bilimnoma_entries_section
  ON public.bilimnoma_entries(section, sort_order);
CREATE INDEX IF NOT EXISTS idx_bilimnoma_entries_category
  ON public.bilimnoma_entries(category_id);

DROP POLICY IF EXISTS "Published bilimnoma entries readable by everyone" ON public.bilimnoma_entries;
CREATE POLICY "Published bilimnoma entries readable by everyone" ON public.bilimnoma_entries
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins read all bilimnoma entries" ON public.bilimnoma_entries;
CREATE POLICY "Admins read all bilimnoma entries" ON public.bilimnoma_entries
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins manage bilimnoma entries" ON public.bilimnoma_entries;
CREATE POLICY "Admins manage bilimnoma entries" ON public.bilimnoma_entries
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));
