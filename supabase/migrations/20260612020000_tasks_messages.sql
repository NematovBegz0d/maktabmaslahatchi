-- ============================================================================
-- VAZIFALAR VA XABARLAR MODULI — 4-BOSQICH (2026-06-12)
--
--   tasks            — super admin yaratadigan vazifalar
--   task_assignments — vazifaning maslahatchiga biriktirilishi va holati:
--                      assigned → submitted → accepted | returned
--   messages         — admin → maslahatchi xabarlari
--                      (recipient_id NULL = barcha maslahatchilarga e'lon)
--   message_reads    — o'qilganlik belgilari
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. tasks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;
CREATE POLICY "Admins manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ─── 2. task_assignments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  counselor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'submitted', 'accepted', 'returned')),
  submission_note text,
  submitted_at timestamptz,
  review_note text,
  reviewed_at timestamptz,
  UNIQUE (task_id, counselor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO service_role;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_counselor
  ON public.task_assignments(counselor_id, status);

DROP POLICY IF EXISTS "Admins manage assignments" ON public.task_assignments;
CREATE POLICY "Admins manage assignments" ON public.task_assignments
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Counselors read own assignments" ON public.task_assignments;
CREATE POLICY "Counselors read own assignments" ON public.task_assignments
  FOR SELECT TO authenticated
  USING (counselor_id = (select auth.uid()));

-- Maslahatchi faqat o'z topshirig'ini va faqat 'submitted' holatiga o'tkaza oladi
-- (qabul qilish/qaytarish — admin huquqi)
DROP POLICY IF EXISTS "Counselors submit own assignments" ON public.task_assignments;
CREATE POLICY "Counselors submit own assignments" ON public.task_assignments
  FOR UPDATE TO authenticated
  USING (counselor_id = (select auth.uid()))
  WITH CHECK (counselor_id = (select auth.uid()) AND status = 'submitted');

-- Maslahatchi o'ziga biriktirilgan vazifalarni o'qiy oladi
-- (task_assignments yaratilgandan KEYIN — policy unga ishora qiladi)
DROP POLICY IF EXISTS "Counselors read assigned tasks" ON public.tasks;
CREATE POLICY "Counselors read assigned tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_assignments ta
      WHERE ta.task_id = tasks.id AND ta.counselor_id = (select auth.uid())
    )
  );

-- ─── 3. messages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = e'lon
  title text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, created_at DESC);

DROP POLICY IF EXISTS "Admins manage messages" ON public.messages;
CREATE POLICY "Admins manage messages" ON public.messages
  FOR ALL TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

DROP POLICY IF EXISTS "Counselors read own or broadcast messages" ON public.messages;
CREATE POLICY "Counselors read own or broadcast messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (select public.has_role((select auth.uid()), 'counselor'::app_role))
    AND (recipient_id = (select auth.uid()) OR recipient_id IS NULL)
  );

-- ─── 4. message_reads ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.message_reads TO authenticated;
GRANT ALL ON public.message_reads TO service_role;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reads" ON public.message_reads;
CREATE POLICY "Users manage own reads" ON public.message_reads
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Admin yuborgan xabarlarining o'qilganligini ko'ra olsin
DROP POLICY IF EXISTS "Admins read all reads" ON public.message_reads;
CREATE POLICY "Admins read all reads" ON public.message_reads
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
