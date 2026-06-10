-- ===================================================================
-- EduLens — To'liq savollar va javob kalitlari
-- Holland (60), Ayzenk (57), Math IQ (12 + kalitlar), Big5 (15),
-- EQ (12), Liderlik (10).
-- Eslatma: apostroflardan qochish uchun dollar-quoting ($tx$...$tx$).
-- ===================================================================

-- Mavjud namunaviy savollarni tozalash (holland & eysenck to'liq almashtiriladi)
DELETE FROM public.questions
WHERE test_id IN (SELECT id FROM public.tests WHERE test_type IN ('holland', 'eysenck'));

-- -------------------------------------------------------------------
-- HOLLAND (RIASEC) — 60 savol (har yo'nalishdan 10 ta)
-- -------------------------------------------------------------------
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'holland' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', $opt$[{"value":1,"label":"Yoqadi"},{"value":0,"label":"Yoqmaydi"}]$opt$::jsonb, s
FROM t, (VALUES
  (1,  $tx$Mexanik jihozlarni ta'mirlashni yoqtirasizmi?$tx$, 'R'),
  (2,  $tx$Asbob-uskunalar bilan ishlash sizga yoqadimi?$tx$, 'R'),
  (3,  $tx$Qurilish yoki montaj ishlarida qatnashishni xohlaysizmi?$tx$, 'R'),
  (4,  $tx$Avtomobil dvigatelini o'rganish qiziqmi?$tx$, 'R'),
  (5,  $tx$Bog' yoki dalada ishlashni yoqtirasizmi?$tx$, 'R'),
  (6,  $tx$Elektr jihozlarni ulash va sozlash qiziqmi?$tx$, 'R'),
  (7,  $tx$Yog'och yoki metalldan biror narsa yasashni xohlaysizmi?$tx$, 'R'),
  (8,  $tx$Sport va jismoniy mashqlarni yoqtirasizmi?$tx$, 'R'),
  (9,  $tx$Texnik chizmalar bilan ishlash qiziqmi?$tx$, 'R'),
  (10, $tx$Robot yoki dron boshqarishni xohlaysizmi?$tx$, 'R'),
  (11, $tx$Yangi narsalarni kashf qilish sizga qiziqarlimi?$tx$, 'I'),
  (12, $tx$Ilmiy maqolalar yoki kitoblar o'qishni yoqtirasizmi?$tx$, 'I'),
  (13, $tx$Murakkab masalalarni yechishdan zavq olasizmi?$tx$, 'I'),
  (14, $tx$Kimyo yoki fizika tajribalari o'tkazish qiziqmi?$tx$, 'I'),
  (15, $tx$Tabiat hodisalarini tahlil qilishni yoqtirasizmi?$tx$, 'I'),
  (16, $tx$Matematik masalalar ustida ishlashni xohlaysizmi?$tx$, 'I'),
  (17, $tx$Voqealarning sabab-natijasini izlashni yoqtirasizmi?$tx$, 'I'),
  (18, $tx$Yangi texnologiyalarni chuqur o'rganish qiziqmi?$tx$, 'I'),
  (19, $tx$Statistik ma'lumotlarni tahlil qilishni yoqtirasizmi?$tx$, 'I'),
  (20, $tx$Koinot va astronomiyaga qiziqasizmi?$tx$, 'I'),
  (21, $tx$Rasm chizishni yoqtirasizmi?$tx$, 'A'),
  (22, $tx$Musiqa yaratish yoki ijro etish qiziqmi?$tx$, 'A'),
  (23, $tx$She'r yoki hikoya yozishni xohlaysizmi?$tx$, 'A'),
  (24, $tx$Teatr yoki kinoda rol o'ynashni yoqtirasizmi?$tx$, 'A'),
  (25, $tx$Dizayn va bezash ishlari qiziqmi?$tx$, 'A'),
  (26, $tx$Raqsga tushishni yoqtirasizmi?$tx$, 'A'),
  (27, $tx$Fotosurat yoki video olishni xohlaysizmi?$tx$, 'A'),
  (28, $tx$Yangi g'oyalar o'ylab topishni yoqtirasizmi?$tx$, 'A'),
  (29, $tx$Interyer yoki kiyim dizayniga qiziqasizmi?$tx$, 'A'),
  (30, $tx$Ijodiy loyihalar ustida ishlashni yoqtirasizmi?$tx$, 'A'),
  (31, $tx$Boshqalarga yordam berishdan zavq olasizmi?$tx$, 'S'),
  (32, $tx$O'quvchilarga dars berishni xohlaysizmi?$tx$, 'S'),
  (33, $tx$Kasal yoki keksalarga g'amxo'rlik qilish qiziqmi?$tx$, 'S'),
  (34, $tx$Insonlarning muammolarini tinglashni yoqtirasizmi?$tx$, 'S'),
  (35, $tx$Jamoaviy tadbirlar tashkil qilishni xohlaysizmi?$tx$, 'S'),
  (36, $tx$Volontyorlik faoliyatida qatnashasizmi?$tx$, 'S'),
  (37, $tx$Bolalar bilan ishlashni yoqtirasizmi?$tx$, 'S'),
  (38, $tx$Boshqalarga maslahat va yo'l-yo'riq berishni xohlaysizmi?$tx$, 'S'),
  (39, $tx$Odamlar o'rtasidagi nizolarni hal qilishga yordam berasizmi?$tx$, 'S'),
  (40, $tx$Yangi tanishlar bilan muloqot qilishni yoqtirasizmi?$tx$, 'S'),
  (41, $tx$Guruhga rahbarlik qilishni xohlaysizmi?$tx$, 'E'),
  (42, $tx$O'z biznesingizni boshlashni orzu qilasizmi?$tx$, 'E'),
  (43, $tx$Mahsulot sotish va reklama qilish qiziqmi?$tx$, 'E'),
  (44, $tx$Odamlarni o'z fikringizga ishontira olasizmi?$tx$, 'E'),
  (45, $tx$Yirik tadbirlarni boshqarishni yoqtirasizmi?$tx$, 'E'),
  (46, $tx$Notiqlik va nutq so'zlashni xohlaysizmi?$tx$, 'E'),
  (47, $tx$Pul va investitsiyalarni boshqarish qiziqmi?$tx$, 'E'),
  (48, $tx$Raqobatda g'olib bo'lishga intilasizmi?$tx$, 'E'),
  (49, $tx$Yangi loyiha tashabbusi bilan chiqishni yoqtirasizmi?$tx$, 'E'),
  (50, $tx$Muzokara olib borishni xohlaysizmi?$tx$, 'E'),
  (51, $tx$Hujjatlar bilan tartibli ishlashni yoqtirasizmi?$tx$, 'C'),
  (52, $tx$Hisob-kitob yuritish qiziqmi?$tx$, 'C'),
  (53, $tx$Ma'lumotlarni jadvalga aniq kiritishni yoqtirasizmi?$tx$, 'C'),
  (54, $tx$Reja va jadval tuzishni xohlaysizmi?$tx$, 'C'),
  (55, $tx$Qoidalarga aniq amal qilishni yoqtirasizmi?$tx$, 'C'),
  (56, $tx$Arxiv va kataloglarni tartibga solish qiziqmi?$tx$, 'C'),
  (57, $tx$Moliyaviy hisobotlar tayyorlashni yoqtirasizmi?$tx$, 'C'),
  (58, $tx$Aniqlik talab qiladigan ishlarni xohlaysizmi?$tx$, 'C'),
  (59, $tx$Ombor yoki inventar nazoratini yoqtirasizmi?$tx$, 'C'),
  (60, $tx$Buxgalteriya dasturlari bilan ishlash qiziqmi?$tx$, 'C')
) AS v(n, q, s);

-- -------------------------------------------------------------------
-- AYZENK (EPI) — 57 savol (E=24, N=24, L=9)
-- -------------------------------------------------------------------
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'eysenck' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', $opt$[{"value":1,"label":"Ha"},{"value":0,"label":"Yo'q"}]$opt$::jsonb, s
FROM t, (VALUES
  (1,  $tx$Yangi tanishlar orttirishni yoqtirasizmi?$tx$, 'E'),
  (2,  $tx$Ko'pchilik davrasida o'zingizni erkin his qilasizmi?$tx$, 'E'),
  (3,  $tx$Bazmlarda hayotning markazida bo'lishni yoqtirasizmi?$tx$, 'E'),
  (4,  $tx$Notanish odamlar bilan oson gaplashasizmi?$tx$, 'E'),
  (5,  $tx$Tez va shoshilinch qaror qabul qila olasizmi?$tx$, 'E'),
  (6,  $tx$Sayohat va sarguzashtni yoqtirasizmi?$tx$, 'E'),
  (7,  $tx$Sizning ko'p do'stlaringiz bormi?$tx$, 'E'),
  (8,  $tx$Hazil-mutoyibani yoqtirasizmi?$tx$, 'E'),
  (9,  $tx$O'zingizni faol va harakatchan deb bilasizmi?$tx$, 'E'),
  (10, $tx$Yangi joylarga borishni yoqtirasizmi?$tx$, 'E'),
  (11, $tx$Suhbatni ko'pincha o'zingiz boshlaysizmi?$tx$, 'E'),
  (12, $tx$Jamoaviy o'yinlarni yoqtirasizmi?$tx$, 'E'),
  (13, $tx$Odamlar bilan tez tanishib ketasizmi?$tx$, 'E'),
  (14, $tx$Ko'pchilik oldida nutq so'zlashdan qo'rqmaysizmi?$tx$, 'E'),
  (15, $tx$Hayotingizdagi o'zgarishlarni yoqtirasizmi?$tx$, 'E'),
  (16, $tx$Kayfiyatingiz ko'pincha ko'tarinki bo'ladimi?$tx$, 'E'),
  (17, $tx$Yangi ishga tez kirishib ketasizmi?$tx$, 'E'),
  (18, $tx$Bo'sh vaqtni odamlar davrasida o'tkazasizmi?$tx$, 'E'),
  (19, $tx$Yangi g'oyalarni darhol sinab ko'rasizmi?$tx$, 'E'),
  (20, $tx$Ochiq va samimiy gaplashasizmi?$tx$, 'E'),
  (21, $tx$Risk qilishdan qo'rqmaysizmi?$tx$, 'E'),
  (22, $tx$Tadbirlarni tashkil qilishni yoqtirasizmi?$tx$, 'E'),
  (23, $tx$O'zingizni ko'p gapiradigan odam deb bilasizmi?$tx$, 'E'),
  (24, $tx$Yangi vaziyatga tez moslashasizmi?$tx$, 'E'),
  (25, $tx$Ko'pincha tashvishlanasizmi?$tx$, 'N'),
  (26, $tx$Kayfiyatingiz tez-tez o'zgaradimi?$tx$, 'N'),
  (27, $tx$Kichik narsalardan ham xafa bo'lasizmi?$tx$, 'N'),
  (28, $tx$Tunda uzoq vaqt uxlay olmay qiynalasizmi?$tx$, 'N'),
  (29, $tx$O'zingizni ko'pincha charchagan his qilasizmi?$tx$, 'N'),
  (30, $tx$Sababsiz tushkunlikka tushib qolasizmi?$tx$, 'N'),
  (31, $tx$Ko'pincha asabiylashasizmi?$tx$, 'N'),
  (32, $tx$Kelajak haqida ko'p xavotirlanasizmi?$tx$, 'N'),
  (33, $tx$Xatolaringiz haqida uzoq o'ylab yurasizmi?$tx$, 'N'),
  (34, $tx$Ko'pincha o'zingizni yolg'iz his qilasizmi?$tx$, 'N'),
  (35, $tx$Boshqalarning fikridan qattiq ta'sirlanasizmi?$tx$, 'N'),
  (36, $tx$Ko'pincha aybdorlik hissini tuyasizmi?$tx$, 'N'),
  (37, $tx$Ko'p narsadan qo'rqasizmi?$tx$, 'N'),
  (38, $tx$Voqealarni yurakdan o'tkazadigan odammisiz?$tx$, 'N'),
  (39, $tx$Stress sizni tez bosib oladimi?$tx$, 'N'),
  (40, $tx$Ko'pincha o'zingizdan norozimisiz?$tx$, 'N'),
  (41, $tx$Tanqiddan qattiq xafa bo'lasizmi?$tx$, 'N'),
  (42, $tx$Ko'pincha bezovta uyqu ko'rasizmi?$tx$, 'N'),
  (43, $tx$Hayajon sizni tez egallab oladimi?$tx$, 'N'),
  (44, $tx$Mayda ishlardan ko'p tashvishlanasizmi?$tx$, 'N'),
  (45, $tx$Kayfiyatingiz sababsiz tushib ketadimi?$tx$, 'N'),
  (46, $tx$Asabiylik tufayli boshingiz og'riydimi?$tx$, 'N'),
  (47, $tx$Qaror qabul qilishda ko'p ikkilanasizmi?$tx$, 'N'),
  (48, $tx$O'zingizni sezgir va ta'sirchan deb bilasizmi?$tx$, 'N'),
  (49, $tx$Hayotingizda hech qachon yolg'on gapirmaganmisiz?$tx$, 'L'),
  (50, $tx$Bergan barcha va'dalaringizni doim bajarganmisiz?$tx$, 'L'),
  (51, $tx$Hech qachon biror joyga kechikkani yo'qmisiz?$tx$, 'L'),
  (52, $tx$Hech qachon hech kimni yomon ko'rmaganmisiz?$tx$, 'L'),
  (53, $tx$Doim faqat to'g'ri gapirasizmi?$tx$, 'L'),
  (54, $tx$Hech qachon maqtanmaganmisiz?$tx$, 'L'),
  (55, $tx$Barcha odatlaringiz faqat yaxshimi?$tx$, 'L'),
  (56, $tx$Hech qachon achchiqlanmaysizmi?$tx$, 'L'),
  (57, $tx$Hech qachon birovning narsasini ruxsatsiz olmaganmisiz?$tx$, 'L')
) AS v(n, q, s);

-- -------------------------------------------------------------------
-- MATEMATIK IQ — 12 savol + javob kalitlari (to'g'ri javob alohida)
-- -------------------------------------------------------------------
DELETE FROM public.questions WHERE test_id IN (SELECT id FROM public.tests WHERE test_type = 'math_iq');

WITH t AS (SELECT id FROM public.tests WHERE test_type = 'math_iq' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', o::jsonb, NULL
FROM t, (VALUES
  (1,  $tx$Ketma-ketlikni davom ettiring: 2, 4, 6, 8, ?$tx$, $o$[{"value":1,"label":"9"},{"value":2,"label":"10"},{"value":3,"label":"11"},{"value":4,"label":"12"}]$o$),
  (2,  $tx$Ketma-ketlikni davom ettiring: 1, 3, 9, 27, ?$tx$, $o$[{"value":1,"label":"54"},{"value":2,"label":"72"},{"value":3,"label":"81"},{"value":4,"label":"90"}]$o$),
  (3,  $tx$15 ning 20 foizi nechaga teng?$tx$, $o$[{"value":1,"label":"2"},{"value":2,"label":"3"},{"value":3,"label":"4"},{"value":4,"label":"5"}]$o$),
  (4,  $tx$Agar 3 ta qalam 9000 so'm bo'lsa, 5 ta qalam qancha?$tx$, $o$[{"value":1,"label":"12000"},{"value":2,"label":"13500"},{"value":3,"label":"15000"},{"value":4,"label":"18000"}]$o$),
  (5,  $tx$Ketma-ketlikni toping: 1, 1, 2, 3, 5, 8, ?$tx$, $o$[{"value":1,"label":"11"},{"value":2,"label":"12"},{"value":3,"label":"13"},{"value":4,"label":"14"}]$o$),
  (6,  $tx$x + 7 = 12 bo'lsa, x nechaga teng?$tx$, $o$[{"value":1,"label":"4"},{"value":2,"label":"5"},{"value":3,"label":"6"},{"value":4,"label":"7"}]$o$),
  (7,  $tx$Kvadratning tomoni 6 sm. Yuzasi qancha?$tx$, $o$[{"value":1,"label":"12"},{"value":2,"label":"24"},{"value":3,"label":"36"},{"value":4,"label":"48"}]$o$),
  (8,  $tx$100 dan 37 ni ayirsak nechaga teng?$tx$, $o$[{"value":1,"label":"53"},{"value":2,"label":"63"},{"value":3,"label":"67"},{"value":4,"label":"73"}]$o$),
  (9,  $tx$Ketma-ketlik: 100, 90, 81, 73, ?$tx$, $o$[{"value":1,"label":"66"},{"value":2,"label":"64"},{"value":3,"label":"68"},{"value":4,"label":"70"}]$o$),
  (10, $tx$Soat 14:45. 2 soat 30 daqiqadan keyin soat necha bo'ladi?$tx$, $o$[{"value":1,"label":"16:15"},{"value":2,"label":"17:15"},{"value":3,"label":"17:00"},{"value":4,"label":"16:45"}]$o$),
  (11, $tx$Agar A > B va B > C bo'lsa, quyidagidan qaysi biri to'g'ri?$tx$, $o$[{"value":1,"label":"C > A"},{"value":2,"label":"A > C"},{"value":3,"label":"A = C"},{"value":4,"label":"B > A"}]$o$),
  (12, $tx$24 ni 2 ga 3 marta ketma-ket bo'lsak natija nechaga teng?$tx$, $o$[{"value":1,"label":"2"},{"value":2,"label":"3"},{"value":3,"label":"4"},{"value":4,"label":"6"}]$o$)
) AS v(n, q, o);

-- Math IQ javob kalitlari (to'g'ri variant qiymati)
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'math_iq' LIMIT 1)
INSERT INTO public.question_answer_keys (question_id, correct_answer)
SELECT que.id, jsonb_build_object('v', k.correct)
FROM t
JOIN public.questions que ON que.test_id = t.id
JOIN (VALUES
  (1, 2),   -- 10
  (2, 3),   -- 81
  (3, 2),   -- 3
  (4, 3),   -- 15000
  (5, 3),   -- 13
  (6, 2),   -- 5
  (7, 3),   -- 36
  (8, 2),   -- 63
  (9, 1),   -- 66
  (10, 2),  -- 17:15
  (11, 2),  -- A > C
  (12, 2)   -- 3
) AS k(num, correct) ON k.num = que.question_number;

-- -------------------------------------------------------------------
-- BIG FIVE — 15 savol (O,C,E,A,N har biri 3 ta), shkala 1-5
-- -------------------------------------------------------------------
DELETE FROM public.questions WHERE test_id IN (SELECT id FROM public.tests WHERE test_type = 'big5');

WITH t AS (SELECT id FROM public.tests WHERE test_type = 'big5' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'scale',
  $opt$[{"value":1,"label":"Aslo"},{"value":2,"label":"Kamdan-kam"},{"value":3,"label":"Bazan"},{"value":4,"label":"Tez-tez"},{"value":5,"label":"Doim"}]$opt$::jsonb, s
FROM t, (VALUES
  (1,  $tx$Yangi g'oyalar va tajribalarga ochiqman$tx$, 'O'),
  (2,  $tx$Ijodiy va tasavvurga boy odamman$tx$, 'O'),
  (3,  $tx$Yangi narsalarni o'rganishni yoqtiraman$tx$, 'O'),
  (4,  $tx$Ishlarni rejali va tartibli bajaraman$tx$, 'C'),
  (5,  $tx$Mas'uliyatli va ishonchli odamman$tx$, 'C'),
  (6,  $tx$Maqsadlarimga intilib, oxiriga yetkazaman$tx$, 'C'),
  (7,  $tx$Odamlar bilan muloqotdan zavq olaman$tx$, 'E'),
  (8,  $tx$Davralarda faol va energiyaga to'laman$tx$, 'E'),
  (9,  $tx$Yangi tanishlar orttirishni yoqtiraman$tx$, 'E'),
  (10, $tx$Boshqalarga yordam berishga tayyorman$tx$, 'A'),
  (11, $tx$Odamlarga ishonaman va xayrixohman$tx$, 'A'),
  (12, $tx$Nizolardan ko'ra kelishuvni afzal ko'raman$tx$, 'A'),
  (13, $tx$Ko'pincha tashvish va xavotirni his qilaman$tx$, 'N'),
  (14, $tx$Kayfiyatim tez o'zgaradi$tx$, 'N'),
  (15, $tx$Stress meni tez bosadi$tx$, 'N')
) AS v(n, q, s);

-- -------------------------------------------------------------------
-- EQ (Hissiy intellekt) — 12 savol, shkala 1-5
-- -------------------------------------------------------------------
DELETE FROM public.questions WHERE test_id IN (SELECT id FROM public.tests WHERE test_type = 'eq');

WITH t AS (SELECT id FROM public.tests WHERE test_type = 'eq' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'scale',
  $opt$[{"value":1,"label":"Aslo"},{"value":2,"label":"Kamdan-kam"},{"value":3,"label":"Bazan"},{"value":4,"label":"Tez-tez"},{"value":5,"label":"Doim"}]$opt$::jsonb, 'EQ'
FROM t, (VALUES
  (1,  $tx$O'z his-tuyg'ularimni yaxshi tushunaman$tx$),
  (2,  $tx$Boshqalarning kayfiyatini sezaman$tx$),
  (3,  $tx$Jahlimni nazorat qila olaman$tx$),
  (4,  $tx$Qiyin vaziyatda ham tinch qola olaman$tx$),
  (5,  $tx$Boshqalarning his-tuyg'ulariga hamdard bo'laman$tx$),
  (6,  $tx$O'zimni qiyinchilikdan keyin tez to'play olaman$tx$),
  (7,  $tx$Suhbatdoshimni diqqat bilan tinglayman$tx$),
  (8,  $tx$Stress holatida ham to'g'ri qaror qabul qilaman$tx$),
  (9,  $tx$Boshqalarni qo'llab-quvvatlay olaman$tx$),
  (10, $tx$O'z kuchli va zaif tomonlarimni bilaman$tx$),
  (11, $tx$Nizoli vaziyatlarni tinch hal qila olaman$tx$),
  (12, $tx$O'zimni motivatsiya qila olaman$tx$)
) AS v(n, q);

-- -------------------------------------------------------------------
-- LIDERLIK — 10 savol, shkala 1-5
-- -------------------------------------------------------------------
DELETE FROM public.questions WHERE test_id IN (SELECT id FROM public.tests WHERE test_type = 'leadership');

WITH t AS (SELECT id FROM public.tests WHERE test_type = 'leadership' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'scale',
  $opt$[{"value":1,"label":"Aslo"},{"value":2,"label":"Kamdan-kam"},{"value":3,"label":"Bazan"},{"value":4,"label":"Tez-tez"},{"value":5,"label":"Doim"}]$opt$::jsonb, 'L'
FROM t, (VALUES
  (1,  $tx$Guruhda tashabbusni o'z qo'limga olaman$tx$),
  (2,  $tx$Boshqalarni umumiy maqsad sari yo'naltira olaman$tx$),
  (3,  $tx$Qiyin qarorlarni qabul qilishdan qo'rqmayman$tx$),
  (4,  $tx$Jamoamdagilarni ruhlantira olaman$tx$),
  (5,  $tx$Mas'uliyatni o'z zimmamga olaman$tx$),
  (6,  $tx$Nizolarni hal qilishda vositachilik qilaman$tx$),
  (7,  $tx$O'z fikrimni ishonch bilan himoya qilaman$tx$),
  (8,  $tx$Boshqalarning fikrini hisobga olaman$tx$),
  (9,  $tx$Vazifalarni jamoaga to'g'ri taqsimlay olaman$tx$),
  (10, $tx$Muvaffaqiyatsizlikdan keyin ham harakatni davom ettiraman$tx$)
) AS v(n, q);

-- -------------------------------------------------------------------
-- Barcha testlar uchun savollar sonini yangilash
-- -------------------------------------------------------------------
UPDATE public.tests
SET question_count = (SELECT COUNT(*) FROM public.questions WHERE test_id = tests.id);
