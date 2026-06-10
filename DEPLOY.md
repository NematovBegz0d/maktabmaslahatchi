# EduLens — Deploy va sozlash qoʻllanmasi

Bu hujjat scoring tizimini (Edge Function + migratsiyalar) Supabase'ga
joylashtirish va loyihani ishga tushirish tartibini tushuntiradi.

---

## 📦 Nima qoʻshildi

| Fayl | Vazifasi |
|---|---|
| `supabase/functions/complete-session/index.ts` | Test tugagach ball hisoblaydi, natija va profilni yozadi |
| `supabase/functions/_shared/scoring.ts` | Holland, Ayzenk, Big5, IQ, umumiy ball hisoblash |
| `supabase/functions/_shared/profile.ts` | Kasb mosligi + yigʻma profil (radar, IQ) |
| `supabase/functions/_shared/cors.ts` | CORS sarlavhalari |
| `supabase/migrations/20260607120000_full_questions_seed.sql` | Holland 60, Ayzenk 57, Math IQ + kalitlar, Big5, EQ, Liderlik |
| `src/routes/test.$id.tsx` | `finishTest` endi Edge Function'ni chaqiradi |
| `src/routes/my-profile.tsx` | Real `student_profiles` maʼlumotini koʻrsatadi |

---

## 🟢 1-USUL: Lovable orqali (eng oson)

Agar loyiha Lovable bilan sinxron boʻlsa:

1. Bu oʻzgarishlarni GitHub'ga push qiling (Kiro buni qiladi).
2. Lovable GitHub'dan oʻzgarishlarni avtomatik oladi.
3. Lovable Cloud **migratsiyalarni** va **Edge Function'ni** avtomatik deploy qiladi.
4. Tayyor — testni yechib koʻring.

> Lovable'da "Sync" yoki "Pull from GitHub" tugmasini bosishingiz kerak boʻlishi mumkin.

---

## 🔵 2-USUL: Supabase CLI orqali (qoʻlda)

### Tayyorgarlik
```bash
# Supabase CLI oʻrnatish (agar yoʻq boʻlsa)
npm install -g supabase

# Loyihaga ulanish (project_id config.toml'da bor)
supabase login
supabase link --project-ref avfehwaamhzcydpbuitt
```

### Migratsiyani qoʻllash (savollar + kalitlar)
```bash
supabase db push
```

### Edge Function'ni deploy qilish
```bash
supabase functions deploy complete-session
```

> ✅ Scoring funksiyasi qoʻshimcha API kalit talab qilmaydi —
> u Supabase avtomatik beradigan `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY` muhit oʻzgaruvchilaridan foydalanadi.

---

## 💻 Frontendni ishga tushirish

`.env` faylida quyidagilar boʻlishi kerak (Lovable avtomatik qoʻyadi):
```
VITE_SUPABASE_URL=https://avfehwaamhzcydpbuitt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key>
```

Ishga tushirish:
```bash
bun install      # yoki npm install
bun run dev      # yoki npm run dev
```

---

## 🧪 Tekshirish (test oqimi)

1. Roʻyxatdan oʻting (rol: Oʻquvchi).
2. **Holland (RIASEC)** testini yeching (60 savol) → "Tugatish".
3. Edge Function ishga tushadi → natija hisoblanadi.
4. **Mening profilim** sahifasiga oʻting:
 - Radar grafik (qobiliyatlar)
 - Holland kodi (masalan, "RIA")
 - Sizga mos TOP 5 kasb
5. **Matematik IQ** testini yeching → profilingizda IQ koʻrsatkichlari paydo boʻladi.

---

## ⚙️ Scoring qanday ishlaydi

