# EduLens — Mukammallashtirish yo'l xaritasi (ROADMAP)

> **Maqsad:** loyihani demo holatdan real, ishonchli, masshtablanadigan production
> darajasiga bosqichma-bosqich olib chiqish — adashmasdan.
>
> **Tamoyil:** har bosqich oxirida tizim "yashil" (tsc + lint + test + build).
> Real maktab ulanishidan oldin **Bosqich 0–3 majburiy**.
>
> **Holat:** ⬜ rejada · 🔄 jarayonda · ✅ tugagan

---

## Boshlang'ich holat (2026-06-19 auditi)

- **Repo (git main) ≠ Production.** Hardening PR'lari (#1–#4) git'ga merge qilingan,
  lekin bazaga ham, edge funksiyalarga ham **deploy qilinmagan**.
- Prod migratsiyalari `20260617120000` gacha; oxirgi **3 hardening migratsiyasi yo'q**
  (`test_results_unique`, `application_phone_normalized`, `lock_activity_log_insert`).
- Prod funksiyalari eski: `complete-session` = DELETE+INSERT (atomik emas, idempotent guard yo'q);
  `submit-application` = first-XFF + xom telefon dedup, CAPTCHA yo'q.
- Ma'lumot: 5 profil, 0 ariza — real foydalanuvchi yo'q (**demo**). Hozircha zarar yo'q.

---

## BOSQICH 0 — Deploy-oldi repo tuzatishlari ✅
> Branch'da, xavfsiz. Maqsad: repo'ni "to'g'ri" holatga keltirib, keyin BITTA toza deploy qilish.

- ✅ **0.1** `submit-application` `clientIp` first-XFF ga qaytarildi (oxirgi-qiymat regressiyasi).
- ✅ **0.2** Deploy-oldi audit: prod sxemasida yo'q boshqa bog'liqlik topilmadi (faqat ma'lum 3 migratsiya).
- ✅ **0.3** `tsc + lint + test` yashil (84/84).
- ✅ **0.4** Deploy runbook yozildi (pastdagi Bosqich 1).

## BOSQICH 1 — Production'ni repo bilan xavfsiz sinxronlash ⬜  ⚠️ prod o'zgaradi (ruxsat bilan)
> ⚠️ TARTIB MUHIM: avval migratsiya, KEYIN funksiya. Teskari qilsangiz prod buziladi.
>
> **Runbook (aniq tartib):**
> 1. `supabase db push` — 3 migratsiyani qo'llaydi (`test_results_unique` → `application_phone_normalized` → `lock_activity_log_insert`).
> 2. Tasdiqlash: `test_results`'da `(student_id,test_id)` unique indeks va `club_applications.phone_normalized` ustun paydo bo'lganini tekshirish.
> 3. `supabase functions deploy` — BARCHA funksiyalar (yangi `reset-student-password` ham, `config.toml`'da `verify_jwt=true` bilan).
> 4. Secrets tekshirish: `ANTHROPIC_API_KEY`, ixtiyoriy `TURNSTILE_SECRET_KEY`/`VITE_TURNSTILE_SITE_KEY`, `ALLOWED_ORIGINS`.

- ⬜ **1.1** 3 migratsiyani tartibda qo'llash.
- ⬜ **1.2** Migratsiyadan SO'NG barcha edge funksiyalarni qayta deploy qilish (yangi `reset-student-password` bilan).
- ⬜ **1.3** Smoke-test: test yakunlash 200 qaytaradimi; ariza yuborish ishlaydimi; o'quvchi parol-tiklash ishlaydimi; advisor qayta tekshirish.

## BOSQICH 2 — Kritik xavfsizlik / operatsion bo'shliqlar 🔄
- ✅ **2.1** O'quvchi parol-tiklash: edge funksiya (`reset-student-password`) + frontend tugma/oyna ([students.$id.tsx](src/routes/students.$id.tsx)) tayyor. *(deploy Bosqich 1'da)*
- ⬜ **2.2** Leaked-password protection yoqish (Supabase Auth, HaveIBeenPwned).
- ⬜ **2.3** Login lockout'ni serverga ko'chirish yoki Supabase rate-limitga tayanib hujjatlash.
- ⬜ **2.4** CAPTCHA: Turnstile kalitlarini o'rnatish YOKI ataylab o'chiqligini hujjatlash.
- ⬜ **2.5** CORS allowlist (`ALLOWED_ORIGINS`) — domen barqarorlashgach.

## BOSQICH 3 — Ishonchlilik va testlar ⬜
- ⬜ **3.1** `complete-session` uchun integratsiya testi (Deno test yoki pgTAP).
- ⬜ **3.2** Rate-limit TOCTOU'ni atomik qilish (kritik: AI xarajati — DB hisoblagich/lock).
- ⬜ **3.3** CI'ga DB testlarini ulash; "yashil" majburiy.
- ⬜ **3.4** Muhim rout/oqimlar uchun komponent testlari.

## BOSQICH 4 — Kod sifati / arxitektura ⬜
- ⬜ **4.1** Semiz rout fayllarni bo'lish (`index` 901, `students.$id` 830, `my-profile` 800...) → data-hook + dialog komponentlari.
- ⬜ **4.2** `auth_rls_initplan` (24 eski policy) `(select auth.uid())` ga o'rab tuzatish.
- ⬜ **4.3** `analytics.tsx` va boshqa chuqur o'qilmagan rout'larni ko'rib chiqish; takror naqshlarni konsolidatsiya.

## BOSQICH 5 — Performance / masshtab ⬜
- ⬜ **5.1** Indekssiz FK'larga indeks (5 ta).
- ⬜ **5.2** `multiple_permissive_policies` (51 ta) konsolidatsiyasi — ixtiyoriy.
- ⬜ **5.3** AI modelni `claude-sonnet-4-6` ga yangilash + sinash.
- ⬜ **5.4** AI'ni fon/navbatga olish (yuk oshganda).

## BOSQICH 6 — Mahsulot / psixometrik validlik ⬜
- ⬜ **6.1** Har faol testning savol bazasini to'ldirish/tekshirish (Schulte yo'q; ba'zilari kam savol).
- ⬜ **6.2** IQ/baho shkalalarini hujjatlash; disklaymer + "pedagog-psixolog tasdig'i" oqimini joriy qilish.
- ⬜ **6.3** Natijalar statistik validatsiyasi/normasi — uzoq muddat.

## BOSQICH 7 — Polish / UX / hujjat ⬜
- ⬜ **7.1** Foydalanuvchi uchun README (setup) + `.env.example` to'liqligi.
- ⬜ **7.2** Xatoliklar monitoringi (Sentry yoki shunga o'xshash).
- ⬜ **7.3** Backup/restore strategiyasi va hujjati.

---

## Tugatish mezonlari (Definition of Done)
- **Launch-ready (real maktab):** Bosqich 0–3 ✅
- **Mustahkam production:** Bosqich 0–5 ✅
- **Mukammal mahsulot:** Bosqich 0–7 ✅
