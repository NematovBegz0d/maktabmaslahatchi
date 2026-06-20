-- ============================================================================
-- SECURITY DEFINER FUNKSIYALARNI QULFLASH (2026-06-20)
--
-- MUAMMO:
--   claim_ai_quota va activity_log_stamp_identity yaratilganda Supabase'ning
--   "default privileges" sozlamasi EXECUTE'ni anon/authenticated rollariga ham
--   bergan. Avvalgi migratsiyalardagi `REVOKE ... FROM PUBLIC` faqat PUBLIC
--   grantni oldi — anon/authenticated'dagi TO'G'RIDAN-TO'G'RI grant qoldi.
--   Natija (advisor 0028/0029): anon `/rest/v1/rpc/claim_ai_quota` orqali
--   ixtiyoriy (haqiqiy) foydalanuvchi UUID'si bilan uning AI kvotasini oshirib
--   yuborishi mumkin edi — kichik abuse/DoS.
--
-- YECHIM:
--   Ikkala funksiyadan ham anon + authenticated EXECUTE'ni qaytarib olamiz.
--   • claim_ai_quota — faqat service_role (edge funksiya) chaqiradi.
--   • activity_log_stamp_identity — trigger funksiyasi; trigger orqali ishlashi
--     uchun chaqiruvchi rolda EXECUTE shart EMAS (Postgres triggerni tizim
--     chaqiradi), shuning uchun REVOKE faoliyat jurnali insertini buzmaydi.
--     (CI'dagi activity_log_insert_guard pgTAP testi buni tasdiqlaydi.)
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.claim_ai_quota(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_quota(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.activity_log_stamp_identity() FROM PUBLIC, anon, authenticated;
