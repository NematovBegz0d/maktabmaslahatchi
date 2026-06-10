// ===================================================================
// EduLens — complete-session Edge Function
// Test tugagach: javoblarni hisoblaydi -> test_results yozadi ->
// student_profiles (radar, IQ, top kasblar) ni yangilaydi.
// Faqat service_role himoyalangan jadvallarga (answer keys, results)
// kira oladi — shuning uchun ball hisoblash SERVERDA bo'ladi.
// ===================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { scoreTest, type AnswerMap, type KeyMap, type QuestionLite } from "../_shared/scoring.ts";
import { aggregateProfile, matchCareers, type CareerRow, type ResultRow } from "../_shared/profile.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Foydalanuvchini aniqlash (JWT orqali)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Avtorizatsiya talab qilinadi" }, 401);
    }
    const userId = userData.user.id;

    // 2) Body
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) {
      return jsonResponse({ error: "sessionId kerak" }, 400);
    }

    // 3) Admin klient (service_role) — himoyalangan ma'lumotlar uchun
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 4) Sessiyani yuklash va egaligini tekshirish
    const { data: session } = await admin
      .from("test_sessions")
      .select("id, student_id, test_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) return jsonResponse({ error: "Sessiya topilmadi" }, 404);
    if (session.student_id !== userId) {
      return jsonResponse({ error: "Bu sessiya sizga tegishli emas" }, 403);
    }

    // 5) Test turi
    const { data: test } = await admin
      .from("tests")
      .select("id, test_type, name_uz")
      .eq("id", session.test_id)
      .maybeSingle();
    const testType = test?.test_type ?? "generic";

    // 6) Savollar
    const { data: questions } = await admin
      .from("questions")
      .select("id, subscale, question_type, options")
      .eq("test_id", session.test_id);
    const qs = (questions ?? []) as QuestionLite[];

    // 7) Javoblar -> { questionId: value }
    const { data: answerRows } = await admin
      .from("answers")
      .select("question_id, answer_value")
      .eq("session_id", sessionId);
    const answers: AnswerMap = {};
    for (const a of answerRows ?? []) {
      const v = (a.answer_value as { v?: number })?.v;
      if (typeof v === "number") answers[a.question_id] = v;
    }

    // 8) To'g'ri javoblar (faqat IQ testlar uchun, service_role o'qiydi)
    const keys: KeyMap = {};
    if (testType === "raven" || testType === "math_iq" || testType === "subject") {
      const qIds = qs.map((q) => q.id);
      const { data: keyRows } = await admin
        .from("question_answer_keys")
        .select("question_id, correct_answer")
        .in("question_id", qIds);
      for (const k of keyRows ?? []) {
        const v = (k.correct_answer as { v?: number })?.v;
        if (typeof v === "number") keys[k.question_id] = v;
      }
    }

    // 9) Ball hisoblash
    const result = scoreTest(testType, qs, answers, keys);

    // 10) Eski natijani o'chirib, yangisini yozish (qayta hisoblashda dublikat bo'lmasligi uchun)
    await admin
      .from("test_results")
      .delete()
      .eq("student_id", userId)
      .eq("test_id", session.test_id);

    await admin.from("test_results").insert({
      student_id: userId,
      test_id: session.test_id,
      raw_scores: result.rawScores,
      scaled_scores: result.scaledScores,
      personality_type: result.personalityType,
      holland_code: result.hollandCode,
    });

    // 11) Sessiyani yakunlash
    await admin
      .from("test_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    // 12) Yig'ma profilni qayta qurish (barcha natijalar asosida)
    const { data: allResults } = await admin
      .from("test_results")
      .select("test_id, raw_scores, scaled_scores, personality_type, holland_code, tests(test_type)")
      .eq("student_id", userId);

    const normalized: ResultRow[] = (allResults ?? []).map((r) => ({
      test_id: r.test_id,
      raw_scores: r.raw_scores as Record<string, number> | null,
      scaled_scores: r.scaled_scores as Record<string, number> | null,
      personality_type: r.personality_type,
      holland_code: r.holland_code,
      test_type: (r.tests as { test_type?: string } | null)?.test_type ?? null,
    }));

    const { count: totalTests } = await admin
      .from("tests")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const agg = aggregateProfile(normalized, totalTests ?? 8);

    // 13) Kasb mosligi (Holland kodi asosida)
    const { data: careers } = await admin
      .from("careers")
      .select("id, name_uz, description, holland_codes, required_skills, salary_range, universities");
    const topCareers = matchCareers(agg.holland_code, (careers ?? []) as CareerRow[]);

    // 14) student_profiles upsert
    await admin
      .from("student_profiles")
      .upsert(
        {
          student_id: userId,
          radar_scores: agg.radar_scores,
          iq_scores: agg.iq_scores,
          top_careers: topCareers,
          profile_completeness: agg.profile_completeness,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" },
      );

    return jsonResponse({
      ok: true,
      testType,
      result: {
        rawScores: result.rawScores,
        scaledScores: result.scaledScores,
        personalityType: result.personalityType,
        hollandCode: result.hollandCode,
      },
      profile: {
        completeness: agg.profile_completeness,
        hollandCode: agg.holland_code,
        topCareers: topCareers.map((c) => c.name_uz),
      },
    });
  } catch (e) {
    console.error("[complete-session] error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
