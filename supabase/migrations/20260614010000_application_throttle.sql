-- ============================================================================
-- LANDING ARIZALARI — SPAM HIMOYASI (2026-06-14)
--
-- Muammo: club_applications anon INSERT'ni cheklovsiz qabul qilardi —
-- skript bilan minglab soxta ariza yuborish mumkin edi.
--
-- Yechim: arizalar endi 'submit-application' edge-funksiyasi orqali (IP va
-- telefon bo'yicha throttle bilan) kiritiladi. To'g'ridan-to'g'ri INSERT
-- huquqi olib tashlanadi — faqat service_role (funksiya ichida) yozadi.
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- Throttle uchun yuboruvchi IP'sini saqlaymiz (abuse nazorati)
ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS submitted_ip text;

CREATE INDEX IF NOT EXISTS idx_club_applications_ip_created
  ON public.club_applications(submitted_ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_applications_phone_created
  ON public.club_applications(phone, created_at DESC);

-- To'g'ridan-to'g'ri INSERT'ni yopamiz — endi hammasi funksiya orqali o'tadi
REVOKE INSERT ON public.club_applications FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can apply" ON public.club_applications;
