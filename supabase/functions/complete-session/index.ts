// ===================================================================
// EduLens — complete-session Edge Function
// Test tugagach: javoblarni hisoblaydi -> test_results yozadi ->
// student_profiles (radar, IQ, top kasblar) ni yangilaydi.
// Faqat service_role himoyalangan jadvallarga (answer keys, results)
// kira oladi — shuning uchun ball hisoblash SERVERDA bo'ladi.
//
// Orkestratsiya mantig'i _shared/complete.ts'da (sof, vitest bilan qoplangan).
// Bu fayl: auth + HTTP + Supabase adapter (DB I/O).
// ===================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import type { AnswerMap, KeyMap, QuestionLite } from "../_shared/scoring.ts";
import type { CareerRow, ResultRow } from "../_shared/profile.ts";
import { runCompleteSession, type CompleteDeps, type SessionRow } from "../_shared/complete.ts";

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

    // 4) Supabase adapter — orkestratsiyaga DB amallarini ulaydi
    const deps: CompleteDeps = {
      async getSession(id) {
        const { data } = await admin
          .from("test_sessions")
          .select("id, student_id, test_id, status")
          .eq("id", id)
          .maybeSingle();
        return (data as SessionRow | null) ?? null;
      },
      async getTestType(testId) {
        const { data } = await admin
          .from("tests")
          .select("id, test_type, name_uz")
          .eq("id", testId)
          .maybeSingle();
        return (data?.test_type as string | undefined) ?? "generic";
      },
      async getQuestions(testId) {
        const { data } = await admin
          .from("questions")
          .select("id, subscale, question_type, options")
          .eq("test_id", testId);
        return (data ?? []) as QuestionLite[];
      },
      async getAnswers(id) {
        const { data } = await admin
          .from("answers")
          .select("question_id, answer_value")
          .eq("session_id", id);
        const answers: AnswerMap = {};
        for (const a of data ?? []) {
          const v = (a.answer_value as { v?: number })?.v;
          if (typeof v === "number") answers[a.question_id] = v;
        }
        return answers;
      },
      async getKeys(questionIds) {
        const keys: KeyMap = {};
        const { data } = await admin
          .from("question_answer_keys")
          .select("question_id, correct_answer")
          .in("question_id", questionIds);
        for (const k of data ?? []) {
          const v = (k.correct_answer as { v?: number })?.v;
          if (typeof v === "number") keys[k.question_id] = v;
        }
        return keys;
      },
      async upsertResult(row) {
        const { error } = await admin
          .from("test_results")
          .upsert(row, { onConflict: "student_id,test_id" });
        if (error) console.error("[complete-session] test_results upsert:", error.message);
        return { error: error?.message ?? null };
      },
      async getAllResults(studentId) {
        const { data } = await admin
          .from("test_results")
          .select(
            "test_id, raw_scores, scaled_scores, personality_type, holland_code, tests(test_type)",
          )
          .eq("student_id", studentId);
        return (data ?? []).map((r) => ({
          test_id: r.test_id,
          raw_scores: r.raw_scores as Record<string, number> | null,
          scaled_scores: r.scaled_scores as Record<string, number> | null,
          personality_type: r.personality_type,
          holland_code: r.holland_code,
          test_type: (r.tests as { test_type?: string } | null)?.test_type ?? null,
        })) as ResultRow[];
      },
      async countActiveTests() {
        const { count } = await admin
          .from("tests")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);
        return count ?? 8;
      },
      async getCareers() {
        const { data } = await admin
          .from("careers")
          .select(
            "id, name_uz, description, holland_codes, required_skills, salary_range, universities",
          );
        return (data ?? []) as CareerRow[];
      },
      async upsertProfile(row) {
        const { error } = await admin
          .from("student_profiles")
          .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "student_id" });
        if (error) console.error("[complete-session] student_profiles upsert:", error.message);
        return { error: error?.message ?? null };
      },
      async markCompleted(id) {
        const { error } = await admin
          .from("test_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", id);
        if (error) console.error("[complete-session] session update:", error.message);
        return { error: error?.message ?? null };
      },
    };

    const outcome = await runCompleteSession(deps, userId, sessionId);
    return jsonResponse(outcome.body, outcome.status);
  } catch (e) {
    console.error("[complete-session] error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
