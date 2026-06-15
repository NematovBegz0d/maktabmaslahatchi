-- ============================================================================
-- KICHIK XAVFSIZLIK/TOZALASH MIGRATSIYASI (2026-06-15)
--
-- 1. Schulte testini yashirish — savollari yo'q (o'ynab bo'lmaydi). Savollar
--    qo'shilganda is_active = true qilib qayta yoqsa bo'ladi.
--
-- 2. SECURITY DEFINER yordamchi funksiyalardan anon EXECUTE'ni olib tashlash.
--    Bu funksiyalar faqat 'authenticated' RLS siyosatlari (va useAuth RPC'si)
--    ichida kerak; anon ularni PostgREST /rpc/ orqali chaqira olmasligi kerak
--    (Supabase security advisor WARN: 0028).
--
--    Tegilmaydi:
--      • landing_stats() — ataylab anon'da qoladi (landing sahifasi ishlatadi)
--      • has_role()      — anon'da allaqachon yo'q; ko'p RLS siyosatlari ishlatadi
--
-- Joriy holat (migratsiyadan oldin, live'da tasdiqlangan):
--   get_my_role / get_my_school_id / in_my_school → anon EXECUTE = true
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. Schulte testini faolsizlantirish ────────────────────────────────────
UPDATE public.tests
SET is_active = false
WHERE test_type = 'schulte' AND is_active = true;

-- ─── 2. anon'dan ortiqcha EXECUTE'ni olib tashlash ──────────────────────────
-- PUBLIC = barcha rollar (anon ham). PUBLIC'dan REVOKE qilib, faqat
-- authenticated'ga qayta beramiz (RLS siyosatlari va useAuth shuni talab qiladi).
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_school_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.in_my_school(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.in_my_school(uuid) TO authenticated;