```
Test tugaydi (finishTest)
   ↓
supabase.functions.invoke("complete-session", { sessionId })
   ↓
Edge Function (serverda, service_role bilan):
   • javoblarni oʻqiydi
   • test_type bo'yicha ball hisoblaydi (Holland/Ayzenk/IQ/...)
   • IQ testlar uchun question_answer_keys'ni o'qiydi (himoyalangan!)
   • test_results jadviga yozadi
   • barcha natijalardan student_profiles ni qayta quradi
   • Holland kodiga qarab top 5 kasbni tanlaydi
   ↓
Frontend (my-profile) → radar, IQ, kasblarni ko'rsatadi
```

**Xavfsizlik:** toʻgʻri javoblar (`question_answer_keys`) faqat serverda
oʻqiladi — oʻquvchi hech qachon koʻra olmaydi (aldab boʻlmaydi).

---

## 📋 Keyingi bosqichlar (hali qilinmagan)

- 🤖 AI tahlil (Claude/GPT) — `analyze-profile` Edge Function
- 📄 PDF hisobot
- 📈 Maslahatchi analytics sahifasi
- 🖼 Raven IQ uchun rasmli savollar


---

## 🤖 AI tahlil (analyze-profile) — sozlash

AI tahlil Claude (Anthropic) API'dan foydalanadi. Ishlashi uchun API kalit kerak.

### 1. API kalit olish
[console.anthropic.com](https://console.anthropic.com) → API key yarating.

### 2. Supabase'ga maxfiy kalit qoʻshish
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# ixtiyoriy: model nomini oʻzgartirish
supabase secrets set CLAUDE_MODEL=claude-sonnet-4-20250514
```
> Lovable Cloud'da: Project Settings → Edge Functions → Secrets boʻlimiga `ANTHROPIC_API_KEY` qoʻshing.

### 3. Funksiyani deploy qilish
```bash
supabase functions deploy analyze-profile
```

### 4. Ishlatish
1. Oʻquvchi kamida 1 ta (yaxshisi 3+) test yakunlaydi.
2. **Mening profilim** → "AI tahlilini yaratish" tugmasi.
3. Claude natijalarni tahlil qiladi → kuchli tomonlar, rivojlanish sohalari,
   tavsiya etilgan yoʻnalishlar va 6 oylik reja paydo boʻladi.
4. Tahlil `student_profiles.ai_summary` ga saqlanadi (qayta ochilganda saqlanib qoladi).

> ⚠️ AI faqat **maslahat** beradi — yakuniy qaror pedagog-psixolog tasdigʻi bilan.


---

## 📄 PDF hisobot

PDF hisobot **server talab qilmaydi** — brauzerning chop etish imkoniyatidan foydalanadi:

1. Oʻquvchi **Mening profilim** → **Hisobot** tugmasini bosadi (`/my-report`).
2. Chop etishga moslashtirilgan, brendlangan hisobot sahifasi ochiladi
   (radar, IQ, mos kasblar, AI tahlil).
3. **"PDF / Chop etish"** tugmasi → brauzer chop etish oynasi →
   "Saqlash: PDF" ni tanlab, faylni yuklab oladi.

> Hech qanday qoʻshimcha kutubxona yoki Edge Function kerak emas —
> hamma joyda (telefon/kompyuter) ishlaydi.


---

## 🖼 Raven IQ — vizual (rasmli) savollar

Raven testi vizual mantiqiy naqsh savollaridan iborat. Rasmlar **SVG**
koʻrinishida bazada saqlanadi (tashqi fayl/hosting kerak emas).

- `questions.image_svg` — savol rasmi (ketma-ketlik + "?")
- `options[].svg` — variant rasmlari
- Toʻgʻri javob `question_answer_keys`'da (faqat serverda)
- Test interfeysi rasmli savol va variantlarni avtomatik koʻrsatadi (`question_type='matrix'`)

Migratsiyani qoʻllash: `supabase db push` (yoki Lovable avtomatik).
6 ta namunaviy savol qoʻshilgan (sanoq, burilish, tomonlar, shtrix, oʻlcham, pozitsiya).
