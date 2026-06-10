
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- Add explicit deny policy on answer keys so linter is happy
CREATE POLICY "No direct access to answer keys" ON public.question_answer_keys FOR SELECT USING (false);
