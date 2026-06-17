-- ============================================================================
-- MATEMATIK MANTIQ — savol bankini kengaytirish (2026-06-17)
--
-- math_iq 12 → 24 savol (ishonchliroq o'lchov uchun). Har savolda 1 ta to'g'ri
-- javob; kalitlar question_answer_keys'da (himoyalangan, faqat server o'qiydi).
-- Shuningdek "IQ" so'zi "mantiq" deb qayta nomlanadi — bu validatsiyalangan IQ
-- testi emas, balki mantiqiy qobiliyatning taxminiy ko'rsatkichi.
--
-- TO'LIQ IDEMPOTENT (13-24 qatorlar o'chirilib qayta qo'yiladi).
-- ============================================================================

-- ─── Idempotentlik: avval 13-24 savollarini tozalaymiz (kalitlar CASCADE o'chadi)
DELETE FROM public.questions
WHERE test_id IN (SELECT id FROM public.tests WHERE test_type = 'math_iq')
  AND question_number BETWEEN 13 AND 24;

-- ─── 12 ta yangi savol (13-24) ──────────────────────────────────────────────
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'math_iq' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', o::jsonb, NULL
FROM t, (VALUES
  (13, $tx$Ketma-ketlikni davom ettiring: 3, 6, 12, 24, ?$tx$, $o$[{"value":1,"label":"36"},{"value":2,"label":"42"},{"value":3,"label":"48"},{"value":4,"label":"50"}]$o$),
  (14, $tx$Ketma-ketlikni davom ettiring: 2, 5, 10, 17, 26, ?$tx$, $o$[{"value":1,"label":"35"},{"value":2,"label":"36"},{"value":3,"label":"37"},{"value":4,"label":"38"}]$o$),
  (15, $tx$5 ta ishchi 5 soatda 5 ta detal yasaydi. 10 ta ishchi 10 soatda nechta detal yasaydi?$tx$, $o$[{"value":1,"label":"10"},{"value":2,"label":"20"},{"value":3,"label":"50"},{"value":4,"label":"100"}]$o$),
  (16, $tx$200 ning 35 foizi nechaga teng?$tx$, $o$[{"value":1,"label":"60"},{"value":2,"label":"65"},{"value":3,"label":"70"},{"value":4,"label":"75"}]$o$),
  (17, $tx$Ketma-ketlikni davom ettiring: 1, 4, 9, 16, 25, ?$tx$, $o$[{"value":1,"label":"30"},{"value":2,"label":"36"},{"value":3,"label":"42"},{"value":4,"label":"49"}]$o$),
  (18, $tx$Bir qutida 3 qizil, 5 ko'k, 2 yashil shar bor. Tasodifan bittasini olganda qizil chiqishi ehtimoli necha foiz?$tx$, $o$[{"value":1,"label":"20%"},{"value":2,"label":"30%"},{"value":3,"label":"33%"},{"value":4,"label":"50%"}]$o$),
  (19, $tx$Agar bugun seshanba bo'lsa, 100 kundan keyin haftaning qaysi kuni bo'ladi?$tx$, $o$[{"value":1,"label":"Chorshanba"},{"value":2,"label":"Payshanba"},{"value":3,"label":"Juma"},{"value":4,"label":"Shanba"}]$o$),
  (20, $tx$Ketma-ketlikni davom ettiring: 2, 6, 12, 20, 30, ?$tx$, $o$[{"value":1,"label":"40"},{"value":2,"label":"42"},{"value":3,"label":"44"},{"value":4,"label":"46"}]$o$),
  (21, $tx$x musbat son va x² = 49 bo'lsa, x nechaga teng?$tx$, $o$[{"value":1,"label":"6"},{"value":2,"label":"7"},{"value":3,"label":"8"},{"value":4,"label":"9"}]$o$),
  (22, $tx$Mahsulot 20000 so'm edi, narxi 25% ga oshdi. Yangi narx qancha?$tx$, $o$[{"value":1,"label":"22500"},{"value":2,"label":"24000"},{"value":3,"label":"25000"},{"value":4,"label":"26000"}]$o$),
  (23, $tx$Ketma-ketlikni davom ettiring: 64, 32, 16, 8, ?$tx$, $o$[{"value":1,"label":"2"},{"value":2,"label":"4"},{"value":3,"label":"6"},{"value":4,"label":"8"}]$o$),
  (24, $tx$Uchburchakning ichki burchaklari yig'indisi necha gradusga teng?$tx$, $o$[{"value":1,"label":"90"},{"value":2,"label":"180"},{"value":3,"label":"270"},{"value":4,"label":"360"}]$o$)
) AS v(n, q, o);

-- ─── Javob kalitlari (to'g'ri variant qiymati) ──────────────────────────────
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'math_iq' LIMIT 1)
INSERT INTO public.question_answer_keys (question_id, correct_answer)
SELECT que.id, jsonb_build_object('v', k.correct)
FROM t
JOIN public.questions que ON que.test_id = t.id
JOIN (VALUES
  (13, 3),  -- 48
  (14, 3),  -- 37
  (15, 2),  -- 20
  (16, 3),  -- 70
  (17, 2),  -- 36
  (18, 2),  -- 30%
  (19, 2),  -- Payshanba (100 mod 7 = 2)
  (20, 2),  -- 42
  (21, 2),  -- 7
  (22, 3),  -- 25000
  (23, 2),  -- 4
  (24, 2)   -- 180
) AS k(num, correct) ON k.num = que.question_number
ON CONFLICT (question_id) DO UPDATE SET correct_answer = EXCLUDED.correct_answer;

-- ─── question_count yangilash ───────────────────────────────────────────────
UPDATE public.tests
SET question_count = (SELECT count(*) FROM public.questions WHERE test_id = tests.id)
WHERE test_type = 'math_iq';

-- ─── "IQ" → "mantiq" qayta nomlash (validatsiyalangan IQ testi emas) ────────
UPDATE public.tests SET name_uz = 'Matematik mantiq'
WHERE test_type = 'math_iq' AND name_uz = 'Matematik IQ';
UPDATE public.tests SET name_uz = 'Vizual mantiq (Raven)'
WHERE test_type = 'raven' AND name_uz = 'Raven IQ';
