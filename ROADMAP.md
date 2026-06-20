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

## BOSQICH 1 — Production'ni repo bilan xavfsiz sinxronlash ✅ (2026-06-19, MCP orqali)
> Migratsiya → funksiya tartibida bajarildi. Endi prod = repo.

- ✅ **1.1** 3 migratsiya prodga qo'llandi (lock_activity_log → test_results_unique → phone_normalized); migratsiya tarixi repo versiyalariga moslandi (20260618*).
- ✅ **1.2** Funksiyalar: `complete-session` (v4, atomik upsert), `submit-application` (v2, phone_normalized+first-XFF+CAPTCHA), yangi `reset-student-password` (v1) deploy qilindi. Qolgan 4 admin funksiyasi tekshirildi — allaqachon repo bilan mos (June 16).
- ✅ **1.3** Smoke-test: submit-application bo'sh body → 400 (yozmadi); complete-session → 401 gateway; ma'lumot butun (results=5, apps=0). Sxema: unique indeks + phone_normalized + trigger tasdiqlandi.

## BOSQICH 2 — Kritik xavfsizlik / operatsion bo'shliqlar ✅ (kod) / ⚙️ (config sizda)
> Kod tomoni TUGADI. Qolgani — akkaunt-darajadagi konfiguratsiya (MCP'dan qilib bo'lmaydi).

- ✅ **2.1** O'quvchi parol-tiklash: `reset-student-password` (deploy qilingan) + frontend tugma/oyna.
- ⚙️ **2.2** Leaked-password protection — **config (siz):** Dashboard → Authentication → Password protection → yoqish. ([hujjat](https://supabase.com/docs/guides/auth/password-security))
- ✅/⚙️ **2.3** Login brute-force: haqiqiy himoya = Supabase Auth rate-limit (Dashboard → Auth → Rate Limits). Client 30s lockout — faqat UX (reload'da nollanadi, to'g'ridan-to'g'ri API'ni to'xtatmaydi); ataylab shunday.
- ✅/⚙️ **2.4** CAPTCHA: **kod to'liq ulangan** (frontend widget + token + backend verify; `.env.example` hujjatlangan). **Config (siz):** `TURNSTILE_SECRET_KEY` (Edge secret) + `VITE_TURNSTILE_SITE_KEY` (Netlify build) qo'ying → avtomatik yoqiladi.
- ⏸️ **2.5** CORS allowlist — **ataylab keyinga qoldirildi** (JWT funksiyalar uchun `*` xavfsiz; domen yakunlangach `ALLOWED_ORIGINS` qo'yiladi).

## BOSQICH 3 — Ishonchlilik va testlar ✅
- ✅ **3.1** `complete-session` orkestratsiyasi `_shared/complete.ts`ga (sof, deps-injected) ajratildi + 8 ta vitest testi (egalik, idempotentlik, natija→profil→yakunlash tartibi, xato-holatlar). `complete-session` v5 deploy (xulq-atvor o'zgarmagan).
- ✅ **3.2** AI kunlik-limit TOCTOU'si atomik qilindi: `ai_daily_usage` + `claim_ai_quota` (migratsiya prodda, tarix moslangan); `analyze-profile` v4 deploy. *(types.ts regeneratsiyasi — kichik follow-up)*
- ✅ **3.3** CI DB-testlari (`db-tests.yml` + `db-test.sh`) allaqachon bor edi; `claim_ai_quota` uchun yangi pgTAP test (`ai_quota.test.sql`) qo'shildi — limit, hisoblagich, per-user, per-day izolyatsiya. Mantiq live sxemada (rollback) tasdiqlandi.
- ✅ **3.4** Reyting mantig'i testlari: `rating.ts` (`computeRating`, `rankEmoji`) + `school-stats.ts` (`schoolStatus`). Jami test: **103**.

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
