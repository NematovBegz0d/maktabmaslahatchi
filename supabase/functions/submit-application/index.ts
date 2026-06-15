// Landing'dagi "Qiziqish bildirish" arizasini qabul qiladi — login SHART EMAS.
// Spam himoyasi:
//   • bir IP soatiga ko'pi bilan MAX_PER_IP_PER_HOUR ariza
//   • bir telefon PHONE_COOLDOWN_MIN daqiqada faqat 1 marta
// Yozish service_role bilan bo'ladi (anon endi to'g'ridan-to'g'ri INSERT qila olmaydi).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/auth.ts";

const MAX_PER_IP_PER_HOUR = 5;
const PHONE_COOLDOWN_MIN = 10;

interface Body {
  center_club_id?: string | null;
  club_name?: string | null;
  full_name?: string;
  phone?: string;
  note?: string | null;
}

// Reverse-proxy ortidagi haqiqiy mijoz IP'si (birinchi qiymat)
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Faqat POST" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON formatda yuborish kerak" }, 400);
  }

  const fullName = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const phoneDigits = phone.replace(/\D/g, "");
  if (!fullName || phoneDigits.length < 9) {
    return jsonResponse({ error: "Ism va to'g'ri telefon raqam kiriting" }, 400);
  }

  const admin = adminClient();
  const ip = clientIp(req);

  // 1) IP bo'yicha soatlik limit
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ipCount } = await admin
    .from("club_applications")
    .select("id", { count: "exact", head: true })
    .eq("submitted_ip", ip)
    .gte("created_at", hourAgo);
  if ((ipCount ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return jsonResponse(
      { error: "Juda ko'p ariza yuborildi. Bir oz vaqtdan so'ng qayta urinib ko'ring." },
      429,
    );
  }

  // 2) Telefon bo'yicha takror (cooldown)
  const cooldownAgo = new Date(Date.now() - PHONE_COOLDOWN_MIN * 60 * 1000).toISOString();
  const { count: phoneCount } = await admin
    .from("club_applications")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", cooldownAgo);
  if ((phoneCount ?? 0) >= 1) {
    return jsonResponse({ error: "Siz yaqinda ariza yubordingiz. Tez orada bog'lanamiz." }, 429);
  }

  // 3) Saqlash (service_role — RLS chetlab o'tadi)
  const { error } = await admin.from("club_applications").insert({
    center_club_id: body.center_club_id ?? null,
    club_name: body.club_name ?? null,
    full_name: fullName,
    phone,
    note: body.note?.trim() || null,
    status: "new",
    submitted_ip: ip,
  });
  if (error) {
    console.error("[submit-application] insert error:", error.message);
    return jsonResponse({ error: "Yuborilmadi. Qayta urinib ko'ring." }, 500);
  }

  return jsonResponse({ ok: true });
});
