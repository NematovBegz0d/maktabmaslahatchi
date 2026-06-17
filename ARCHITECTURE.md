# EduLens — Arxitektura

Ko'p-maktabli (multi-tenant) psixometrik va kasb-yo'naltirish platformasi. Bu hujjat tizim qanday tashkil topganini va ma'lumot qanday oqishini tushuntiradi.

---

## Yuqori darajadagi sxema

```
┌──────────────────────────────────────────────────────────────┐
│  BRAUZER (React 19 SPA — Netlify)                            │
│  • TanStack Router (file-based) + Query (kesh)               │
│  • supabase-js (anon key) — RLS ostida o'qish/oddiy yozish   │
└───────────────┬───────────────────────────┬──────────────────┘
                │ anon key + JWT             │ Bearer token (imtiyozli)
                ▼                             ▼
        ┌───────────────┐          ┌─────────────────────────────┐
        │  Postgres     │◄─────────│  Edge Functions (Deno)      │
        │  + RLS qatlam │ service  │  verify_jwt + service_role  │
        └───────────────┘  role    │  (RLS chetlab o'tadi)       │
                                    └──────────────┬──────────────┘
                                                   │
                                                   ▼  Claude API
                                          (analyze-profile)
```

**Asosiy tamoyil:** "ishonchli emas" amallar (foydalanuvchi yaratish, to'g'ri javoblar bilan ball hisoblash, AI, throttle) faqat **serverda `service_role` bilan** bajariladi. Oddiy o'qishlar to'g'ridan-to'g'ri RLS himoyasi ostida.

---

## Rollar va izolyatsiya

| Rol | Ko'lam |
|---|---|
| **admin** | Butun tizim: maktablar + maslahatchilar |
| **counselor** | FAQAT o'z maktabi (RLS: `get_my_school_id()` / `in_my_school()`) |
| **student** | O'z ma'lumotlari |

Maktab izolyatsiyasi RLS siyosatlari + `SECURITY DEFINER` yordamchi funksiyalar bilan ta'minlanadi. To'g'ri javoblar (`question_answer_keys`) alohida jadvalda — `authenticated` uchun SELECT yo'q (o'quvchi ko'rolmaydi → aldab bo'lmaydi).

---

## Ma'lumot oqimi — test yechish (asosiy oqim)

```
1. O'quvchi /test/$id ochadi
2. Mijoz test_sessions yozadi (RLS: o'ziniki), savollarni o'qiydi
3. Har javob → answers upsert (RLS himoyasi)
4. "Tugatish" → supabase.functions.invoke("complete-session")
5. Edge funksiya (service_role):
     • answers + question_answer_keys o'qiydi (himoyalangan)
     • scoring.ts: test_type bo'yicha ball (Holland/Ayzenk/IQ/...)
     • test_results yozadi
     • profile.ts: barcha natijalardan radar + IQ + kasb mosligi
     • student_profiles upsert
6. Mijoz /my-profile → radar, IQ darajasi, kasblar ko'rsatadi
```

---

## Papkalar

```
src/
  routes/                 # file-based sahifalar (admin.*, my-*, students*, ...)
  components/             # umumiy + ui/ (shadcn)
  integrations/supabase/  # client / client.server / auth-middleware (ajratilgan)
  hooks/                  # use-auth, use-my-profile (data-qatlam), use-mobile
  lib/                    # utils (unwrap), profile-display (iqLabel), i18n, theme
  tests/                  # Vitest: scoring, profile, unwrap, iqLabel, ProtectedRoute, ...
supabase/
  functions/              # Deno edge: complete-session, analyze-profile,
                          #   create/delete-student, create/manage-counselor,
                          #   submit-application + _shared/ (auth, cors, scoring, profile, claude)
  migrations/             # tartibli, idempotent SQL
  tests/                  # rls_school_isolation (pgTAP) + verify_data_integrity (read-only)
```

### Muhim modullar
| Fayl | Vazifa |
|---|---|
| `_shared/scoring.ts` | Sof funksiyalar: har test turi → natija (unit-test bilan) |
| `_shared/profile.ts` | Kasb mosligi + yig'ma profil (unit-test bilan) |
| `_shared/auth.ts` | getCaller (rol/maktab), logActivity, withinRateLimit, parol |
| `lib/utils.ts` `unwrap` | Supabase xatosini throw qiladi → React Query isError (jim yutmaslik) |
| `hooks/use-auth.ts` | Sessiya + rol; rol-xatoda "student"ga TUSHMAYDI (xavfsiz) |
| `hooks/use-my-profile.ts` | my-profile data-qatlami (UI'dan ajratilgan) |

---

## Stek

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 19, TanStack Start/Router/Query, Tailwind v4, shadcn/ui, Vite 7 |
| Hosting (frontend) | Netlify (SPA) |
| Backend | Supabase: Postgres + Auth + RLS + Edge Functions (Deno) |
| AI | Anthropic Claude (`analyze-profile`) |
| Test/CI | Vitest + Testing Library; GitHub Actions (tsc + eslint + vitest) |

---

## Xavfsizlik / xarajat nazorati (server)
- `verify_jwt=true` barcha imtiyozli funksiyalarda (`submit-application` bundan mustasno — anon landing, ichida IP/telefon throttle).
- `analyze-profile`: kesh (`ai_summary_at`) + kunlik limit → Claude xarajati nazorat.
- `create/delete` funksiyalari: `withinRateLimit` (activity_log orqali).
- `club_applications`: anon to'g'ridan-to'g'ri INSERT yopilgan — faqat throttle'li funksiya orqali.

---

## Bilib qo'yish kerak (cheklovlar)
- **Psixometrik chiqishlar validatsiyalanmagan** — IQ taxminiy (kam savol). UI sifat darajasini ko'rsatadi + disklaymer; raqamli "IQ" tashxis emas.
- `complete-session` orkestratsiyasi (Deno+DB) Vitest'da test qilinmaydi — sof scoring/profile mantiqi qoplangan; integratsiya uchun Deno test harness yoki pgTAP kerak.
- CORS hozir `*` (verify_jwt yumshatadi) — yakuniy domen barqarorlashgach allowlist tavsiya etiladi.
