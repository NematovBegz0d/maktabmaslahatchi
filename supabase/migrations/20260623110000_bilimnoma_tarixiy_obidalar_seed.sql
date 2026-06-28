-- ============================================================================
-- BILIMNOMA — "Tarixiy obidalar va muzeylar" SEED (2026-06-23)
--
--   Buxoro shahri va atrofidagi 14 ta tarixiy obida/muzey: 4 toifa.
--   Joy maydonlari (details jsonb): history / significance / location / map_url /
--   visit / facts / counselor_tip + resources + related. Cover rasmlar
--   AI-generatsiya (pollinations.ai), admin real fotoga almashtirishi mumkin.
--   Ma'lumotlar ochiq manbalar (Wikipedia va h.k.) asosida tekshirilgan.
--   IDEMPOTENT: WHERE title; dollar-quote ($q$/$j$) — apostrof erkin.
-- ============================================================================

INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'tarixiy_obidalar', $q$Tarixiy obidalar va qal'alar$q$, '🏛️', $q$Buxoroning qal'a va noyob yodgorliklari.$q$, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Tarixiy obidalar va qal'alar$q$);
INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'tarixiy_obidalar', $q$Madrasa va masjidlar$q$, '🕌', $q$Buxoroning mashhur madrasa va masjidlari.$q$, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$);
INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'tarixiy_obidalar', $q$Maqbara va ziyoratgohlar$q$, '🕊️', $q$Tarixiy maqbaralar va ziyoratgohlar.$q$, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Maqbara va ziyoratgohlar$q$);
INSERT INTO public.bilimnoma_categories (section, title, icon, description, sort_order)
SELECT 'tarixiy_obidalar', $q$Muzey va saroylar$q$, '🏺', $q$Saroylar va uy-muzeylar.$q$, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Muzey va saroylar$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Tarixiy obidalar va qal'alar$q$),
  $q$Ark qal'asi$q$,
  'https://image.pollinations.ai/prompt/Ark%20fortress%20of%20Bukhara%20ancient%20massive%20citadel%20walls%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Buxoroning eng qadimiy yuragi — amirlar yashagan ulkan qal'a-shahar.$q$,
  $j${"history":"Ark dastlab milodiy V asrda barpo etilgan; asrlar davomida vayron bo'lib qayta qurilgan. Hozirgi binolar asosan XVI–XX asrlarga oid. 1920-yilda bolsheviklar bombardmonida katta qismi vayron bo'lgan.","significance":"Buxoro hukmdorlari (amirlar) qarorgohi — saroy, masjid, xazina va idoralar shu yerda joylashgan. Devorlari 20 metr balandlikka yetadi.","location":"Registon maydoni, Buxoro shahri markazi.","map_url":"https://www.google.com/maps/search/?api=1&query=Ark%20of%20Bukhara","visit":"Har kuni ochiq, kichik kirish chiptasi bilan. Markazda — piyoda yetib boriladi. Ichida bir nechta muzey bor.","facts":["Devorlari ostidagi madaniy qatlam 20 metr chuqurlikka yetadi.","Ilk bor «Buxoro tarixi» (Narshaxiy, 899–960) asarida tilga olingan.","1920-yilgacha amirlar saroyi, harami va zindoni shu yerda bo'lgan."],"counselor_tip":"O'quvchilarga devorlarning balandligi va qadimiyligini ko'rsating; ichidagi muzeylarda Buxoro tarixi bosqichlarini birga kuzating. Zinapoyalarda ehtiyot bo'ling.","resources":[{"label":"Wikipedia — Ark of Bukhara","url":"https://en.wikipedia.org/wiki/Ark_of_Bukhara"}],"related":["Bolo Hovuz masjidi","Po'i Kalon majmuasi"]}$j$::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Ark qal'asi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Tarixiy obidalar va qal'alar$q$),
  $q$Chor Minor$q$,
  'https://image.pollinations.ai/prompt/Chor%20Minor%20Bukhara%20four%20blue%20domed%20minarets%20historic%20building%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$To'rt moviy gumbazli minorasi bilan mashhur noyob darvoza-bino.$q$,
  $j${"history":"1807-yilda turkman aslli badavlat buxorolik Xalif Niyozqul tomonidan qurilgan (Mang'itlar davri). Bu — endi saqlanmagan madrasaning darvozaxonasi.","significance":"Forschada «Chor Minor» — «to'rt minora». To'rt minoraning bezaklari turlicha; ba'zilar ularni turli e'tiqodlar ramzi deb taxmin qiladi.","location":"Buxoro eski shahar, mahalla ichida.","map_url":"https://www.google.com/maps/search/?api=1&query=Chor%20Minor%20Bukhara","visit":"Tashqaridan bepul ko'riladi; ichkariga kichik chipta bilan kirish mumkin. Markazdan piyoda.","facts":["To'rt «minora» aslida minora emas — uchtasi ombor, bittasida tepaga chiqadigan zina bor.","1995-yilda bir minora qulagan, UNESCO yordamida tiklangan."],"counselor_tip":"O'quvchilardan to'rt minora bezaklaridagi farqlarni topishni so'rang — bu diqqatni rivojlantiradi. Tor ko'chalarda guruhni jam tuting.","resources":[{"label":"Wikipedia — Chor Minor","url":"https://en.wikipedia.org/wiki/Chor_Minor"}],"related":["Lyabi Hovuz majmuasi"]}$j$::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Chor Minor$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Tarixiy obidalar va qal'alar$q$),
  $q$Buxoro savdo gumbazlari (Toqi)$q$,
  'https://image.pollinations.ai/prompt/Bukhara%20trading%20dome%20bazaar%20Toqi%20Zargaron%20historic%20covered%20market%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Buyuk ipak yo'li savdosidan qolgan gumbazli bozorlar.$q$,
  $j${"history":"XV–XVI asrlarda qurilgan. Toqi Zargaron (zargarlar) 1586–1587, Abdullaxon davrida; Toqi Sarrofon (sarroflar) va Toqi Telpakfurushon (bosh kiyim sotuvchilar) XVI asr oxiri.","significance":"«Toq» — gumbazli ravoq. Bu gumbazlar ostida zargar, sarrof va do'ppi-salla sotuvchilar savdo qilgan; karvon yo'llari kesishmasi.","location":"Buxoro eski shahar markazi.","map_url":"https://www.google.com/maps/search/?api=1&query=Toqi%20Zargaron%20Bukhara","visit":"Bepul, doimo ochiq — hozir ham hunarmandlar do'koni bor. Piyoda.","facts":["Toqi Zargaron shaharning eng katta yopiq bozori hisoblanadi.","Sarroflar dunyoning turli mamlakatlaridan kelgan pullarni almashtirgan."],"counselor_tip":"O'quvchilarga ipak yo'li savdosini jonli tasvirlab bering; bugungi hunarmand do'konlarini qadimgi savdo bilan solishtiring.","resources":[{"label":"Advantour — Trading Domes","url":"https://www.advantour.com/uzbekistan/bukhara/trading-domes.htm"}],"related":["Lyabi Hovuz majmuasi","Po'i Kalon majmuasi"]}$j$::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Buxoro savdo gumbazlari (Toqi)$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$),
  $q$Po'i Kalon majmuasi$q$,
  'https://image.pollinations.ai/prompt/Po-i-Kalan%20complex%20Bukhara%20Kalyan%20minaret%20and%20blue%20dome%20mosque%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Buxoroning ramzi — Kalon minorasi, Kalon masjidi va Mir Arab madrasasi.$q$,
  $j${"history":"Kalon minorasi 1127-yilda Arslonxon (Qoraxoniylar) buyrug'i bilan tugatilgan, balandligi 46,5 metr. Kalon masjidi 1515-yil (Ubaydullaxon). Mir Arab madrasasi 1535–1536-yil.","significance":"«Po'i Kalon» — «Ulug' minora poyida». Minora 900 yildan beri tik turibdi; Chingizxon ham uni asragan. Mir Arab — Markaziy Osiyoda uzluksiz ishlab kelgan yagona madrasa.","location":"Po'i Kalon maydoni, eski shahar markazi.","map_url":"https://www.google.com/maps/search/?api=1&query=Poi%20Kalan%20Bukhara","visit":"Masjid va minora hovlisiga kichik chipta bilan kiriladi; Mir Arab amaldagi madrasa (ichkari cheklangan). Piyoda.","facts":["Rivoyatga ko'ra Chingizxon minora oldida bosh egib, uni vayron qilmaslikka buyurgan.","Minora 46,5 metr — qurilganda Markaziy Osiyodagi eng baland inshoot bo'lgan."],"counselor_tip":"Minoraning balandligi va 900 yillik yoshini ta'kidlang; o'quvchilarga g'ishtli naqsh qatorlarini sanashni taklif qiling. Maydon ochiq — quyoshdan ehtiyot bo'ling.","resources":[{"label":"Wikipedia — Po-i-Kalyan","url":"https://en.wikipedia.org/wiki/Po-i-Kalyan"}],"related":["Buxoro savdo gumbazlari (Toqi)","Ulug'bek va Abdulazizxon madrasalari"]}$j$::jsonb, 4
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Po'i Kalon majmuasi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$),
  $q$Bolo Hovuz masjidi$q$,
  'https://image.pollinations.ai/prompt/Bolo%20Hauz%20mosque%20Bukhara%20wooden%20columns%20reflection%20in%20pond%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$«Qirq ustunli» masjid — amirning jome masjidi, Ark ro'parasida.$q$,
  $j${"history":"1712-yilda qurilgan, Ark ro'parasidagi Registonda. Old ayvonga 20 nafis yog'och ustun 1917-yilda qo'shilgan.","significance":"20 ustun hovuzda aks etib «qirq ustun» bo'lib ko'rinadi — shuning uchun «Qirq ustunli masjid» deyiladi. Amirning jome (juma) masjidi bo'lgan.","location":"Registon, Ark ro'parasi.","map_url":"https://www.google.com/maps/search/?api=1&query=Bolo%20Hauz%20Mosque%20Bukhara","visit":"Tashqaridan bepul; namoz vaqtlaridan tashqari ko'rish mumkin. Piyoda.","facts":["20 ta yog'och ustun hovuzdagi aksi bilan «qirq» bo'lib ko'rinadi.","Ayvon shifti rang-barang naqshlar bilan bezatilgan."],"counselor_tip":"O'quvchilarga hovuzdagi aks va «qirq ustun» nomini tushuntiring — bu optik xususiyat. Ayvon naqshlariga e'tibor qarating.","resources":[{"label":"Wikipedia — Bolo Haouz Mosque","url":"https://en.wikipedia.org/wiki/Bolo_Haouz_Mosque"}],"related":["Ark qal'asi"]}$j$::jsonb, 5
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Bolo Hovuz masjidi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$),
  $q$Lyabi Hovuz majmuasi$q$,
  'https://image.pollinations.ai/prompt/Lyab-i%20Hauz%20square%20Bukhara%20pond%20and%20madrasa%20Nadir%20Divan-Begi%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Hovuz atrofidagi maydon — Ko'kaldosh va Nodir Devonbegi binolari.$q$,
  $j${"history":"XVI–XVII asr majmuasi: Ko'kaldosh madrasasi (1568–1569, shaharning eng katta madrasasi), Nodir Devonbegi xonaqohi (1620) va madrasasi (1622), hovuz (taxminan 1620).","significance":"Buxoroda saqlanib qolgan kam sonli hovuzlardan biri atrofida shakllangan jonli maydon. Nodir Devonbegi madrasasi peshtoqida noyob — afsonaviy qushlar (Semurg) tasviri bor.","location":"Buxoro eski shahar markazi.","map_url":"https://www.google.com/maps/search/?api=1&query=Lyab-i%20Hauz%20Bukhara","visit":"Maydon bepul, ochiq; atrofda choyxona va do'konlar. Kechqurun yoritiladi. Piyoda.","facts":["Nodir Devonbegi madrasasi peshtoqida quyosh va ikki qush (Semurg) tasvirlangan — islom an'anasida noyob.","Madrasa dastlab karvonsaroy sifatida qurilgan, ochilishda «madrasa» deb e'lon qilingan."],"counselor_tip":"Peshtoqdagi qush tasvirini o'quvchilarga ko'rsating va nega bu noyobligini muhokama qiling. Maydon hordiq uchun qulay — yig'ilish nuqtasi sifatida ishlating.","resources":[{"label":"Wikipedia — Lyab-i Hauz","url":"https://en.wikipedia.org/wiki/Lyab-i_Hauz"}],"related":["Chor Minor","Buxoro savdo gumbazlari (Toqi)"]}$j$::jsonb, 6
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Lyabi Hovuz majmuasi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$),
  $q$Ulug'bek va Abdulazizxon madrasalari$q$,
  'https://image.pollinations.ai/prompt/Ulugbek%20madrasa%20Bukhara%20historic%20facade%20tilework%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Bir-biriga ro'para ikki madrasa — ilm maskanlari.$q$,
  $j${"history":"Ulug'bek madrasasi 1417-yilda Mirzo Ulug'bek qurdirgan — Markaziy Osiyodagi eng qadimiy madrasalardan. Abdulazizxon madrasasi 1652-yilda, aynan ro'parasiga qurilgan.","significance":"Ikki madrasa yuzma-yuz turadi («ko'sh» uslubi). Ulug'bek madrasasi astronom-shoh Ulug'bek qurdirgan uchta madrasadan biri.","location":"Buxoro eski shahar, savdo gumbazlari yaqinida.","map_url":"https://www.google.com/maps/search/?api=1&query=Ulugbek%20Madrasa%20Bukhara","visit":"Kichik chipta bilan hovliga kiriladi; hujralarda hunarmand do'konlari. Piyoda.","facts":["Ulug'bek madrasasi (1417) — Markaziy Osiyodagi eng qadimiy madrasalardan biri.","Abdulazizxon madrasasi 235 yil keyin aynan ro'parasiga qurilgan."],"counselor_tip":"Ikki madrasani solishtiring — qaysi biri qadimiyroq va nega? Bu tarixiy ketma-ketlikni o'rgatadi.","resources":[{"label":"Advantour — Bukhara","url":"https://www.advantour.com/uzbekistan/bukhara.htm"}],"related":["Po'i Kalon majmuasi","Magoki Attori masjidi"]}$j$::jsonb, 7
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Ulug'bek va Abdulazizxon madrasalari$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Madrasa va masjidlar$q$),
  $q$Magoki Attori masjidi$q$,
  'https://image.pollinations.ai/prompt/Magoki%20Attori%20ancient%20mosque%20Bukhara%20brick%20facade%20below%20ground%20level%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Buxoroning eng qadimiy masjidlaridan — qadimiy ibodat joyi o'rnida.$q$,
  $j${"history":"Islomdan oldingi ma'bad (Moh bozori) o'rnida qurilgan; hozirgi bino XII asr, XVI asrda qayta tiklangan. Nomi «chuqurdagi attorlar masjidi» ma'nosini beradi.","significance":"Bino yer sathidan past — atrofdagi madaniy qatlam asrlar davomida ko'tarilgan. Janubiy peshtoqi XII asr g'isht naqshining noyob namunasi. Bugun gilam muzeyi joylashgan.","location":"Buxoro eski shahar markazi.","map_url":"https://www.google.com/maps/search/?api=1&query=Magoki%20Attori%20Mosque%20Bukhara","visit":"Kichik chipta — ichida gilam muzeyi. Piyoda.","facts":["Masjid yer sathidan ancha past — asrlar davomida atrofdagi yer ko'tarilgan.","Janubiy peshtoqi XII asr g'isht me'morchiligining noyob namunasi."],"counselor_tip":"Nega masjid «chuqurda» ekanini tushuntiring — bu shahar qatlamlari (arxeologiya) haqida tushuncha beradi. Gilam naqshlarini kuzating.","resources":[{"label":"Advantour — Bukhara","url":"https://www.advantour.com/uzbekistan/bukhara.htm"}],"related":["Ulug'bek va Abdulazizxon madrasalari"]}$j$::jsonb, 8
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Magoki Attori masjidi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Maqbara va ziyoratgohlar$q$),
  $q$Ismoil Somoniy maqbarasi$q$,
  'https://image.pollinations.ai/prompt/Samanid%20mausoleum%20Bukhara%20ancient%20brick%20cube%20tomb%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Markaziy Osiyodagi eng qadimiy g'ishtli maqbara — me'morchilik durdonasi.$q$,
  $j${"history":"X asr boshida (Somoniylar; Ismoil Somoniy 892–907) qurilgan. To'liq pishiq g'ishtdan; taxminan 10,8 metr kub shaklida, to'rt bir xil tomon va gumbaz.","significance":"Dunyoda saqlanib qolgan eng qadimiy g'ishtli maqbaralardan. G'ishtning o'zi bilan naqsh yaratilgan; burchaklardagi «chortoq» tizimi keyingi maqbaralarga namuna bo'lgan.","location":"Somoniylar bog'i, Registon yaqinida.","map_url":"https://www.google.com/maps/search/?api=1&query=Samanid%20Mausoleum%20Bukhara","visit":"Bog' ichida, ko'rish bepul. Markazdan piyoda yoki qisqa yo'l.","facts":["Mo'g'ullar bostirib kelganda maqbara loy-qum ostida ko'milgan edi — shu sabab vayron qilinmagan.","G'ishtlar kun davomida turlicha soya berib, naqsh ko'rinishini o'zgartirib turadi."],"counselor_tip":"G'ishtdan qanday qilib naqsh yaratilganini o'quvchilarga ko'rsating; binoning matematik mukammalligini (to'rt bir xil tomon) ta'kidlang.","resources":[{"label":"Wikipedia — Samanid Mausoleum","url":"https://en.wikipedia.org/wiki/Samanid_Mausoleum"}],"related":["Chashma Ayub maqbarasi"]}$j$::jsonb, 9
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Ismoil Somoniy maqbarasi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Maqbara va ziyoratgohlar$q$),
  $q$Chashma Ayub maqbarasi$q$,
  'https://image.pollinations.ai/prompt/Chashma%20Ayub%20mausoleum%20Bukhara%20conical%20dome%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$«Ayyub chashmasi» — muqaddas buloq ustidagi maqbara, suv muzeyi.$q$,
  $j${"history":"XII asr (Qoraxoniylar)da asos solingan, XIV–XVI asrlarda qayta qurilgan. Konussimon Xorazm uslubidagi gumbaz — Buxoroda kam uchraydi.","significance":"Rivoyatga ko'ra payg'ambar Ayyub (Iyov) hassasini yerga urganda shifobaxsh buloq otilib chiqqan. Bugun ichida Suv muzeyi bor.","location":"Somoniylar bog'i yonida.","map_url":"https://www.google.com/maps/search/?api=1&query=Chashma%20Ayub%20Bukhara","visit":"Kichik chipta — Suv muzeyi. Markazdan piyoda.","facts":["Gumbazi Xorazm uslubida konussimon — Buxoro uchun noodatiy.","Suv muzeyida Buxoroning qadimiy kanal va hovuz tizimi tarixi ko'rsatilgan."],"counselor_tip":"Suv muzeyi orqali Buxoroda suvning qadrini va qadimiy suv tizimini tushuntiring — ekologik mavzuga ham bog'lanadi.","resources":[{"label":"Wikipedia — Chashma-Ayub Mausoleum","url":"https://en.wikipedia.org/wiki/Chashma-Ayub_Mausoleum"}],"related":["Ismoil Somoniy maqbarasi"]}$j$::jsonb, 10
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Chashma Ayub maqbarasi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Maqbara va ziyoratgohlar$q$),
  $q$Bahouddin Naqshband majmuasi$q$,
  'https://image.pollinations.ai/prompt/Bahauddin%20Naqshband%20memorial%20complex%20Bukhara%20mosque%20courtyard%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Naqshbandiya tariqati asoschisi maqbarasi — yirik ziyoratgoh.$q$,
  $j${"history":"Bahouddin Naqshband (1318–1389) — Naqshbandiya tariqati asoschisi. Maqbara 1544-yil atrofida Abdulazizxon davrida shakllantirilgan; majmua asrlar davomida kengaygan.","significance":"Markaziy Osiyodagi eng yirik ziyoratgohlardan biri. 2023-yilda UNESCO Jahon merosiga kiritilgan. Shahardan taxminan 10 km shimoli-sharqda.","location":"Qasri Orifon qishlog'i, Buxorodan ~10 km.","map_url":"https://www.google.com/maps/search/?api=1&query=Bahauddin%20Naqshband%20Complex%20Bukhara","visit":"Bepul ziyoratgoh; ochiq maydon, masjid, hovuz va muzey. Transport kerak (taksi/avtobus). Hurmat libosi tavsiya etiladi.","facts":["Naqshband 32 marta Makkaga haj qilgan deb aytiladi.","Xalq orasida: Buxorodan uch marta piyoda ziyorat bir hajga teng degan e'tiqod bor."],"counselor_tip":"Bu ibodat-ziyorat joyi — o'quvchilarga hurmat qoidalarini (kiyim, jimlik) oldindan tushuntiring. Naqshbandni tarixiy shaxs sifatida tanishtiring.","resources":[{"label":"Wikipedia — Bahoutdin Complex","url":"https://en.wikipedia.org/wiki/Bahoutdin_Architectural_Complex"}],"related":["Chor Bakr nekropoli"]}$j$::jsonb, 11
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Bahouddin Naqshband majmuasi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Maqbara va ziyoratgohlar$q$),
  $q$Chor Bakr nekropoli$q$,
  'https://image.pollinations.ai/prompt/Chor%20Bakr%20necropolis%20Bukhara%20city%20of%20the%20dead%20historic%20tombs%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$«O'liklar shahri» — Juybor shayxlarining ko'cha-hovlili maqbaralar majmuasi.$q$,
  $j${"history":"X asrda Abu Bakr Said (vafoti 970) qabri atrofida shakllangan. XVI asrda Abdullaxon II buyrug'i bilan masjid, madrasa va xonaqoh qurilgan; Juybor shayxlari shu yerga dafn etilgan.","significance":"Hovli, ko'cha va binolari bilan «o'liklar shahri»ga o'xshaydi — 30 ga yaqin inshoot, tomi yo'q «xazira» maqbaralar. Shahardan taxminan 5 km janubi-g'arbda (Sumiton).","location":"Sumiton qishlog'i, Buxorodan ~5 km.","map_url":"https://www.google.com/maps/search/?api=1&query=Chor%20Bakr%20Necropolis%20Bukhara","visit":"Bepul; ochiq hudud, piyoda aylanish. Transport kerak (taksi).","facts":["Majmua xuddi kichik shahar kabi ko'chalar va hovlilarga ega.","XX asr boshida Kalon minorasiga o'xshash kichik minora qo'shilgan."],"counselor_tip":"Tinch, ziyoratga oid joy — o'quvchilarni jamoa bo'lib tartibli yuriting; me'moriy «shahar» tuzilishini kuzatishni taklif qiling.","resources":[{"label":"Advantour — Chor-Bakr","url":"https://www.advantour.com/uzbekistan/bukhara/chor-bakr.htm"}],"related":["Bahouddin Naqshband majmuasi"]}$j$::jsonb, 12
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Chor Bakr nekropoli$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Muzey va saroylar$q$),
  $q$Sitorai Mohi Xosa saroyi$q$,
  'https://image.pollinations.ai/prompt/Sitorai%20Mokhi%20Khosa%20palace%20Bukhara%20emir%20summer%20residence%20white%20hall%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$Buxoro amirining yozgi saroyi — sharq va g'arb uyg'unligi, hozir muzey.$q$,
  $j${"history":"Hozirgi saroy 1912–1918-yillarda oxirgi amir Said Olimxon buyrug'i bilan qurilgan; buxorolik ustalar va rus muhandislari birga ishlagan. 1927-yildan muzey.","significance":"«Sitorai Mohi Xosa» — «Oydek yulduz». Oq zal va oynalar zali; Usta Shirin Murodov ganch naqshlari bilan mashhur. Bugun amaliy san'at (suzani, libos, sopol) muzeyi.","location":"Buxorodan taxminan 4 km shimolda.","map_url":"https://www.google.com/maps/search/?api=1&query=Sitorai%20Mokhi%20Khosa%20Bukhara","visit":"Kichik chipta bilan muzey. Transport kerak (taksi). Bog' va saroy birga.","facts":["Oq zal devorlari oyna va ganch bilan bezatilgan — aks etish 40 martagacha takrorlanadi.","Pechlar Sankt-Peterburgdan keltirilgan — sharq va g'arb uyg'unligi."],"counselor_tip":"O'quvchilarga sharq va g'arb uslublari qanday birlashtirilganini ko'rsating; oynalar zalidagi optik effektga e'tibor qarating. Eksponatlarga qo'l tegizmaslikni eslating.","resources":[{"label":"Wikipedia — Sitorai Mokhi-Khosa","url":"https://en.wikipedia.org/wiki/Sitorai_Mokhi-Khosa"}],"related":["Fayzulla Xo'jayev uy-muzeyi"]}$j$::jsonb, 13
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Sitorai Mohi Xosa saroyi$q$);

