-- ============================================================================
-- YAKUNIY ROLLAR TARTIBI — 6-BOSQICH (2026-06-12)
-- Rollar allaqachon to'g'ri (1 super admin + 1 maslahatchi); bu migratsiya
-- faqat kosmetik tozalash: admin profilida email o'rniga to'g'ri ism
-- (xabarlar va jurnal "sender_name/actor_name" sifatida ishlatadi).
-- Idempotent.
-- ============================================================================
UPDATE public.profiles
SET full_name = 'Super Admin'
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  AND (full_name IS NULL OR full_name LIKE '%@%');
