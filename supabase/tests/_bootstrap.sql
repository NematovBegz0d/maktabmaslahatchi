-- ============================================================================
-- TEST BOOTSTRAP — faqat lokal/CI pgTAP runner uchun (productionda EMAS).
--
-- supabase/postgres image'ida `auth` schema mavjud, lekin ba'zi minimal
-- muhitlarda `storage` schema/jadvallari bo'lmasligi mumkin. landing_content
-- migratsiyasi storage.buckets/objects ga tegadi — migratsiyalar buzilmasligi
-- uchun yetishmaganlarini IDEMPOTENT tarzda yaratamiz.
--
-- Agar image'da haqiqiy storage jadvallari bo'lsa — "IF NOT EXISTS" tufayli
-- bu hech narsani o'zgartirmaydi (haqiqiy jadvallar ishlatiladi).
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text,
  public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now()
);

-- Image'dagi minimal storage jadvallarida landing_content migratsiyasi
-- talab qiladigan ustunlar bo'lmasligi mumkin — idempotent qo'shamiz.
-- (supabase_admin = superuser, shuning uchun ALTER ruxsat etiladi.)
ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS public boolean DEFAULT false;
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS bucket_id text;


-- ─── auth.uid() / auth.role() ni zamonaviy implementatsiyaga normallashtirish ──
-- public.ecr.aws/supabase/postgres image'i ESKI auth.uid() bilan keladi — u faqat
-- `request.jwt.claim.sub` (alohida GUC) ni o'qiydi. Zamonaviy Supabase (va
-- `supabase test db`) esa `request.jwt.claims` (JSON) ishlatadi va testlar shunga
-- yozilgan. Harness real muhitga mos kelishi uchun ikkala konvensiyani ham
-- qo'llab-quvvatlaydigan standart versiyaga almashtiramiz.
-- (Faqat test DB'da — production migratsiyalariga TEGMAYDI.)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )
$$;
