-- ============================================================================
-- BILIMNOMA — "Tarixiy obidalar" boyitish (2026-06-23)
--
--   14 ta obida/muzeyga: galereya (3 rasm), qo'shimcha matn (body) qo'shadi;
--   Po'i Kalon majmuasiga tanishtiruv video (YouTube). Rasmlar AI-generatsiya
--   (pollinations.ai) — admin real fotoga almashtirishi mumkin.
--   `details || '{...}'` — eski maydonlar saqlanadi, galereya/video qo'shiladi.
--   IDEMPOTENT: WHERE title.
-- ============================================================================

UPDATE public.bilimnoma_entries SET
 body = $q$Ark shunchaki qal'a emas — ichida saroy, masjid, zarbxona, devonxona va do'konlar joylashgan butun bir shaharcha bo'lgan. Bugun uning xonalarida Buxoro tarixi va qadimiy qo'lyozmalar muzeylari bor. Yuqoriga kirish darvozasi oldidagi qiya yo'lak orqali ko'tariladi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/massive%20Ark%20fortress%20walls%20of%20Bukhara%20panoramic%20view%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Ark%20fortress%20Bukhara%20main%20entrance%20gate%20towers%20Uzbekistan?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/inside%20Ark%20fortress%20Bukhara%20courtyard%20old%20buildings%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Ark qal'asi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Chor Minor 1807-yilda badavlat buxorolik Xalif Niyozqul mablag'iga qurilgan. To'rt minoraning bezagi bir-biriga o'xshamaydi — har birida turli ma'no yashiringan deb taxmin qilinadi. Yonida kichik hovuz va hunarmand do'konlari bor.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Chor%20Minor%20Bukhara%20four%20turquoise%20domed%20towers%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Chor%20Minor%20Bukhara%20blue%20tiled%20dome%20close%20up%20detail?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Chor%20Minor%20Bukhara%20old%20neighborhood%20street%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Chor Minor$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Gumbazlar karvon yo'llari kesishgan joyda qurilgan bo'lib, har biri muayyan kasbga ixtisoslashgan: zargarlar (Zargaron), sarroflar (Sarrofon) va bosh kiyim sotuvchilar (Telpakfurushon). Bugun ham bu yerda hunarmandlar miskarlik, kashtachilik va zardo'zlik buyumlarini sotadi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Bukhara%20trading%20dome%20interior%20arches%20and%20shops%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Toqi%20Zargaron%20trading%20dome%20exterior%20Bukhara%20Uzbekistan?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/craftsmen%20handicraft%20shops%20inside%20Bukhara%20bazaar%20dome?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Buxoro savdo gumbazlari (Toqi)$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Majmua uch qismdan iborat: 46,5 metrli Kalon minorasi, ulkan Kalon (juma) masjidi va hozir ham faoliyat yuritayotgan Mir Arab madrasasi. Minora 900 yil davomida zilzilalarga, hatto Chingizxon bosqiniga bardosh bergan. Kechqurun yoritilganda majmua ayniqsa go'zal ko'rinadi.$q$,
 details = details || $j${"video_url":"https://www.youtube.com/watch?v=o2nlTV-LE-8","gallery":["https://image.pollinations.ai/prompt/Kalyan%20minaret%20Bukhara%20tall%20ancient%20brick%20tower%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Kalon%20mosque%20Bukhara%20blue%20dome%20and%20courtyard%20Uzbekistan?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Mir-i-Arab%20madrasa%20Bukhara%20facade%20blue%20tilework%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Po'i Kalon majmuasi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Masjid amirning rasmiy juma masjidi bo'lgan va Ark ro'parasida joylashgan. Uning eng diqqatga sazovor qismi — naqshlangan baland ayvon va uni ko'tarib turgan ingichka yog'och ustunlar. Old hovuz bu ustunlarni aks ettirib, «qirq ustun» taassurotini beradi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Bolo%20Hauz%20mosque%20Bukhara%20tall%20iwan%20wooden%20columns%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Bolo%20Hauz%20mosque%20Bukhara%20painted%20wooden%20ceiling%20detail?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Bolo%20Hauz%20mosque%20Bukhara%20reflection%20in%20pond%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Bolo Hovuz masjidi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Lyabi Hovuz — Buxoroning eng jonli maydonlaridan biri; markazida qadimiy hovuz, atrofida Ko'kaldosh madrasasi va Nodir Devonbegi binolari joylashgan. Nodir Devonbegi madrasasi peshtoqidagi quyosh va Semurg qush tasviri islom me'morchiligida juda kam uchraydi. Maydon atrofidagi choyxonalar dam olish uchun qulay.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Lyab-i%20Hauz%20Bukhara%20pond%20and%20old%20trees%20square%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Nadir%20Divan-Begi%20madrasa%20Bukhara%20portal%20phoenix%20bird%20mosaic?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Lyab-i%20Hauz%20Bukhara%20evening%20lights%20teahouses%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Lyabi Hovuz majmuasi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Ikki madrasa ko'cha orqali yuzma-yuz turadi — bu Buxoroda «ko'sh» (juft) uslubi deyiladi. Ulug'bek madrasasi (1417) astronom va hukmdor Mirzo Ulug'bek qurdirgan, soddaroq bezakli. Abdulazizxon madrasasi (1652) esa ancha keyin, boy va serhasham naqshlar bilan qurilgan — ikkisini solishtirish me'morchilik o'zgarishini ko'rsatadi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Ulugbek%20madrasa%20Bukhara%20portal%20facade%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Abdulazizkhan%20madrasa%20Bukhara%20rich%20tilework%20detail?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/two%20madrasas%20facing%20each%20other%20Bukhara%20street%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Ulug'bek va Abdulazizxon madrasalari$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Magoki Attori Buxoroning eng qadimiy masjidlaridan biri bo'lib, islomdan oldingi ma'bad o'rnida qurilgan. Asrlar davomida atrofdagi yer ko'tarilgani sabab masjid yer sathidan ancha pastda qolib ketgan. Hozir uning ichida Buxoro gilamlari muzeyi joylashgan.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Magoki%20Attori%20mosque%20Bukhara%20ancient%20brick%20portal%20below%20ground?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Magoki%20Attori%20Bukhara%20carved%20brick%20ornament%20detail?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Bukhara%20carpet%20museum%20interior%20colorful%20rugs%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Magoki Attori masjidi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Bu maqbara Markaziy Osiyodagi eng qadimiy saqlanib qolgan g'ishtli inshootlardan biri hisoblanadi. Uning sehri — oddiy pishiq g'ishtdan yaratilgan murakkab naqshlarda: kun davomida quyosh burchagi o'zgargani sayin devordagi naqsh ko'rinishi o'zgarib turadi. To'rt tomoni bir xil, ichkariga to'rtta eshik orqali kiriladi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Samanid%20mausoleum%20Bukhara%20brick%20cube%20full%20view%20Uzbekistan?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Samanid%20mausoleum%20Bukhara%20intricate%20brickwork%20pattern%20detail?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Samanid%20mausoleum%20Bukhara%20dome%20interior%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Ismoil Somoniy maqbarasi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$«Chashma Ayub» — «Ayyub bulog'i» degani. Rivoyatga ko'ra payg'ambar Ayyub hassasini yerga urganda shu yerda shifobaxsh buloq paydo bo'lgan. Binoning konussimon gumbazi Xorazm ustalari uslubida bo'lib, Buxoroda kam uchraydi. Ichida Suv muzeyi — Buxoroning kanal va hovuz tizimlari tarixi haqida.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Chashma%20Ayub%20mausoleum%20Bukhara%20conical%20dome%20full%20view?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Chashma%20Ayub%20Bukhara%20sacred%20spring%20interior%20Uzbekistan?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/water%20museum%20Bukhara%20old%20irrigation%20exhibits?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Chashma Ayub maqbarasi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Bahouddin Naqshband (1318–1389) — Naqshbandiya so'fiylik tariqatining asoschisi va Buxoroning ma'naviy homiysi sanaladi. Majmua maqbara, masjid, minora, hovuz va muzeydan iborat keng hudud. Bu yer Markaziy Osiyodagi eng yirik ziyoratgohlardan biri bo'lib, 2023-yilda UNESCO ro'yxatiga kiritilgan.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Bahauddin%20Naqshband%20complex%20Bukhara%20courtyard%20and%20pool?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Bahauddin%20Naqshband%20mausoleum%20Bukhara%20Uzbekistan?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Bahauddin%20Naqshband%20complex%20Bukhara%20mosque%20minaret?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Bahouddin Naqshband majmuasi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Chor Bakr — Juybor shayxlarining oilaviy qabristoni bo'lib, ko'chalar, hovlilar va darvozalari bilan haqiqiy kichik shaharni eslatadi. Shu sababli uni «o'liklar shahri» deb atashadi. Majmuada 30 ga yaqin inshoot bor; ko'pchilik maqbaralar tomsiz «xazira» ko'rinishida.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Chor%20Bakr%20necropolis%20Bukhara%20courtyards%20and%20portals?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Chor%20Bakr%20necropolis%20Bukhara%20minaret%20and%20domes?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Chor%20Bakr%20Bukhara%20open%20tomb%20hazira%20walls%20Uzbekistan?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Chor Bakr nekropoli$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Saroy oxirgi Buxoro amiri Said Olimxon uchun 1912–1918-yillarda qurilgan va sharq hamda g'arb uslublarini o'zida birlashtiradi. Eng mashhur qismi — Oq zal: devorlari oyna va nafis ganch naqshlar bilan bezatilgan. Bugun saroyda Buxoro amaliy san'ati (suzani, milliy liboslar, sopol) muzeyi joylashgan.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Sitorai%20Mokhi%20Khosa%20palace%20Bukhara%20white%20hall%20mirrors%20ganch?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Sitorai%20Mokhi%20Khosa%20Bukhara%20palace%20exterior%20garden?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Bukhara%20palace%20museum%20suzani%20embroidery%20costumes%20display?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Sitorai Mohi Xosa saroyi$q$;

UPDATE public.bilimnoma_entries SET
 body = $q$Bu uy 1891-yilda boy savdogar oilasi uchun qurilgan bo'lib, an'anaviy Buxoro hovlisining ajoyib namunasi. U ikki qismga bo'lingan: tashqi «havli berun» (mehmonlar va erkaklar) va ichki «havli darun» (oila va ayollar). Muzeyda XIX–XX asr Buxoro savdogarlari turmushi, liboslari va ro'zg'or buyumlari namoyish etiladi.$q$,
 details = details || $j${"gallery":["https://image.pollinations.ai/prompt/Bukhara%20merchant%20house%20carved%20wooden%20veranda%20courtyard?width=900&height=600&nologo=true&seed=1","https://image.pollinations.ai/prompt/Bukhara%20traditional%20house%20interior%20niches%20ganch%20decoration?width=900&height=600&nologo=true&seed=2","https://image.pollinations.ai/prompt/Bukhara%20ethnographic%20museum%20old%20costumes%20and%20objects?width=900&height=600&nologo=true&seed=3"]}$j$::jsonb
 WHERE section='tarixiy_obidalar' AND title=$q$Fayzulla Xo'jayev uy-muzeyi$q$;