INSERT INTO public.bilimnoma_entries (section, category_id, title, image_url, summary, details, sort_order)
SELECT 'tarixiy_obidalar', (SELECT id FROM public.bilimnoma_categories WHERE section='tarixiy_obidalar' AND title=$q$Muzey va saroylar$q$),
  $q$Fayzulla Xo'jayev uy-muzeyi$q$,
  'https://image.pollinations.ai/prompt/traditional%20Bukhara%20merchant%20house%20courtyard%2019th%20century%20carved%20wood%20Uzbekistan%20realistic%20photo?width=1200&height=600&nologo=true',
  $q$XIX asr boy savdogar uyi — Buxoro turmush tarzi muzeyi.$q$,
  $j${"history":"Uy 1891-yilda Fayzulla Xo'jayevning otasi — qorako'l savdosi bilan boyigan Ubaydullaxo'ja tomonidan qurilgan. 1996-yilda uy-muzeyga aylantirilgan.","significance":"Buxoro XIX asr me'morchiligining yorqin namunasi: «havli berun» (tashqi, erkaklar) va «havli darun» (ichki, ayollar) qismlari. Fayzulla Xo'jayev — jadid, davlat arbobi (1896–1938).","location":"Buxoro eski shahar.","map_url":"https://www.google.com/maps/search/?api=1&query=Fayzulla%20Khodjaev%20House%20Bukhara","visit":"Kichik chipta bilan muzey. Markazdan piyoda yoki qisqa yo'l.","facts":["Uy ichki (ayollar) va tashqi (erkaklar) hovlilarga bo'lingan — an'anaviy Buxoro uyi.","Muzeyda boy savdogar oilasi turmushi va Buxoro etnografiyasi ko'rsatilgan."],"counselor_tip":"O'quvchilarga an'anaviy uy tuzilishi (ichki/tashqi hovli) va o'sha davr turmushini tushuntiring; bugungi uylar bilan solishtiring.","resources":[{"label":"Wikipedia — Fayzulla Xojayev house","url":"https://en.wikipedia.org/wiki/Fayzulla_Xo%CA%BBjayev_house_museum"}],"related":["Sitorai Mohi Xosa saroyi"]}$j$::jsonb, 14
WHERE NOT EXISTS (SELECT 1 FROM public.bilimnoma_entries WHERE section='tarixiy_obidalar' AND title=$q$Fayzulla Xo'jayev uy-muzeyi$q$);
