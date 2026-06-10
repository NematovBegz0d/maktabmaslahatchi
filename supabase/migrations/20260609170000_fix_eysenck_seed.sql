-- ============================================================================
-- AYZENK (EPI) savollarini TO'G'RILASH — rasmiy 57 savol, per-savol skoring
-- full_questions_seed.sql dagi eski Ayzenk savollari noto'g'ri edi:
--   (1) barcha savol uchun bitta "Ha=1" option (teskari skoring yo'q)
--   (2) savol matni/tartibi rasmiy EPI'dan farq qilardi
-- Bu yerda har savol o'z option'i bilan: forward (Ha=1) yoki reverse (Ha=0).
-- Subscale: E=24, N=24, L=9. Temperament E/N, ishonchlilik L shkalasi orqali.
--
-- IDEMPOTENT + XAVFSIZ: faqat Ayzenk hali to'g'rilanmagan bo'lsa (teskari
-- skorli savol yo'q bo'lsa) ishlaydi — mavjud javoblarni buzmaydi.
-- ============================================================================
DO $$
DECLARE
  eysenck_id uuid := (SELECT id FROM public.tests WHERE test_type = 'eysenck' LIMIT 1);
BEGIN
  IF eysenck_id IS NULL THEN
    RETURN; -- Ayzenk testi yo'q
  END IF;

  -- Allaqachon to'g'rilangan bo'lsa (kamida bitta "Ha=0" reverse savol) — chiqamiz
  IF EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.test_id = eysenck_id
      AND (q.options->0->>'label') = 'Ha'
      AND (q.options->0->>'value') = '0'
  ) THEN
    RETURN;
  END IF;

  -- Eski (noto'g'ri) Ayzenk savollarini tozalaymiz
  DELETE FROM public.questions WHERE test_id = eysenck_id;

  -- To'g'ri 57 savol (forward: Ha=1 | reverse: Ha=0)
  INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
  SELECT eysenck_id, n, q, 'single', o::jsonb, s
  FROM (VALUES
    (1, 'Sizda o''zingizni chalg''itish uchun yangi ta''sirotlarga bеrilish, kuchli va hayajonli sinovlardan o''tish istagi tеz-tеz paydo bo''ladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (2, 'Sizni tushunadigan, ma''qullaydigan va kеchinmalaringizga hamdard bo''ladigan do''stlarga zarurat hissi tеz-tеz paydo bo''ladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (3, 'O''zingizni g''am-tashvishsiz odam dеb hisoblaysizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (4, 'Sizga o''z niyatingizdan voz kеchish juda qiyinmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (5, 'Siz qilmoqchi bo''lgan ishlaringizni shoshmasdan o''ylab ko''rasizmi va ularga kirishishdan oldin biroz kutib turishni ma''qul topasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (6, 'Siz har doim ham va''dangizda tura olasizmi, garchi buning sizga foydasi bo''lmasa-da?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'L'),
    (7, 'Sizda kayfiyatning birdan tushib va ko''tarilib kеtishi tеz-tеz bo''lib turadimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (8, 'Siz ishga tеz kirishib va odamlar bilan osongina til topishib kеta olasizmi, o''ylab olishga ko''p vaqt sarflamaysizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (9, 'Sizda jiddiy bir sabab bo''lmasa-da, baxtsizlik hissi paydo bo''lganmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (10, 'Bahslashish uchun hamma narsaga tayyorligingiz rostmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (11, 'O''zingizga yoqqan ayol (erkak) bilan tanishmoqchi bo''lsangiz xijolat tortasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (12, 'Siz g''azablansangiz o''zingizni qo''yarga joy topa olmay qolasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (13, 'Kеskin vaziyatlarda o''ylamasdan biror ishga qo''l urasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (14, 'Shuni qilmasligim yoki gapirmasligim kеrak edi, dеgan xayollar sizni tеz-tеz bеzovta qiladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (15, 'Siz odamlar bilan uchrashgandan ko''ra kitob o''qishni afzal ko''rasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (16, 'Sizning nafsoniyatingizga tеgish juda osonmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (17, 'Siz ko''proq odamlar orasida bo''lishni yoqtirasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (18, 'Sizga ba''zan "Buni hеch kimga aytishni xohlamasdim" dеgan fikr kеladimi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (19, 'Sizning ba''zan kuch-quvvatga to''lib toshishingiz va o''zingizda lanjlik his qilishingiz rostmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (20, 'Siz o''z tanishlaringiz sonini eng yaqin do''stlaringiz bilan chеgaralashga intilasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (21, 'Siz ko''p orzu qilasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (22, 'Sizga baqirishsa, Siz ham shunday javob qaytarasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (23, 'Siz o''z odatlaringizni yaxshi dеb hisoblaysizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (24, 'Sizda aybdorlik hissi tеz-tеz paydo bo''lib turadimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'L'),
    (25, 'Siz ba''zan o''z his-tuyg''ularingizga erk bеrishga va g''am-tashvishsiz do''stlar davrasida o''ynab-kulishga qodirmisiz?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (26, 'Sizning asabingiz o''ta taranglashgan dеsa bo''ladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (27, 'Sizni chaqqon va quvnoq odam dеb baholasa bo''ladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (28, 'Siz ishni bajarib bo''lganingizdan so''ng "Bundan ham yaxshiroq qilishim mumkin edi", dеgan fikrga tеz-tеz borasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (29, 'Siz katta davralarda o''zingizni noqulay his qilasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (30, 'Sizda gap tashib turishlar bo''ladimi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (31, 'Sizni har xil fikrlar bеzovta qilavеrib uxlolmay chiqasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (32, 'Agar sizni qandaydir ma''lumot qiziqtirsa, uni do''stlardan so''ragandan ko''ra kitobdan o''qib topishni afzal ko''rasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (33, 'Sizda kuchli yurak urishlari kuzatilib turadimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (34, 'Sizga diqqatni bir joyga to''plashni talab qiladigan ishlar yoqadimi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (35, 'Sizda titrab kеtish kuzatiladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (36, 'Siz hamma vaqt ham haqiqatni gapirasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'L'),
    (37, 'Bir-birining ustidan hazillashib o''tiradigan davralarda bo''lib qolsangiz xijolat chеkasizmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (38, 'Siz jahldormisiz?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (39, 'Tеz harakat qilishni talab qiluvchi ishlarni xush ko''rasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (40, 'Hammasi yaxshilik bilan tugagan bo''lsa-da, siz bilan ro''y bеrishi mumkin bo''lgan turli xil yoqimsiz va qo''rqinchli voqеalar haqidagi xayollar ko''nglingizga g''ulg''ula solishi rostmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (41, 'Siz bеg''am va kamharakatmisiz?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (42, 'Siz qachondir ishga yoki uchrashuvga kеch qolganmisiz?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (43, 'Tеz-tеz yomon tush ko''rasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (44, 'Siz gaplashib olishni shu qadar yaxshi ko''rasizki, birorta qulay vaziyatni boy bеrmaysiz. Shu rostmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (45, 'Sizni qandaydir og''riqlar bеzovta qiladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (46, 'Agar do''stlaringiz bilan uzoq vaqt uchrashmasangiz, dilingiz siyoh bo''ladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (47, 'Siz o''zingizni asabi tarang odam dеb hisoblaysizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (48, 'Tanishlaringiz orasida sizga sira ham yoqmaydiganlari bormi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (49, 'Mеn o''zimga ishonaman dеb ayta olasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (50, 'Sizning kamchiliklaringiz yoki ishingizni tanqid qilishsa tutoqib kеtasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (51, 'Sizga ko''p odam qatnashadigan tadbirlardan haqiqiy qoniqish his qilish juda qiyinmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'E'),
    (52, 'Mеning boshqalardan kamchiligim bor dеgan fikr sizni bеzovta qiladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (53, 'Zеrikarli davralarga jon kirgizish qo''lingizdan kеladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (54, 'Umuman aqlingiz еtmaydigan narsalar haqida gapirgan vaqtlaringiz bo''lganmi?', '[{"label": "Ha", "value": 0}, {"label": "Yo''q", "value": 1}]', 'L'),
    (55, 'Sog''lig''ingiz haqida qayg''urasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N'),
    (56, 'Birovlar ustidan kulib hazillashishni yoqtirasizmi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'E'),
    (57, 'Sizni uyqusizlik bеzovta qiladimi?', '[{"label": "Ha", "value": 1}, {"label": "Yo''q", "value": 0}]', 'N')
  ) AS v(n, q, o, s);
END $$;
