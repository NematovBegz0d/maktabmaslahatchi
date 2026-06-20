-- ============================================================================
-- AI KUNLIK LIMITNI ATOMIK QILISH — TOCTOU POYGASINI YO'QOTISH (2026-06-20)
--
-- MUAMMO (oldingi holat):
--   analyze-profile kunlik limitni "avval sana, keyin yoz" (check-then-act)
--   tarzida tekshirardi: activity_log'dan 'ai_generated' sonini o'qib, keyin
--   yangi yozuv qo'shardi. Parallel so'rovlar hammasi tekshiruvdan o'tib, keyin
--   yozib qo'yardi → limitdan oshib ketish (ortiqcha Claude xarajati) mumkin edi.
--
-- YECHIM:
--   ai_daily_usage(user_id, usage_date, cnt) hisoblagich jadvali + claim_ai_quota
--   funksiyasi. Funksiya BITTA SQL statement'da (INSERT ... ON CONFLICT DO UPDATE
--   ... RETURNING) hisoblagichni atomik oshiradi va natija limit ichidami yoki
--   yo'qmi qaytaradi. Parallel chaqiruvlar ham ketma-ket serializatsiya qilinadi.
--
--   Faqat service_role chaqira oladi (edge funksiya). Kvota Claude chaqiruvidan
--   OLDIN olinadi — muvaffaqiyatsiz chaqiruv ham xarajat qilgani uchun sanaladi
--   (fail-closed, xarajat himoyasi nuqtai nazaridan to'g'ri).
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  cnt integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

GRANT ALL ON public.ai_daily_usage TO service_role;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
-- Policy ataylab yo'q: faqat service_role (RLS'ni chetlab o'tadi) kira oladi.

-- Atomik kvota olish: bugungi hisoblagichni oshiradi va limit ichidami qaytaradi.
CREATE OR REPLACE FUNCTION public.claim_ai_quota(_user_id uuid, _limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _cnt integer;
BEGIN
  INSERT INTO public.ai_daily_usage AS a (user_id, usage_date, cnt)
  VALUES (_user_id, _today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET cnt = a.cnt + 1
  RETURNING a.cnt INTO _cnt;
  RETURN _cnt <= _limit;
END;
$$;

-- Faqat service_role: anon/authenticated bu funksiyani chaqira olmasligi kerak.
REVOKE EXECUTE ON FUNCTION public.claim_ai_quota(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ai_quota(uuid, integer) TO service_role;
