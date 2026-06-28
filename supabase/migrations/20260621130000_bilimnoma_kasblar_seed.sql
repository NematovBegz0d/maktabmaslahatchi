-- ============================================================================
-- BILIMNOMA — "Kasblar" bo'limi SEED (2026-06-21)
--
--   6 toifa + 35 kasb. 7-11 sinf o'quvchilari uchun mo'ljallangan.
--   Har bir yozuvda structured `details` (jsonb): what / skills / subjects /
--   study / fun_fact (+ ba'zilarida extra_label/extra). `demand` — talab darajasi.
--
--   IDEMPOTENT: har INSERT `WHERE NOT EXISTS` bilan himoyalangan — qayta ishga
--   tushsa dublikat yaratmaydi. Matnlar dollar-quote ($q$, $j$) ichida — o'zbek
--   apostroflari erkin. JSON qiymatlarida ikkilik tirnoq (") ishlatilmaydi.
-- ============================================================================

-- ─── TOIFALAR ───────────────────────────────────────────────────────────────
INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$Kelajak va raqamli kasblar$q$, '🚀',
       $q$Texnologiya bilan bog'liq, talab tez o'sayotgan zamonaviy kasblar.$q$, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$);

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$Doim ehtiyojli kasblar$q$, '💪',
       $q$Jamiyatga har doim kerak bo'ladigan barqaror kasblar.$q$, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$);

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$An'anaviy kasblar$q$, '🌾',
       $q$Asrlardan beri davom etib kelayotgan asosiy kasblar.$q$, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$);

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$Milliy hunarlar$q$, '🏺',
       $q$O'zbek xalqining boy hunarmandchilik merosi.$q$, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$);

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$Yo'qolayotgan kasblar$q$, '⏳',
       $q$Texnologiya tufayli kamayib yoki yo'qolib borayotgan kasblar.$q$, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$);

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'kasblar', $q$Ijodiy va media kasblar$q$, '🎨',
       $q$Ijod, dizayn va axborot bilan bog'liq kasblar.$q$, 6
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$);

-- ─── Yordamchi: yozuv qo'shish makrosi o'rniga to'g'ridan-to'g'ri INSERT'lar ──
-- category_id toifa sarlavhasi bo'yicha topiladi (yuqorida qo'shilgan).

