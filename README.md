# EduLens — Maktab maslahatchisi platformasi

O'zbekiston maktablari uchun **ko'p maktabli (multi-tenant) psixometrik va kasb-yo'naltirish** platformasi. O'quvchilar ilmiy testlarni yechadi, tizim natijalarni hisoblaydi (radar, IQ, kasb mosligi), ixtiyoriy ravishda Claude AI tahlil-hisobot yozadi. Maslahatchilar o'z maktabi o'quvchilarini boshqaradi, super admin maktablar va maslahatchilarni boshqaradi.

---

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 19, TanStack Start (SSR), TanStack Router (file-based), TanStack Query, Tailwind v4, shadcn/ui, Vite 7 |
| Backend | Supabase — Postgres + Auth + RLS + Edge Functions (Deno) |
| AI | Anthropic Claude (`analyze-profile` funksiyasida) |
| Deploy | Netlify (nitro) / Lovable Cloud |
| Test | Vitest + Testing Library |

## Rollar

- **admin** (super admin) — maktablar va maslahatchilarni boshqaradi, butun tizimni ko'radi.
- **counselor** (maslahatchi) — FAQAT o'z maktabi o'quvchilari bilan ishlaydi (RLS bilan ajratilgan).
- **student** (o'quvchi) — guvohnoma seriyasi bilan kiradi (`ibh1234567` → `ibh1234567@edulab.uz`), testlarni yechadi, profilini ko'radi.

## Arxitektura — ma'lumot oqimi

```
Brauzer (supabase-js, anon key)  ──RLS bilan o'qish/oddiy yozish──►  Postgres + RLS
       │
       │  imtiyozli amallar (Bearer token)
       ▼
Edge Functions (Deno, verify_jwt) ──service_role (RLS chetlab o'tadi)──►  Postgres
       │
       └──► Claude API (faqat analyze-profile)
```

**Tamoyil:** "ishonchli emas" amallar (foydalanuvchi yaratish, to'g'ri javoblar bilan ball hisoblash, AI) faqat serverda `service_role` bilan bajariladi. To'g'ri javoblar (`question_answer_keys`) alohida jadvalda — o'quvchi hech qachon ko'rmaydi.

### Edge Functions (`supabase/functions/`)

| Funksiya | Vazifa | Kim chaqiradi |
|---|---|---|
| `complete-session` | Test javoblarini serverda ballaydi, natija + profilni yozadi | o'quvchi |
| `analyze-profile` | Claude AI tahlil (kesh + kunlik limit bilan) | o'quvchi / staff |
| `create-student` | O'quvchi akkauntlari (bittalab yoki Excel import) | admin / maslahatchi |
| `create-counselor` | Maslahatchi akkaunti | admin |
| `manage-counselor` | Parol tiklash, maktab ko'chirish, bloklash | admin |
| `delete-student` | O'quvchini o'chirish (maktab chegarasi bilan) | admin / maslahatchi |
| `submit-application` | Landing'dagi to'garak arizasi (throttle bilan) | anon |

Ballash mantig'i (`scoring.ts`) va kasb mosligi (`profile.ts`) — sof funksiyalar, unit-test bilan qoplangan.

---

## Ishga tushirish (lokal)

`.env` fayli (Lovable avtomatik qo'yadi, yoki Supabase'dan oling):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon public key>
```

> `SUPABASE_SERVICE_ROLE_KEY` va `ANTHROPIC_API_KEY` faqat Supabase Edge Functions secrets'ida — repoda va `.env`da **bo'lmasligi kerak**.

```bash
npm install
npm run dev          # lokal dev server
```

## Skriptlar

| Buyruq | Vazifa |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit-testlar (Vitest) |
| `npm run test:watch` | Testlar (watch) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Testlar

```bash
npm test
```

Qamrov: `scoring.ts` (har test turi), `profile.ts` (kasb mosligi, yig'ma profil), `utils`, `theme`. 

DB darajasidagi tekshiruvlar (`supabase/tests/`):
- `rls_school_isolation.test.sql` — RLS maktab izolyatsiyasi (pgTAP, `supabase test db`).
- `verify_data_integrity.sql` — savol sonlari, javob kalitlari, RLS auditi (read-only).

## Deploy

Batafsil: [DEPLOY.md](DEPLOY.md). Qisqacha tartib (**migratsiya → funksiya → frontend**):

```bash
supabase db push                              # 1) migratsiyalar
supabase functions deploy <function-name>     # 2) edge funksiyalar
# 3) frontend — Netlify / Lovable avtomatik
```

Lovable bilan sinxron bo'lsa, hammasi avtomatik deploy bo'ladi.

---

## Loyiha tuzilishi

```
src/
  routes/            # file-based sahifalar (admin.*, my-*, students*, ...)
  components/        # umumiy komponentlar + ui/ (shadcn)
  integrations/supabase/  # mijoz, server (service_role), auth middleware
  hooks/ lib/ types/ tests/
supabase/
  functions/         # Deno edge funksiyalar + _shared/
  migrations/        # tartibli, idempotent SQL migratsiyalar
  tests/             # pgTAP + read-only tekshiruvlar
```
