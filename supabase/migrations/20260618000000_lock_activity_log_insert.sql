-- ============================================================================
-- ACTIVITY_LOG INSERT'NI QULFLASH — XAVFSIZLIK MUSTAHKAMLASH (2026-06-18)
--
-- MUAMMO (oldingi holat):
--   "Users log own actions" policy faqat `actor_id = auth.uid()` ni tekshirardi.
--   `school_id`, `action`, `actor_name`, `target_label` UMUMAN tekshirilmasdi.
--   Natija: istalgan authenticated foydalanuvchi (jumladan istalgan o'quvchi)
--   BOSHQA maktab `school_id`'si bilan, ixtiyoriy `action`/`actor_name` bilan
--   SOXTA jurnal yozuvi kirita olardi → maktablararo faoliyat tasmasini
--   ifloslantirish va audit jurnalini soxtalashtirish mumkin edi.
--
-- YECHIM (ikki qatlamli):
--   1. RLS INSERT policy: faqat admin/counselor, faqat ruxsat etilgan action'lar,
--      faqat NULL yoki o'z maktab school_id'si bilan.
--   2. BEFORE INSERT trigger: authenticated insertlar uchun actor_id / actor_name /
--      school_id qiymatlarini ISHONCHLI manbadan (auth.uid() + profiles) majburan
--      to'ldiradi — client bu maydonlarni endi soxtalashtira olmaydi.
--
-- EDGE FUNKSIYALARGA TA'SIR YO'Q:
--   Edge funksiyalar service_role bilan yozadi → RLS'ni butunlay chetlab o'tadi
--   VA service_role kontekstida auth.uid() NULL → trigger ham tegmaydi.
--   Shuning uchun ularning action'lari (student_created, ai_generated, ...) bu
--   yerda whitelist'ga KERAK EMAS va ularning aniq qiymatlari saqlanib qoladi.
--
-- TO'LIQ IDEMPOTENT — qayta qo'llansa xato bermaydi.
-- ============================================================================

-- ─── 1. Identifikatorni server tomonda muhrlovchi trigger ───────────────────
-- SECURITY DEFINER — profiles RLS'ini chetlab o'tib full_name ni o'qiy oladi.
-- Faqat auth.uid() mavjud bo'lganda (ya'ni authenticated/client insert) ishlaydi;
-- service_role (edge funksiya) kontekstida auth.uid() NULL → hech narsa o'zgarmaydi.
CREATE OR REPLACE FUNCTION public.activity_log_stamp_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.actor_id   := auth.uid();
    NEW.school_id  := public.get_my_school_id();
    NEW.actor_name := (SELECT full_name FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_log_stamp_identity ON public.activity_log;
CREATE TRIGGER trg_activity_log_stamp_identity
  BEFORE INSERT ON public.activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.activity_log_stamp_identity();

-- ─── 2. Qattiqlashtirilgan INSERT policy ────────────────────────────────────
-- Eslatma: trigger yuqorida actor_id / school_id ni allaqachon to'ldiradi,
-- shuning uchun bu WITH CHECK ular uchun ortiqcha himoya (defense-in-depth).
-- `action` esa hali ham client'dan keladi — uni whitelist bilan cheklaymiz.
DROP POLICY IF EXISTS "Users log own actions" ON public.activity_log;
CREATE POLICY "Users log own actions" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (select auth.uid())
    -- Faqat admin yoki maslahatchi jurnal yoza oladi; o'quvchilar — yo'q.
    AND (
      (select public.has_role((select auth.uid()), 'admin'::app_role))
      OR (select public.has_role((select auth.uid()), 'counselor'::app_role))
    )
    -- Faqat client kodida haqiqatan ishlatiladigan action'lar.
    AND action = ANY (ARRAY[
      'message_sent',
      'task_created',
      'task_accepted',
      'task_returned',
      'task_submitted'
    ])
    -- Maktablararo soxtalashtirishning oldini olish: NULL (admin) yoki o'z maktabi.
    AND (
      school_id IS NULL
      OR school_id = (select public.get_my_school_id())
    )
  );
