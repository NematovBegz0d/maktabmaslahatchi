-- ============================================================================
-- TEST_RESULTS UNIQUE CONSTRAINT — COMPLETE-SESSION ATOMIKLIGI (2026-06-18)
--
-- MUAMMO:
--   `test_results` jadvalida (student_id, test_id) bo'yicha unique constraint
--   YO'Q edi. Shuning uchun `complete-session` funksiyasi har safar avval
--   DELETE qilib, keyin INSERT qilardi (atomik emas). Agar INSERT muvaffaqiyatsiz
--   bo'lsa, o'quvchi avvalgi natijasini ham YO'QOTARDI. Bundan tashqari, ikki
--   marta yuborilganda dublikat qatorlar paydo bo'lishi mumkin edi.
--
-- YECHIM:
--   (student_id, test_id) bo'yicha UNIQUE indeks qo'shamiz. Bu `upsert(onConflict)`
--   ni mumkin qiladi → DELETE+INSERT o'rniga atomik UPSERT, ma'lumot yo'qolish
--   oynasi yo'q, dublikat qatorlar bo'lishi mumkin emas.
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- 1) Avval mavjud dublikatlarni tozalaymiz (eng so'nggi natijani qoldiramiz).
--    Tiebreak: bir xil created_at bo'lsa, kattaroq id ni qoldiramiz.
DELETE FROM public.test_results a
USING public.test_results b
WHERE a.student_id = b.student_id
  AND a.test_id = b.test_id
  AND (
    a.created_at < b.created_at
    OR (a.created_at = b.created_at AND a.id < b.id)
  );

-- 2) UNIQUE indeks (ON CONFLICT (student_id, test_id) uchun zarur).
CREATE UNIQUE INDEX IF NOT EXISTS ux_test_results_student_test
  ON public.test_results (student_id, test_id);
