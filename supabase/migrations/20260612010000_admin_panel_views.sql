-- ============================================================================
-- SUPER ADMIN PANELI UCHUN STATISTIKA VIEW'LARI — 3-BOSQICH (2026-06-12)
--
--   school_stats        — har maktab bo'yicha jamlama: o'quvchi soni, test
--                         qamrovi, 30 kunlik faollik, maslahatchi, oxirgi amal
--   counselor_directory — maslahatchilar ro'yxati (maktabi va faolligi bilan)
--
-- Ikkalasi ham security_invoker — RLS chaqiruvchining huquqi bilan ishlaydi:
-- super admin hammasini ko'radi, boshqalar deyarli hech narsa ko'rmaydi.
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. school_stats ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.school_stats
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.region,
  s.district,
  s.expected_students,
  -- Aktiv o'quvchilar soni
  (SELECT count(*)
     FROM public.profiles p
     JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
    WHERE p.school_id = s.id AND p.is_active) AS student_count,
  -- Kamida bitta test topshirgan o'quvchilar
  (SELECT count(DISTINCT tr.student_id)
     FROM public.test_results tr
     JOIN public.profiles p ON p.id = tr.student_id
    WHERE p.school_id = s.id) AS tested_students,
  -- Oxirgi 30 kunda topshirilgan testlar
  (SELECT count(*)
     FROM public.test_results tr
     JOIN public.profiles p ON p.id = tr.student_id
    WHERE p.school_id = s.id
      AND tr.created_at > now() - interval '30 days') AS results_30d,
  -- Jurnal bo'yicha oxirgi faollik
  (SELECT max(al.created_at)
     FROM public.activity_log al
    WHERE al.school_id = s.id) AS last_activity,
  -- Maktab maslahatchisi (bitta deb hisoblanadi)
  (SELECT p.id
     FROM public.profiles p
     JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'counselor'
    WHERE p.school_id = s.id
    LIMIT 1) AS counselor_id,
  (SELECT p.full_name
     FROM public.profiles p
     JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'counselor'
    WHERE p.school_id = s.id
    LIMIT 1) AS counselor_name
FROM public.schools s;

GRANT SELECT ON public.school_stats TO authenticated;

-- ─── 2. counselor_directory ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.counselor_directory
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.school_id,
  s.name AS school_name,
  p.is_active,
  p.created_at,
  -- Jurnal bo'yicha maslahatchining oxirgi amali
  (SELECT max(al.created_at)
     FROM public.activity_log al
    WHERE al.actor_id = p.id) AS last_activity
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'counselor'
LEFT JOIN public.schools s ON s.id = p.school_id;

GRANT SELECT ON public.counselor_directory TO authenticated;
