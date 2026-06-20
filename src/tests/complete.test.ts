import { describe, it, expect } from "vitest";
import {
  runCompleteSession,
  type CompleteDeps,
  type SessionRow,
} from "../../supabase/functions/_shared/complete";
import type { QuestionLite } from "../../supabase/functions/_shared/scoring";

// ─── Soxta deps (DB I/O o'rniga) ─────────────────────────────────────────────
const SESSION: SessionRow = { id: "s1", student_id: "u1", test_id: "t1", status: "in_progress" };

// Holland savollari: R eng yuqori bo'lishi uchun faqat R'ga 1 javob beramiz
const QS: QuestionLite[] = [
  { id: "qR", subscale: "R", question_type: "single", options: [{ value: 1, label: "" }] },
  { id: "qI", subscale: "I", question_type: "single", options: [{ value: 1, label: "" }] },
  { id: "qA", subscale: "A", question_type: "single", options: [{ value: 1, label: "" }] },
];

interface Harness {
  deps: CompleteDeps;
  calls: string[];
  upserts: { result?: Record<string, unknown>; profile?: Record<string, unknown> };
}

function makeHarness(opts: { session?: SessionRow | null } = {}): Harness {
  const calls: string[] = [];
  const upserts: Harness["upserts"] = {};
  const session = "session" in opts ? (opts.session ?? null) : SESSION;
  const deps: CompleteDeps = {
    async getSession() {
      calls.push("getSession");
      return session;
    },
    async getTestType() {
      calls.push("getTestType");
      return "holland";
    },
    async getQuestions() {
      calls.push("getQuestions");
      return QS;
    },
    async getAnswers() {
      calls.push("getAnswers");
      return { qR: 1 }; // faqat R'ga "ha"
    },
    async getKeys() {
      calls.push("getKeys");
      return {};
    },
    async upsertResult(row) {
      calls.push("upsertResult");
      upserts.result = row as unknown as Record<string, unknown>;
      return { error: null };
    },
    async getAllResults() {
      calls.push("getAllResults");
      return [];
    },
    async countActiveTests() {
      calls.push("countActiveTests");
      return 8;
    },
    async getCareers() {
      calls.push("getCareers");
      return [];
    },
    async upsertProfile(row) {
      calls.push("upsertProfile");
      upserts.profile = row as unknown as Record<string, unknown>;
      return { error: null };
    },
    async markCompleted() {
      calls.push("markCompleted");
      return { error: null };
    },
  };
  return { deps, calls, upserts };
}

describe("runCompleteSession", () => {
  it("sessiya topilmasa 404", async () => {
    const { deps } = makeHarness({ session: null });
    const out = await runCompleteSession(deps, "u1", "s1");
    expect(out.status).toBe(404);
  });

  it("boshqa o'quvchining sessiyasi bo'lsa 403 (hech narsa yozilmaydi)", async () => {
    const { deps, calls } = makeHarness();
    const out = await runCompleteSession(deps, "boshqa-user", "s1");
    expect(out.status).toBe(403);
    expect(calls).not.toContain("upsertResult");
    expect(calls).not.toContain("markCompleted");
  });

  it("allaqachon 'completed' bo'lsa idempotent — qayta hisoblamaydi", async () => {
    const { deps, calls } = makeHarness({
      session: { ...SESSION, status: "completed" },
    });
    const out = await runCompleteSession(deps, "u1", "s1");
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ ok: true, alreadyCompleted: true });
    expect(calls).not.toContain("upsertResult");
    expect(calls).not.toContain("markCompleted");
  });

  it("happy path: hisoblaydi, yozadi va TARTIB bilan yakunlaydi", async () => {
    const { deps, calls, upserts } = makeHarness();
    const out = await runCompleteSession(deps, "u1", "s1");
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ ok: true, testType: "holland" });
    // Scoring integratsiyasi: holland_code 3 harf, R eng kuchli
    expect(upserts.result).toMatchObject({ student_id: "u1", test_id: "t1" });
    expect(upserts.result?.holland_code).toBe("RIA");
    // KAFOLAT: natija -> profil -> yakunlash tartibi
    expect(calls.indexOf("upsertResult")).toBeLessThan(calls.indexOf("upsertProfile"));
    expect(calls.indexOf("upsertProfile")).toBeLessThan(calls.indexOf("markCompleted"));
  });

  it("natija yozishda xato -> 500 va sessiya YAKUNLANMAYDI (ma'lumot yo'qolmaydi)", async () => {
    const h = makeHarness();
    h.deps.upsertResult = async () => {
      h.calls.push("upsertResult");
      return { error: "db fail" };
    };
    const out = await runCompleteSession(h.deps, "u1", "s1");
    expect(out.status).toBe(500);
    expect(out.body.error).toBe("Natijani saqlashda xatolik");
    expect(h.calls).not.toContain("markCompleted");
  });

  it("profil yozishda xato -> 500 va sessiya YAKUNLANMAYDI", async () => {
    const h = makeHarness();
    h.deps.upsertProfile = async () => {
      h.calls.push("upsertProfile");
      return { error: "db fail" };
    };
    const out = await runCompleteSession(h.deps, "u1", "s1");
    expect(out.status).toBe(500);
    expect(out.body.error).toBe("Profilni yangilashda xatolik");
    expect(h.calls).not.toContain("markCompleted");
  });

  it("IQ testi (raven) -> to'g'ri javoblar (keys) so'raladi", async () => {
    const h = makeHarness();
    h.deps.getTestType = async () => "raven";
    const out = await runCompleteSession(h.deps, "u1", "s1");
    expect(h.calls).toContain("getKeys");
    expect(out.status).toBe(200);
  });

  it("holland (keysiz) testda keys so'ralmaydi", async () => {
    const { deps, calls } = makeHarness();
    await runCompleteSession(deps, "u1", "s1");
    expect(calls).not.toContain("getKeys");
  });
});