-- ====== 1. KELAJAK VA RAQAMLI KASBLAR ======================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Sun'iy intellekt muhandisi$q$, '🤖', 'growing',
  $q$Kompyuterlarni «o'ylash» va o'rganishga o'rgatadigan mutaxassis.$q$,
  $j${"what":"Ma'lumotlardan o'rganadigan dasturlar (modellar) yaratadi — ovozni taniydigan, rasmni ajrata oladigan yoki kasallikni aniqlaydigan tizimlar.","skills":"Matematika va mantiq, dasturlash, sabr bilan tajriba o'tkazish.","subjects":"Matematika, Informatika, Ingliz tili, Fizika.","study":"Sun'iy intellekt, kompyuter injiniringi yoki amaliy matematika yo'nalishlari.","fun_fact":"Telefoningizdagi yuzni tanish va tarjimon ilovalar — aynan AI muhandislari mehnati natijasi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Sun'iy intellekt muhandisi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Ma'lumotlar tahlilchisi (Data Scientist)$q$, '📊', 'growing',
  $q$Katta hajmdagi raqamlardan foydali xulosalar topadigan mutaxassis.$q$,
  $j${"what":"Ma'lumotlarni yig'adi, tozalaydi va undan qonuniyat izlaydi; kompaniyalarga to'g'ri qaror qabul qilishda yordam beradi.","skills":"Statistika, dasturlash (Python), diagrammalar bilan ishlash, qiziquvchanlik.","subjects":"Matematika, Informatika, Ingliz tili.","study":"Ma'lumotlar fani, statistika yoki axborot texnologiyalari.","fun_fact":"Bu kasb ba'zan «XXI asrning eng jozibali kasbi» deb ataladi."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Ma'lumotlar tahlilchisi (Data Scientist)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Kiberxavfsizlik mutaxassisi$q$, '🛡️', 'growing',
  $q$Internet va kompyuterlarni xakerlardan himoya qiladi.$q$,
  $j${"what":"Tizimlardagi zaif joylarni topadi va yopadi, hujumlarni qaytaradi, ma'lumotlarni o'g'irlanishdan saqlaydi.","skills":"Tarmoqlarni tushunish, mantiqiy fikrlash, ehtiyotkorlik.","subjects":"Informatika, Matematika, Ingliz tili.","study":"Axborot xavfsizligi, kompyuter tarmoqlari.","fun_fact":"«Oq shlyapali xaker» — tizimni himoya qilish uchun uni qonuniy ravishda buzib ko'radigan mutaxassis."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Kiberxavfsizlik mutaxassisi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Robototexnika muhandisi$q$, '⚙️', 'growing',
  $q$Robotlar va avtomatlashtirilgan qurilmalarni loyihalaydi.$q$,
  $j${"what":"Robotning «tanasi» (mexanika) va «miyasi» (dastur)ni birga yaratadi — zavod robotlaridan dronlargacha.","skills":"Fizika, dasturlash, qo'l mehnati va konstruksiyalash.","subjects":"Fizika, Matematika, Informatika, Chizmachilik.","study":"Mexatronika va robototexnika, muhandislik.","fun_fact":"Zamonaviy zavodlarda mahsulotning katta qismini robotlar yig'adi."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Robototexnika muhandisi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Dasturchi (dasturiy ta'minot muhandisi)$q$, '💻', 'growing',
  $q$Ilova, sayt va dasturlarni yaratadigan mutaxassis.$q$,
  $j${"what":"Kod yozib veb-saytlar, mobil ilovalar va o'yinlar ishlab chiqadi, ularni sinaydi va yangilaydi.","skills":"Mantiqiy fikrlash, dasturlash tillari, muammoni qismlarga bo'lib yechish.","subjects":"Informatika, Matematika, Ingliz tili.","study":"Dasturiy injiniring, kompyuter fanlari.","fun_fact":"Eng ko'p ishlatiladigan ilovalar ortida — odatda butun dasturchilar jamoasi turadi."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Dasturchi (dasturiy ta'minot muhandisi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$UX/UI dizayner$q$, '🖌️', 'growing',
  $q$Ilova va saytlarni qulay hamda chiroyli qiladigan dizayner.$q$,
  $j${"what":"Foydalanuvchi tugmani qayerda kutishini o'ylab, ekranlarni qulay va tushunarli joylashtiradi.","skills":"Estetik did, foydalanuvchini tushunish, dizayn dasturlari.","subjects":"San'at/Chizmachilik, Informatika, Ingliz tili.","study":"Dizayn, inson-kompyuter o'zaro aloqasi.","fun_fact":"Yaxshi dizayn ko'rinmaydi: hamma narsa o'z-o'zidan tushunarli bo'lganda dizayner ishini bajargan bo'ladi."}$j$::jsonb, 6
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$UX/UI dizayner$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Kelajak va raqamli kasblar$q$),
  $q$Dron operatori$q$, '🚁', 'growing',
  $q$Uchuvchi dronlarni boshqarib, havodan suratga oladi va ma'lumot yig'adi.$q$,
  $j${"what":"Qishloq xo'jaligi, qurilish va kartografiyada dron yordamida monitoring va aerofotosurat qiladi.","skills":"Diqqat, texnikani tushunish, qo'l-ko'z muvofiqligi.","subjects":"Fizika, Informatika, Geografiya.","study":"Aviatexnika, geodeziya yoki maxsus sertifikatli kurslar.","fun_fact":"Dronlar ekinlarning kasalligini ko'pincha odamdan ertaroq sezadi."}$j$::jsonb, 7
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Dron operatori$q$);

-- ====== 2. DOIM EHTIYOJLI KASBLAR ==========================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Shifokor$q$, '🩺', 'stable',
  $q$Odamlarni davolaydi va sog'lig'ini saqlaydi.$q$,
  $j${"what":"Kasallikni aniqlaydi, davolaydi va uning oldini olish bo'yicha maslahat beradi.","skills":"Chuqur bilim, mas'uliyat, hamdardlik, sabr.","subjects":"Biologiya, Kimyo, Fizika.","study":"Tibbiyot instituti yoki universiteti.","fun_fact":"Shifokor butun umri davomida o'qishni to'xtatmaydi — tibbiyot doimo yangilanib turadi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Shifokor$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Hamshira$q$, '💉', 'growing',
  $q$Bemorlarni parvarish qiladi va shifokorga yordam beradi.$q$,
  $j${"what":"Dori beradi, bemor holatini kuzatadi, muolajalarni bajaradi va g'amxo'rlik qiladi.","skills":"G'amxo'rlik, diqqat, chidamlilik, mas'uliyat.","subjects":"Biologiya, Kimyo.","study":"Tibbiyot kolleji.","fun_fact":"Hamshiralar kasalxonada bemor bilan eng ko'p vaqt o'tkazadigan insonlardir."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Hamshira$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$O'qituvchi$q$, '📚', 'stable',
  $q$Bilim beradi va yosh avlodni tarbiyalaydi.$q$,
  $j${"what":"Darslarni tushuntiradi, o'quvchilarni rag'batlantiradi, ularning rivojini kuzatadi.","skills":"Bilim, sabr, ravon nutq, bolalarni tushunish.","subjects":"O'zi tanlagan fan, Pedagogika, Psixologiya.","study":"Pedagogika universiteti.","fun_fact":"Har qanday kasb egasi — shifokormi yoki muhandismi — avval o'qituvchidan ta'lim olgan."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$O'qituvchi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Quruvchi-muhandis$q$, '🏗️', 'stable',
  $q$Bino, ko'prik va yo'llarni loyihalaydi va quradi.$q$,
  $j${"what":"Inshootning chizmasini tayyorlaydi, mustahkamligini hisoblaydi va qurilish jarayonini boshqaradi.","skills":"Matematika, fazoviy tasavvur, mas'uliyat.","subjects":"Matematika, Fizika, Chizmachilik.","study":"Qurilish muhandisligi, arxitektura.","fun_fact":"Bitta noto'g'ri hisob butun binoga ta'sir qiladi — shuning uchun aniqlik hayotiy muhim."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Quruvchi-muhandis$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Elektrik$q$, '⚡', 'stable',
  $q$Elektr tarmoqlari va qurilmalarini o'rnatadi va ta'mirlaydi.$q$,
  $j${"what":"Simlarni ulaydi, nosozlikni topadi va qurilmalarning xavfsiz ishlashini ta'minlaydi.","skills":"Aniqlik, xavfsizlik qoidalarini bilish, qo'l mahorati.","subjects":"Fizika, Matematika.","study":"Kasb-hunar kolleji.","fun_fact":"Elektr xavfsiz ko'rinadi, lekin xato hayotga xavf soladi — shuning uchun elektrik qoidalarni qattiq biladi."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Elektrik$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Oshpaz$q$, '👨‍🍳', 'stable',
  $q$Mazali va sog'lom taomlar tayyorlaydi.$q$,
  $j${"what":"Retseptlar yaratadi, taomni pishiradi va bezaydi, oshxona ishini tashkil qiladi.","skills":"Ta'm-bilish, tezlik, ozodalik, ijodkorlik.","subjects":"Biologiya, Kimyo, Texnologiya.","study":"Pazandachilik kolleji yoki amaliyot.","fun_fact":"Bugun mashhur oshpazlar xuddi yulduzlar kabi taniqli bo'lib ketgan."}$j$::jsonb, 6
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Oshpaz$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Doim ehtiyojli kasblar$q$),
  $q$Haydovchi (logistika)$q$, '🚚', 'stable',
  $q$Odamlar va yuklarni xavfsiz manzilga yetkazadi.$q$,
  $j${"what":"Transport vositasini boshqaradi, marshrutni rejalashtiradi, yukni butun saqlaydi.","skills":"Diqqat, mas'uliyat, yo'l qoidalarini bilish.","subjects":"Geografiya, Fizika.","study":"Haydovchilik kurslari, logistika yo'nalishi.","fun_fact":"Kelajakda o'zi yuradigan mashinalar paydo bo'lsa-da, murakkab yuklarda inson haydovchi zarur bo'ladi."}$j$::jsonb, 7
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Haydovchi (logistika)$q$);

-- ====== 3. AN'ANAVIY KASBLAR ===============================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$),
  $q$Fermer (dehqon)$q$, '🌱', 'stable',
  $q$Yer va o'simliklardan oziq-ovqat yetishtiradi.$q$,
  $j${"what":"Ekin ekadi, parvarish qiladi, hosil yig'adi va zamonaviy texnologiyadan foydalanadi.","skills":"Mehnatsevarlik, tabiatni tushunish, rejalashtirish.","subjects":"Biologiya, Kimyo, Geografiya.","study":"Qishloq xo'jaligi yo'nalishi yoki amaliyot.","fun_fact":"Zamonaviy fermerlar dron va datchiklardan foydalanadi — bunga «aqlli dehqonchilik» deyiladi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Fermer (dehqon)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$),
  $q$Chorvador$q$, '🐄', 'stable',
  $q$Hayvonlarni boqadi va parvarishlaydi.$q$,
  $j${"what":"Mol, qo'y yoki parrandalarni yetishtiradi; ulardan sut, go'sht va jun oladi.","skills":"G'amxo'rlik, chidam, hayvonlarni bilish.","subjects":"Biologiya.","study":"Veterinariya yo'nalishi yoki amaliyot.","fun_fact":"Sog'lom chorva — sog'lom va sifatli oziq-ovqat manbai."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Chorvador$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$),
  $q$Tikuvchi$q$, '🧵', 'stable',
  $q$Kiyim va matodan buyumlar tikadi.$q$,
  $j${"what":"O'lcham oladi, matoni bichadi va tikadi, kiyimni tuzatadi.","skills":"Aniqlik, did, sabr, qo'l mahorati.","subjects":"Texnologiya, Chizmachilik, San'at.","study":"Kasb-hunar kolleji.","fun_fact":"Deyarli har bir mashhur kiyim brendi bir kishilik tikuvchilikdan boshlangan."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Tikuvchi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$),
  $q$Duradgor (mebelchi)$q$, '🪵', 'stable',
  $q$Yog'ochdan mebel va buyumlar yasaydi.$q$,
  $j${"what":"Stol, stul, eshik va shkaf kabi buyumlarni o'lchab, kesib, yig'adi.","skills":"Qo'l mahorati, fazoviy tasavvur, aniqlik.","subjects":"Chizmachilik, Matematika, Texnologiya.","study":"Kasb-hunar kolleji.","fun_fact":"Mohir duradgor ba'zan bitta mixsiz ham mustahkam buyum yasay oladi."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Duradgor (mebelchi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$An'anaviy kasblar$q$),
  $q$Novvoy$q$, '🥖', 'stable',
  $q$Non va xamir mahsulotlari yopadi.$q$,
  $j${"what":"Xamir qoradi, non va shirinliklar tayyorlaydi, tandir yoki pechda yopadi.","skills":"Erta turish, aniqlik, ozodalik.","subjects":"Kimyo, Biologiya.","study":"Amaliyot yoki pazandachilik kursi.","fun_fact":"Non yopish — eng qadimgi kasblardan biri, ming yillar davomida deyarli o'zgarmagan."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Novvoy$q$);

-- ====== 4. MILLIY HUNARLAR =================================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Kulol (kulolchilik)$q$, '🏺', 'stable',
  $q$Loydan idish va buyumlar yasaydigan milliy hunarmand.$q$,
  $j${"what":"Loyni charxda aylantirib idish shakllantiradi, naqsh beradi va o'choqda pishiradi.","skills":"Qo'l mahorati, sabr, badiiy did.","subjects":"San'at, Texnologiya, Kimyo.","study":"Usta-shogird an'anasi, hunarmandchilik markazlari.","extra_label":"Tarixi va makoni","extra":"Rishton (Farg'ona vodiysi) kulolchiligi butun dunyoga mashhur — ko'k va yashil rangli koshinlari bilan ajralib turadi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Kulol (kulolchilik)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Zardo'z (zardo'zlik)$q$, '🪡', 'stable',
  $q$Oltin va kumush iplar bilan kashta tikadigan hunarmand.$q$,
  $j${"what":"Chopon, do'ppi va turli buyumlarga zar iplar bilan nafis naqsh tikadi.","skills":"Nihoyatda aniq qo'l, sabr, badiiy did.","subjects":"San'at, Texnologiya.","study":"Usta-shogird an'anasi, hunarmandchilik maktablari.","extra_label":"Tarixi va makoni","extra":"Buxoro zardo'zligi asrlar davomida amirlar va elchilar uchun kiyim tikkan; bugun ham yuqori qadrlanadi."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Zardo'z (zardo'zlik)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Misgar (misgarlik)$q$, '🔨', 'stable',
  $q$Misdan idish va buyumlar yasaydigan usta.$q$,
  $j${"what":"Mis varaqni bolg'a bilan urib shakl beradi va unga naqsh soladi.","skills":"Kuch, aniqlik, badiiy did.","subjects":"San'at, Fizika, Texnologiya.","study":"Usta-shogird an'anasi.","extra_label":"Tarixi va makoni","extra":"Buxoro va Qarshi misgarligi naqshli mis laganlari bilan mashhur."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Misgar (misgarlik)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Ganchkor (ganch o'ymakorligi)$q$, '🕌', 'stable',
  $q$Ganchdan naqshli bezaklar o'yadigan hunarmand.$q$,
  $j${"what":"Devor va shiftlarga ganchdan nafis naqsh va panjara (panjara) yasaydi.","skills":"Nozik qo'l, badiiy tasavvur, sabr.","subjects":"San'at, Chizmachilik, Geometriya.","study":"Usta-shogird, me'moriy bezak maktablari.","extra_label":"Tarixi va makoni","extra":"Buxoro va Xiva saroylaridagi ganch naqshlari — milliy me'morchilik durdonalaridan."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Ganchkor (ganch o'ymakorligi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Naqqosh (naqqoshlik)$q$, '🪷', 'stable',
  $q$Yog'och, ganch va qog'ozga milliy naqshlar chizadigan rassom-hunarmand.$q$,
  $j${"what":"Eshik, ustun, kitob va shiftlarga gul hamda islimiy naqshlar soladi.","skills":"Chizish mahorati, rang hissi, sabr.","subjects":"San'at, Chizmachilik, Geometriya.","study":"Hunarmandchilik va san'at maktablari.","extra_label":"Tarixi va makoni","extra":"Naqqoshlik milliy me'morchilikning ajralmas qismi; har bir naqshning o'z ma'nosi bor."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Naqqosh (naqqoshlik)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Milliy hunarlar$q$),
  $q$Atlas to'quvchi (ipakchilik)$q$, '🧶', 'stable',
  $q$Pilladan ipak va atlas-adras mato to'qiydigan hunarmand.$q$,
  $j${"what":"Pilladan ip ochadi, uni bo'yaydi va dastgohda atlas-adras to'qiydi.","skills":"Sabr, rang uyg'unligi, qo'l mahorati.","subjects":"Texnologiya, Kimyo, San'at.","study":"Hunarmandchilik markazlari, amaliyot.","extra_label":"Tarixi va makoni","extra":"Marg'ilon atlasi va «xon-atlas» butun dunyoga tanilgan — Buyuk ipak yo'li merosi."}$j$::jsonb, 6
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Atlas to'quvchi (ipakchilik)$q$);

-- ====== 5. YO'QOLAYOTGAN KASBLAR ===========================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$),
  $q$Telefon kommutatori operatori$q$, '☎️', 'declining',
  $q$Ilgari telefon qo'ng'iroqlarini qo'lda ulab beradigan kasb.$q$,
  $j${"what":"Bir abonentni boshqasiga sim yordamida qo'lda ulab, suhbat o'rnatib berardi.","fun_fact":"Bir operator yuzlab simlarni yodda saqlab, ularni juda tez ulashi kerak edi.","extra_label":"Nega yo'qolyapti?","extra":"Avtomatik stansiyalar va mobil aloqa qo'lda ulashni keraksiz qildi. O'rniga aloqa muhandisi va tarmoq mutaxassisi keldi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Telefon kommutatori operatori$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$),
  $q$Mashinkachi (yozuv mashinkasi)$q$, '⌨️', 'declining',
  $q$Yozuv mashinkasida hujjat va matn teradigan kasb.$q$,
  $j${"what":"Qo'lyozma matnlarni mexanik yozuv mashinkasida toza qilib chop etardi.","fun_fact":"Klaviaturadagi harflar joylashuvi (QWERTY) aynan yozuv mashinkasidan meros qolgan.","extra_label":"Nega yo'qolyapti?","extra":"Kompyuter va printer mashinkani siqib chiqardi. Endi kompyuterda matn terish deyarli hammaning ko'nikmasi."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Mashinkachi (yozuv mashinkasi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$),
  $q$Kinomexanik$q$, '🎞️', 'declining',
  $q$Kinoteatrda plyonkali filmni proyektorda namoyish etgan mutaxassis.$q$,
  $j${"what":"Katta plyonka g'altaklarini proyektorga o'rnatib, filmni ekranga chiqarardi.","skills":"Texnikani bilish, diqqat, aniq vaqtlash.","extra_label":"Nega yo'qolyapti?","extra":"Raqamli kino va proyektorlar plyonkani almashtirdi. O'rniga raqamli kino texniki keldi."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Kinomexanik$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$),
  $q$Fonarchi (ko'cha chiroqchisi)$q$, '🏮', 'declining',
  $q$Kechqurun ko'cha chiroqlarini yoqib, tongda o'chirib yurgan kasb.$q$,
  $j${"what":"Gaz yoki neftli ko'cha fonarlarini har kuni qo'lda yoqar va o'chirardi.","fun_fact":"Ko'plab eski ertak va hikoyalarda fonarchi obrazi uchraydi.","extra_label":"Nega yo'qoldi?","extra":"Elektr va avtomatik yoritish tizimlari bu kasbni butunlay yo'qotdi."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Fonarchi (ko'cha chiroqchisi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Yo'qolayotgan kasblar$q$),
  $q$Soatsoz va radiousta$q$, '🔧', 'declining',
  $q$Mexanik soat va radiolarni ta'mirlaydigan usta.$q$,
  $j${"what":"Mayda tishli g'ildiraklar va detallarni tuzatib, qurilmani qayta ishga tushirardi.","skills":"Nihoyatda nozik qo'l, sabr, diqqat.","extra_label":"Nega kamayyapti?","extra":"Arzon elektron soat va bir martalik qurilmalar ta'mirni keraksiz qildi. Ammo qadimiy soatlar uchun ustalar hamon qadrli."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Soatsoz va radiousta$q$);

-- ====== 6. IJODIY VA MEDIA KASBLAR =========================================
INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$),
  $q$Jurnalist$q$, '📰', 'stable',
  $q$Voqealarni o'rganib, xalqqa haqqoniy xabar yetkazadi.$q$,
  $j${"what":"Ma'lumot to'playdi, intervyu oladi, maqola va reportaj tayyorlaydi.","skills":"Yozish, savol berish, haqiqatni tekshirish, jasorat.","subjects":"Ona tili va adabiyot, Tarix, Ingliz tili.","study":"Jurnalistika fakulteti.","fun_fact":"Yaxshi jurnalist har bir ma'lumotni kamida ikki manbadan tekshiradi."}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Jurnalist$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$),
  $q$Kontent-kreator (SMM mutaxassisi)$q$, '📱', 'growing',
  $q$Ijtimoiy tarmoqlar uchun qiziqarli kontent yaratadi.$q$,
  $j${"what":"Video, post va stori tayyorlaydi, auditoriya bilan ishlaydi, brend yoki g'oyani tanitadi.","skills":"Ijodkorlik, dizayn va montaj, trendlarni sezish.","subjects":"Ona tili, San'at, Informatika, Ingliz tili.","study":"Marketing, jurnalistika yoki mustaqil o'rganish.","fun_fact":"Bu kasb 20 yil oldin umuman mavjud emas edi."}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Kontent-kreator (SMM mutaxassisi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$),
  $q$Grafik dizayner$q$, '🎨', 'growing',
  $q$Logotip, reklama va bezaklarni yaratadigan ijodkor.$q$,
  $j${"what":"Brend uchun logotip, plakat, qadoq va ijtimoiy tarmoq grafikasini yaratadi.","skills":"Badiiy did, rang va shrift hissi, dizayn dasturlari.","subjects":"San'at, Chizmachilik, Informatika.","study":"Dizayn yo'nalishi.","fun_fact":"Atrofingizdagi deyarli har bir logotip ortida dizaynerning g'oyasi bor."}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Grafik dizayner$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$),
  $q$Animator (3D rassom)$q$, '🎬', 'growing',
  $q$Multfilm va o'yinlar uchun «jonlanadigan» personajlar yaratadi.$q$,
  $j${"what":"Personaj va sahnalarni chizadi va ularni harakatga keltiradi (jonlantiradi).","skills":"Chizish, sabr, fazoviy tasavvur, maxsus dasturlar.","subjects":"San'at, Informatika, Matematika.","study":"Animatsiya, kompyuter grafikasi.","fun_fact":"Bir daqiqalik sifatli multfilm uchun minglab kadr chizilishi mumkin."}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Animator (3D rassom)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, icon, demand, summary, details, sort_order)
SELECT 'kasblar', (SELECT id FROM public.bilimnoma_categories WHERE section='kasblar' AND title=$q$Ijodiy va media kasblar$q$),
  $q$Fotograf$q$, '📷', 'stable',
  $q$Lahzalarni surat orqali abadiy saqlaydigan mutaxassis.$q$,
  $j${"what":"Odam, tabiat yoki mahsulotni chiroyli kompozitsiyada suratga oladi va tahrirlaydi.","skills":"Badiiy ko'z, yorug'lik bilan ishlash, sabr.","subjects":"San'at, Fizika (optika), Informatika.","study":"Fotografiya kurslari yoki san'at yo'nalishi.","fun_fact":"«Foto» — yunoncha «yorug'lik», «graf» — «chizish»; ya'ni yorug'lik bilan chizish."}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='kasblar' AND title=$q$Fotograf$q$);
