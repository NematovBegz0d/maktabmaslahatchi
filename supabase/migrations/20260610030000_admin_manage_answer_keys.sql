-- ============================================================================
-- Admin to'g'ri javob kalitlarini boshqara olishi (tests-manage panel orqali).
-- "No direct access to answer keys" (SELECT false) policy o'quvchi/anon uchun
-- saqlanadi -> ular kalitni o'qiy olmaydi (aldash mumkin emas).
-- Faqat admin o'qiydi/yozadi. Idempotent.
-- ============================================================================
DROP POLICY IF EXISTS "Admins read answer keys" ON public.question_answer_keys;
CREATE POLICY "Admins read answer keys" ON public.question_answer_keys
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins insert answer keys" ON public.question_answer_keys;
CREATE POLICY "Admins insert answer keys" ON public.question_answer_keys
  FOR INSERT TO authenticated
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins update answer keys" ON public.question_answer_keys;
CREATE POLICY "Admins update answer keys" ON public.question_answer_keys
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins delete answer keys" ON public.question_answer_keys;
CREATE POLICY "Admins delete answer keys" ON public.question_answer_keys
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
