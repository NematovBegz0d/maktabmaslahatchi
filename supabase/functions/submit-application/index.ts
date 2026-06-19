// Landing'dagi "Qiziqish bildirish" arizasini qabul qiladi — login SHART EMAS.
// Spam himoyasi (qatlamli):
//   • bir IP soatiga ko'pi bilan MAX_PER_IP_PER_HOUR ariza
//   • bir telefon (normallashtirilgan) PHONE_COOLDOWN_MIN daqiqada faqat 1 marta
//   • TURNSTILE_SECRET_KEY o'rnatilgan bo'lsa — Cloudflare Turnstile CAPTCHA
//   • ALLOWED_ORIGINS o'rnatilgan bo'lsa — CORS origin allowlist
// Yozish service_role bilan bo'ladi (anon to'g'ridan-to'g'ri INSERT qila olmaydi).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersFor, jsonResponseFor } from "../_shared/cors.ts";
import { adminClient } from "../_shared/auth.ts";

const MAX_PER_IP_PER_HOUR = 5;
const PHONE_COOLDOWN_MIN = 10;

interface Body {
  center_club_id?: string | null;
  club_name?: string | null;
  full_name?: string;
  phone?: string;
  note?: string | null;
  captcha_token?: string | null;
}

// Reverse-proxy ortidagi haqiqiy mijoz IP'si.
// MUHIM: x-forwarded-for'ning BIRINCHI qiymatini mijozning o'zi o'rnatishi
// mumkin (spoofing). Ishonchli infratuzilma haqiqiy IP'ni ro'yxatning OXIRIGA
// qo'shadi — shuning uchun oxirgi qiymatni olamiz.
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const parts = xff
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1];
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Telefonni normallashtirish: faqat raqamlar, oxirgi 9 tasi (O'zbekiston
// abonent raqami). Format variantlari bir kalitga to'planadi.
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

// Cloudflare Turnstile token'ini tekshirish (faqat secret o'rnatilgan bo'lsa).
async function verifyTurnstile(
  secret: string,
  token: string | null | undefined,
  ip: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[submit-application] turnstile verify error:", e);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersFor(req) });
  }
  if (req.method !== "POST") return jsonResponseFor(req, { error: "Faqat POST" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponseFor(req, { error: "JSON formatda yuborish kerak" }, 400);
  }

  const fullName = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const phoneNormalized = normalizePhone(phone);
  if (!fullName || phoneNormalized.length < 9) {
    return jsonResponseFor(req, { error: "Ism va to'g'ri telefon raqam kiriting" }, 400);
  }

  const admin = adminClient();
  const ip = clientIp(req);

  // 0) CAPTCHA (faqat TURNSTILE_SECRET_KEY o'rnatilgan bo'lsa majburiy)
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (turnstileSecret) {
    const ok = await verifyTurnstile(turnstileSecret, body.captcha_token, ip);
    if (!ok) {
      return jsonResponseFor(
        req,
        { error: "Bot tekshiruvidan o'tilmadi. Sahifani yangilab qayta urinib ko'ring." },
        403,
      );
    }
  }

  // 1) IP bo'yicha soatlik limit
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ipCount } = await admin
    .from("club_applications")
    .select("id", { count: "exact", head: true })
    .eq("submitted_ip", ip)
    .gte("created_at", hourAgo);
  if ((ipCount ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return jsonResponseFor(
      req,
      { error: "Juda ko'p ariza yuborildi. Bir oz vaqtdan so'ng qayta urinib ko'ring." },
      429,
    );
  }

  // 2) Telefon bo'yicha takror (normallashtirilgan kalit bo'yicha cooldown)
  const cooldownAgo = new Date(Date.now() - PHONE_COOLDOWN_MIN * 60 * 1000).toISOString();
  const { count: phoneCount } = await admin
    .from("club_applications")
    .select("id", { count: "exact", head: true })
    .eq("phone_normalized", phoneNormalized)
    .gte("created_at", cooldownAgo);
  if ((phoneCount ?? 0) >= 1) {
    return jsonResponseFor(
      req,
      { error: "Siz yaqinda ariza yubordingiz. Tez orada bog'lanamiz." },
      429,
    );
  }

  // 3) Saqlash (service_role — RLS chetlab o'tadi)
  const { error } = await admin.from("club_applications").insert({
    center_club_id: body.center_club_id ?? null,
    club_name: body.club_name ?? null,
    full_name: fullName,
    phone,
    phone_normalized: phoneNormalized,
    note: body.note?.trim() || null,
    status: "new",
    submitted_ip: ip,
  });
  if (error) {
    console.error("[submit-application] insert error:", error.message);
    return jsonResponseFor(req, { error: "Yuborilmadi. Qayta urinib ko'ring." }, 500);
  }

  return jsonResponseFor(req, { ok: true });
});
