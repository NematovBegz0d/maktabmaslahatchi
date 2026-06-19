// Umumiy CORS sarlavhalari — JWT bilan himoyalangan Edge Function'lar uchun.
// (Bularda asosiy himoya — verify_jwt, shuning uchun origin '*' qoladi.)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Origin allowlist (anon/ochiq funksiyalar uchun, masalan submit-application) ──
// `ALLOWED_ORIGINS` env (vergul bilan ajratilgan) o'rnatilsa, faqat o'sha
// origin'larga ruxsat beriladi. O'rnatilmasa — orqaga moslik uchun '*'.
// Eslatma: CORS faqat brauzerni cheklaydi; bot/skriptlarni to'xtatmaydi —
// ularga qarshi throttle va CAPTCHA ishlaydi. Bu — defense-in-depth.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function allowedOrigin(req: Request): string {
  if (ALLOWED_ORIGINS.length === 0) return "*";
  const origin = req.headers.get("Origin") ?? "";
  // Ruxsat etilgan bo'lsa — o'sha origin'ni qaytaramiz; aks holda birinchi
  // ruxsat etilganini (brauzer mos kelmasa so'rovni bloklaydi).
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export function corsHeadersFor(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(req),
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function jsonResponseFor(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}
