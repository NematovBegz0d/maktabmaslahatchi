-- ============================================================================
-- AI TAHLIL KESHI VA XARAJAT NAZORATI (2026-06-14)
--
-- Muammo: analyze-profile har chaqirilganda Claude API'da pul yoqadi va
-- cheksiz chaqirilishi mumkin edi (xarajat suiiste'moli).
--
-- Yechim: ai_summary_at — tahlil OXIRGI MARTA qachon yaratilgani.
--   • Yangi test natijasi qo'shilmagan bo'lsa, analyze-profile keshdan
--     qaytaradi (Claude'ni qayta chaqirmaydi).
--   • Kunlik limit activity_log'dagi 'ai_generated' yozuvlari orqali sanaladi
--     (alohida ustun shart emas).
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;
