// ===================================================================
// EduLens — markaziy xato-hisoboti
//
// Avval `lovable-error-reporting.ts` `window.__lovableEvents` global'iga
// bog'liq edi — u faqat Lovable.ai preview muhitida mavjud, shuning uchun
// production'da (Netlify) JIM ishlamasdi (real monitoring yo'q edi).
//
// Endi:
//   1. Har doim console.error — brauzer konsoli VA SSR/Netlify funksiya
//      loglarida ko'rinadi (kamida ishonchli log).
//   2. Ixtiyoriy: VITE_ERROR_REPORT_URL o'rnatilsa, xato JSON sifatida o'sha
//      endpoint'ga POST qilinadi (Sentry-proxy / Supabase edge / o'z backend —
//      keyin to'liq monitoring ulash uchun tayyor hook).
// ===================================================================

export type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const route = typeof window !== "undefined" ? window.location.pathname : "ssr";

  // 1) Har doim log (production'da ham)
  console.error("[error]", error, { route, ...context });

  // 2) Ixtiyoriy uzoq endpoint — faqat sozlangan bo'lsa
  const url = import.meta.env.VITE_ERROR_REPORT_URL as string | undefined;
  if (!url || typeof fetch === "undefined") return;

  try {
    const payload = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      route,
      context,
      at: new Date().toISOString(),
    };
    // keepalive — sahifa yopilishida ham yuboriladi. Hisobot xatosini JIM yutamiz
    // (aks holda xato-hisoboti yana xato keltirib loop hosil qilishi mumkin).
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* xato-hisoboti hech qachon asosiy oqimni buzmasligi kerak */
  }
}
