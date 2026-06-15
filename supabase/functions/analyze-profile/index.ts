// ===================================================================
// EduLens — analyze-profile Edge Function
// Oʻquvchining test natijalarini Claude AI'ga yuboradi va
// tushunarli tahlil (kuchli tomonlar, rivojlanish, 6 oylik reja)
// yaratib, student_profiles.ai_summary ga saqlaydi.
// ===================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude } from "../_shared/claude.ts";

function ageFrom(birth: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Foydalanuvchini aniqlash
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Avtorizatsiya talab qilinadi" }, 401);
    }
    const requesterId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const targetId: string = body?.studentId || requesterId;
    // force=true — keshni chetlab o'tib qayta yaratadi (lekin kunlik limit baribir amal qiladi)
    const force: boolean = body?.force === true;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 2) Agar boshqa oʻquvchi soʻralsa — rolni tekshirish (counselor/admin)
    if (targetId !== requesterId) {
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesterId);
      const allowed = (roles ?? []).some((r) => r.role === "counselor" || r.role === "admin");
      if (!allowed) return jsonResponse({ error: "Ruxsat yoʻq" }, 403);
    }

    // 3) Maʼlumotlarni yuklash
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, birth_date, gender, class_number")
      .eq("id", targetId)
      .maybeSingle();

    const { data: sp } = await admin
      .from("student_profiles")
      .select(
        "radar_scores, iq_scores, top_careers, profile_completeness, ai_summary, ai_summary_at",
      )
      .eq("student_id", targetId)
      .maybeSingle();

    const { data: results } = await admin
      .from("test_results")
      .select(
        "created_at, scaled_scores, personality_type, holland_code, tests(test_type, name_uz)",
      )
      .eq("student_id", targetId);

    const resultList = results ?? [];
    if (resultList.length === 0) {
      return jsonResponse({ error: "Avval kamida bitta testni yakunlang" }, 400);
    }

    // 3.5) KESH — oxirgi test natijasidan keyin yangi tahlil shart emasligini tekshirish.
    // ai_summary_at >= eng so'nggi test_results.created_at bo'lsa, mavjud tahlil hali
    // ham dolzarb: Claude'ni qayta chaqirmaymiz (pul tejaymiz).
    const latestResultAt = (resultList as { created_at?: string }[])
      .map((r) => r.created_at)
      .filter((d): d is string => !!d)
      .sort()
      .at(-1);
    if (
      !force &&
      sp?.ai_summary &&
      sp?.ai_summary_at &&
      latestResultAt &&
      new Date(sp.ai_summary_at).getTime() >= new Date(latestResultAt).getTime()
    ) {
      return jsonResponse({ ok: true, aiSummary: sp.ai_summary, cached: true });
    }

    // 3.6) KUNLIK LIMIT — chaqiruvchi 24 soatda ko'pi bilan DAILY_LIMIT marta yangi tahlil yaratadi.
    // (kesh qaytgan holatlar bu yerga yetib kelmaydi — faqat haqiqiy Claude chaqiruvi sanaladi)
    const DAILY_LIMIT = 5;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: usedToday } = await admin
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", requesterId)
      .eq("action", "ai_generated")
      .gte("created_at", since);
    if ((usedToday ?? 0) >= DAILY_LIMIT) {
      return jsonResponse(
        { error: `Kunlik AI tahlil limiti (${DAILY_LIMIT}) tugadi. Ertaga qayta urinib ko'ring.` },
        429,
      );
    }

    // 4) Promptni qurish (faqat mavjud maʼlumotdan)
    const age = ageFrom(profile?.birth_date ?? null);
    const lines: string[] = [];
    for (const r of resultList) {
      const tt = r.tests as { test_type?: string; name_uz?: string } | null;
      const ss = (r.scaled_scores as Record<string, number> | null) ?? {};
      const parts = Object.entries(ss)
        .filter(([k]) => k !== "reliable")
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      let line = `- ${tt?.name_uz ?? tt?.test_type}: ${parts}`;
      if (r.holland_code) line += `, Holland kodi=${r.holland_code}`;
      if (r.personality_type) line += `, Temperament=${r.personality_type}`;
      lines.push(line);
    }
    const topCareers = ((sp?.top_careers as { name_uz: string }[] | null) ?? [])
      .map((c) => c.name_uz)
      .join(", ");

    const systemPrompt =
      "Sen Oʻzbekistonda ishlayotgan tajribali taʼlim psixologi va kasb maslahatchisisan. " +
      "Faqat berilgan maʼlumotga asoslanasan; ijobiy va konstruktiv til ishlatasan; " +
      "Oʻzbekiston taʼlim tizimi realligini hisobga olasan. Bu MASLAHAT (hukm emas) — " +
      "yakuniy qaror pedagog-psixolog tasdigʻi bilan boʻladi. Faqat oʻzbek tilida (lotin) yozasan.";

    const userPrompt = `OʻQUVCHI: ${profile?.full_name ?? "Noma'lum"}${age ? `, ${age} yosh` : ""}${profile?.class_number ? `, ${profile.class_number}-sinf` : ""}

TEST NATIJALARI:
${lines.join("\n")}
${topCareers ? `\nMOS KASBLAR (tizim hisobladi): ${topCareers}` : ""}

Quyidagi tuzilmada, Markdown formatida yoz:
## Kuchli tomonlar
(3-5 ta, har biri natijaga asoslangan, qisqa)
## Rivojlantirish sohalari
(2-3 ta, ijobiy va konstruktiv shaklda)
## Shaxsiyat tavsifi
(2 ta qisqa paragraf)
## Tavsiya etilgan yoʻnalishlar
(2-3 ta kasb yoʻnalishi, nega mosligini asosla)
## 6 oylik rivojlanish rejasi
(4-5 ta aniq, amaliy qadam)`;

    // 5) Claude chaqiruvi
    const aiSummary = await callClaude(systemPrompt, userPrompt, 2000);

    // 6) Saqlash
    const nowIso = new Date().toISOString();
    await admin
      .from("student_profiles")
      .upsert(
        { student_id: targetId, ai_summary: aiSummary, ai_summary_at: nowIso, updated_at: nowIso },
        { onConflict: "student_id" },
      );

    // 7) Xarajat hisobi uchun jurnalga yozish — kunlik limit shu yozuvlardan sanaladi
    await admin.from("activity_log").insert({
      actor_id: requesterId,
      action: "ai_generated",
      target_id: targetId,
      target_label: profile?.full_name ?? null,
    });

    return jsonResponse({ ok: true, aiSummary });
  } catch (e) {
    console.error("[analyze-profile] error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
