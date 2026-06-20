// ===================================================================
// EduLens — complete-session orkestratsiyasi (sof, test qilinadigan)
// DB I/O `deps` orqali kiritiladi — shuning uchun bu modulda Deno/Supabase
// import'lari YO'Q va vitest'da to'liq test qilinadi. Haqiqiy Supabase ulanishi
// index.ts'dagi adapter'da bo'ladi.
// ===================================================================
import { scoreTest, type AnswerMap, type KeyMap, type QuestionLite } from "./scoring.ts";
import { aggregateProfile, matchCareers, type CareerRow, type ResultRow } from "./profile.ts";

export interface SessionRow {
  id: string;
  student_id: string;
  test_id: string;
  status: string;
}

export interface ResultUpsert {
  student_id: string;
  test_id: string;
  raw_scores: Record<string, number>;
  scaled_scores: Record<string, number>;
  personality_type: string | null;
  holland_code: string | null;
}

export interface ProfileUpsert {
  student_id: string;
  radar_scores: unknown;
  iq_scores: unknown;
  top_careers: unknown;
  profile_completeness: number;
}

// Barcha DB amallari — index.ts haqiqiy admin (service_role) klient bilan ta'minlaydi.
export interface CompleteDeps {
  getSession(sessionId: string): Promise<SessionRow | null>;
  getTestType(testId: string): Promise<string>;
  getQuestions(testId: string): Promise<QuestionLite[]>;
  getAnswers(sessionId: string): Promise<AnswerMap>;
  getKeys(questionIds: string[]): Promise<KeyMap>;
  upsertResult(row: ResultUpsert): Promise<{ error: string | null }>;
  getAllResults(studentId: string): Promise<ResultRow[]>;
  countActiveTests(): Promise<number>;
  getCareers(): Promise<CareerRow[]>;
  upsertProfile(row: ProfileUpsert): Promise<{ error: string | null }>;
  markCompleted(sessionId: string): Promise<{ error: string | null }>;
}

export interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

// To'g'ri javob kerak bo'ladigan test turlari (IQ + fan).
const KEYED_TYPES = new Set(["raven", "math_iq", "subject"]);

// Orkestratsiya. MUHIM kafolatlar (Bosqich 2 hardening):
//   • egalik tekshiruvi (boshqa o'quvchi sessiyasini yakunlab bo'lmaydi)
//   • idempotentlik (allaqachon 'completed' bo'lsa qayta hisoblamaydi)
//   • sessiya ENG OXIRIDA 'completed' bo'ladi — natija/profil yozuvi xato bersa,
//     sessiya ochiq qoladi va qayta urinish to'liq qayta hisoblaydi (ma'lumot
//     yo'qolmaydi).
export async function runCompleteSession(
  deps: CompleteDeps,
  userId: string,
  sessionId: string,
): Promise<Outcome> {
  const session = await deps.getSession(sessionId);
  if (!session) return { status: 404, body: { error: "Sessiya topilmadi" } };
  if (session.student_id !== userId) {
    return { status: 403, body: { error: "Bu sessiya sizga tegishli emas" } };
  }
  if (session.status === "completed") {
    return { status: 200, body: { ok: true, alreadyCompleted: true } };
  }

  const testType = await deps.getTestType(session.test_id);
  const qs = await deps.getQuestions(session.test_id);
  const answers = await deps.getAnswers(sessionId);

  let keys: KeyMap = {};
  if (KEYED_TYPES.has(testType)) {
    keys = await deps.getKeys(qs.map((q) => q.id));
  }

  const result = scoreTest(testType, qs, answers, keys);

  // Natijani ATOMIK yozish (unique indeksga tayanadi). Xato bo'lsa sessiya
  // ochiq qoladi — idempotentlik buzilmaydi.
  const resUp = await deps.upsertResult({
    student_id: userId,
    test_id: session.test_id,
    raw_scores: result.rawScores,
    scaled_scores: result.scaledScores,
    personality_type: result.personalityType,
    holland_code: result.hollandCode,
  });
  if (resUp.error) return { status: 500, body: { error: "Natijani saqlashda xatolik" } };

  const allResults = await deps.getAllResults(userId);
  const totalTests = await deps.countActiveTests();
  const agg = aggregateProfile(allResults, totalTests);

  const careers = await deps.getCareers();
  const topCareers = matchCareers(agg.holland_code, careers);

  const profUp = await deps.upsertProfile({
    student_id: userId,
    radar_scores: agg.radar_scores,
    iq_scores: agg.iq_scores,
    top_careers: topCareers,
    profile_completeness: agg.profile_completeness,
  });
  if (profUp.error) return { status: 500, body: { error: "Profilni yangilashda xatolik" } };

  // Faqat shu yerda — yuqoridagilar muvaffaqiyatli bo'lsagina — yakunlaymiz.
  const sessUp = await deps.markCompleted(sessionId);
  if (sessUp.error) return { status: 500, body: { error: "Sessiyani yakunlashda xatolik" } };

  return {
    status: 200,
    body: {
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
    },
  };
}
