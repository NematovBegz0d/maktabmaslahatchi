-- ============================================================================
-- LANDING KONTENTI — 5-BOSQICH (2026-06-12)
--
--   news         — yangiliklar (qoralama/e'lon qilingan, CMS super adminda)
--   center_clubs — "Kelajak" binosidagi markaz to'garaklari (landing vitrinasi;
--                  maktab klublariga (clubs) ALOQASI YO'Q)
--   media bucket — rasm yuklash uchun ochiq storage bucket (faqat admin yozadi)
--
-- E'lon qilingan kontent landing'da login'siz (anon) o'qiladi.
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. news ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text,                                  -- ro'yxatda ko'rinadigan qisqa matn
  body text NOT NULL,
  cover_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(status, published_at DESC);

DROP POLICY IF EXISTS "Published news readable by everyone" ON public.news;
CREATE POLICY "Published news readable by everyone" ON public.news
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage news" ON public.news;
CREATE POLICY "Admins manage news" ON public.news
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 2. center_clubs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.center_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🎯',               -- emoji belgi
  image_url text,
  schedule text,                                 -- masalan: Dush/Chor/Juma 15:00-17:00
  age_range text,                                -- masalan: 7-14 yosh
  teacher text,                                  -- ustoz F.I.Sh
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.center_clubs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.center_clubs TO authenticated;
GRANT ALL ON public.center_clubs TO service_role;
ALTER TABLE public.center_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published center clubs readable by everyone" ON public.center_clubs;
CREATE POLICY "Published center clubs readable by everyone" ON public.center_clubs
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins read all center clubs" ON public.center_clubs;
CREATE POLICY "Admins read all center clubs" ON public.center_clubs
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins manage center clubs" ON public.center_clubs;
CREATE POLICY "Admins manage center clubs" ON public.center_clubs
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 3. media bucket (rasmlar) ───────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
CREATE POLICY "Admins upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (select public.has_role((select auth.uid()), 'admin'::app_role)));
