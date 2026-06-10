-- ============================================================================
-- archived_students view — arxivlangan (is_active=false) o'quvchilar (3-bosqich)
-- O'quvchilar ro'yxatida "Arxiv" bo'limi va qaytarish uchun.
-- student_directory bilan bir xil ustunlar, security_invoker. Idempotent.
-- ============================================================================
CREATE OR REPLACE VIEW public.archived_students
WITH (security_invoker = true) AS
SELECT p.id, p.full_name, p.passport_series, p.class_number, p.class_letter,
       p.school_id, p.parent_id, p.gender, p.birth_date, p.created_at,
       s.name AS school_name
FROM public.profiles p
LEFT JOIN public.schools s ON s.id = p.school_id
WHERE p.is_active = false
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student');
GRANT SELECT ON public.archived_students TO authenticated;
