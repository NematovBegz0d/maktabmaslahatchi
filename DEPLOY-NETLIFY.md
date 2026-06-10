# 🚀 Netlify'ga deploy qilish — EduLens

Loyiha **SPA (statik)** rejimida Netlify uchun tayyorlandi. Backend (Supabase) alohida,
allaqachon ishlayapti — Netlify faqat frontendni xizmat qiladi.

## ✅ Nima tayyorlandi
- **`vite.config.ts`** — SPA rejimi yoqildi (statik `index.html` shell prerender qilinadi)
- **`netlify.toml`** — build, publish papka, SPA fallback redirect, public env, keshlash
- **`.gitignore`** — `.env`, `dist`, `.netlify` chiqarildi
- Build sinovdan o'tdi: `dist/client/index.html` + assets + SPA fallback ishlaydi

---

## 1-USUL: Git + Netlify (tavsiya — avtomatik deploy)

### a) Git repo tayyorlash (agar hali bo'lmasa)
```bash
git init
git rm --cached .env        # .env'ni kuzatuvdan chiqarish (maxfiy, endi gitignore'da)
git add .
git commit -m "EduLens — Netlify deploy tayyor"
```
Keyin GitHub'da yangi repo yarating va push qiling:
```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

### b) Netlify'da ulash
1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. GitHub repo'ni tanlang
3. Build sozlamalari **`netlify.toml` dan avtomatik** o'qiladi:
   - Build command: `npm run build`
   - Publish: `dist/client`
4. **Deploy** bosing — tayyor! Har push'da avtomatik qayta deploy bo'ladi.

---

## 2-USUL: Netlify CLI (git'siz, tezkor)

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist/client
```

> Eslatma: CLI usulida ham `netlify.toml` env'lari ishlatiladi, lekin build'ni
> o'zingiz qilganingiz uchun `dist/client` tayyor bo'lishi kifoya.

---

## 🔑 Muhit o'zgaruvchilari (env)

`netlify.toml` ichida **public** qiymatlar allaqachon bor (xavfsiz — anon kalit
client bundle'ga baribir tushadi):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Override qilish** (ixtiyoriy): Netlify dashboard → **Site settings → Environment
variables** orqali o'rnatsangiz, dashboard qiymati ustun bo'ladi.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` Netlify'ga KERAK EMAS — frontend uni ishlatmaydi.

---

## 🔌 Supabase tomonida o'zgartirish kerakmi?

**Yo'q.** Ilova parol bilan kiradi (`signInWithPassword`) va Supabase data/auth API
hamma origin'ga ochiq (CORS `*`). Edge Function'lar ham `*` bilan. Shuning uchun
Netlify domeni qo'shimcha sozlamasiz ishlaydi.

*(Ixtiyoriy:* Supabase → Authentication → URL Configuration → **Site URL** ga Netlify
domeningizni qo'shsangiz, kelajakda email/magic-link oqimlari uchun foydali.)*

---

## 🧪 Deploy'dan keyin tekshirish
1. Netlify URL'ni oching → login sahifasi chiqishi kerak
2. Maslahatchi (admin) bilan kiring → boshqaruv paneli
3. Bir o'quvchi bilan kiring → testlar, profil
4. Chuqur yo'lni to'g'ridan oching (masalan `/dashboard`) → SPA fallback ishlashi kerak

---

## ❓ Muammolar
- **Oq ekran / "Missing Supabase env":** env o'rnatilmagan — `netlify.toml` yoki dashboard'ni tekshiring, qayta deploy qiling.
- **Sahifani yangilaganda 404:** SPA redirect ishlamayapti — `netlify.toml` dagi `[[redirects]]` bo'limini tekshiring.
- **Build xato (Node):** `netlify.toml` da `NODE_VERSION = "22"` — kerak bo'lsa "20" ga o'zgartiring.
