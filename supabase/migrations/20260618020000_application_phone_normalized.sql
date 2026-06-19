-- ============================================================================
-- LANDING ARIZALARI — TELEFON NORMALIZATSIYASI (2026-06-18)
--
-- MUAMMO:
--   submit-application telefon cooldown'ini XOM `phone` matni bo'yicha
--   (`.eq("phone", phone)`) tekshirardi. Hujumchi formatni o'zgartirib
--   ('+998 90...', '998-90...', '0090...') cooldown'ni AYLANIB O'TARDI.
--
-- YECHIM:
--   Normallashtirilgan kalit ustuni (`phone_normalized`) qo'shamiz — faqat
--   raqamlarning oxirgi 9 tasi (O'zbekiston abonent raqami). Throttle endi shu
--   ustun bo'yicha tekshiriladi, format variantlari bir kalitga to'planadi.
--   Ko'rsatish uchun xom `phone` saqlanib qoladi.
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS phone_normalized text;

-- Mavjud qatorlarni to'ldiramiz: faqat raqamlar, oxirgi 9 tasi.
UPDATE public.club_applications
SET phone_normalized = right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9)
WHERE phone_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_applications_phone_norm_created
  ON public.club_applications(phone_normalized, created_at DESC);
