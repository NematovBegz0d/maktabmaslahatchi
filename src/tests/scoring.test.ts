import { describe, it, expect } from "vitest";
import {
  scoreTest,
  type QuestionLite,
  type AnswerMap,
  type KeyMap,
} from "../../supabase/functions/_shared/scoring";

// ─── Yordamchilar ────────────────────────────────────────────────────────────
let _id = 0;
function q(subscale: string | null, options: { value: number; label?: string }[]): QuestionLite {
  // Scoring faqat `value`ni o'qiydi — `label` majburiyligini yengillashtiramiz
  return {
    id: `q${++_id}`,
    subscale,
    question_type: "single",
    options: options as QuestionLite["options"],
  };
}
// 0/1 variantli savol (Holland, Ayzenk)
const BINARY = [
  { value: 1, label: "Ha" },
  { value: 0, label: "Yo'q" },
];
// barcha savollarni bitta qiymat bilan javoblash
function answerAll(qs: QuestionLite[], val: (q: QuestionLite, i: number) => number): AnswerMap {
  const a: AnswerMap = {};
  qs.forEach((qq, i) => (a[qq.id] = val(qq, i)));
  return a;
}

// ─── Holland (RIASEC) ────────────────────────────────────────────────────────
describe("scoreTest — holland", () => {
  it("Holland kodi xom ball bo'yicha eng yuqori 3 harf (kamayuvchi tartibda)", () => {
    // C=3 (3 savol), E=2 (2 savol), S=1 (1 savol), R/I/A=0
    const qs: QuestionLite[] = [
      q("C", BINARY),
      q("C", BINARY),
      q("C", BINARY),
      q("E", BINARY),
      q("E", BINARY),
      q("S", BINARY),
      q("R", BINARY),
      q("I", BINARY),
      q("A", BINARY),
    ];
    const answers = answerAll(qs, (qq) => (["C", "E", "S"].includes(qq.subscale!) ? 1 : 0));
    const res = scoreTest("holland", qs, answers, {});
    expect(res.hollandCode).toBe("CES");
    expect(res.rawScores).toMatchObject({ C: 3, E: 2, S: 1, R: 0, I: 0, A: 0 });
    // scaled = (raw/count)*100 — har bir to'ldirilgan harf 100%
    expect(res.scaledScores.C).toBe(100);
    expect(res.scaledScores.R).toBe(0);
  });

  it("javob berilmagan savol 0 deb hisoblanadi", () => {
    const qs = [q("R", BINARY), q("S", BINARY)];
    const res = scoreTest("holland", qs, {}, {});
    expect(res.rawScores).toMatchObject({ R: 0, S: 0 });
  });
});

// ─── Ayzenk (EPI) ────────────────────────────────────────────────────────────
describe("scoreTest — eysenck", () => {
  it("yuqori E + past N → Sangvinik, stabillik = 100-neyrotizm", () => {
    const qs = [q("E", BINARY), q("E", BINARY), q("N", BINARY), q("N", BINARY)];
    const answers = answerAll(qs, (qq) => (qq.subscale === "E" ? 1 : 0));
    const res = scoreTest("eysenck", qs, answers, {});
    expect(res.scaledScores.extraversion).toBe(100);
    expect(res.scaledScores.neuroticism).toBe(0);
    expect(res.scaledScores.stability).toBe(100);
    expect(res.personalityType).toBe("Sangvinik");
  });

  it("yuqori E + yuqori N → Xolerik", () => {
    const qs = [q("E", BINARY), q("N", BINARY)];
    const answers = answerAll(qs, () => 1);
    const res = scoreTest("eysenck", qs, answers, {});
    expect(res.personalityType).toBe("Xolerik");
  });

  it("past E + yuqori N → Melanxolik", () => {
    const qs = [q("E", BINARY), q("N", BINARY)];
    const answers: AnswerMap = { [qs[0].id]: 0, [qs[1].id]: 1 };
    const res = scoreTest("eysenck", qs, answers, {});
    expect(res.personalityType).toBe("Melanxolik");
  });

  it("L-shkala 55% dan oshsa natija ishonchsiz (reliable=0)", () => {
    const qs = [q("L", BINARY), q("L", BINARY), q("E", BINARY)];
    const answers: AnswerMap = { [qs[0].id]: 1, [qs[1].id]: 1, [qs[2].id]: 1 };
    const res = scoreTest("eysenck", qs, answers, {});
    expect(res.scaledScores.reliable).toBe(0);
  });

  it("L-shkala past bo'lsa natija ishonchli (reliable=1)", () => {
    const qs = [q("L", BINARY), q("L", BINARY), q("E", BINARY)];
    const answers: AnswerMap = { [qs[0].id]: 0, [qs[1].id]: 0, [qs[2].id]: 1 };
    const res = scoreTest("eysenck", qs, answers, {});
    expect(res.scaledScores.reliable).toBe(1);
  });
});

// ─── Big Five ────────────────────────────────────────────────────────────────
describe("scoreTest — big5", () => {
  it("har o'lcham raw/maxOpt bo'yicha foizga aylanadi", () => {
    const opts = [
      { value: 0, label: "Yo'q" },
      { value: 4, label: "To'liq" },
    ];
    // O = to'liq (4/4=100%), C = yarmi (2/4=50%)
    const qs = [q("O", opts), q("C", opts)];
    const answers: AnswerMap = { [qs[0].id]: 4, [qs[1].id]: 2 };
    const res = scoreTest("big5", qs, answers, {});
    expect(res.scaledScores.O).toBe(100);
    expect(res.scaledScores.C).toBe(50);
  });
});

// ─── IQ (Raven / Matematik) ──────────────────────────────────────────────────
describe("scoreTest — raven/math_iq", () => {
  it("to'g'ri javoblar foizidan IQ = 70 + foiz*0.6", () => {
    const qs = [q(null, BINARY), q(null, BINARY), q(null, BINARY), q(null, BINARY)];
    const keys: KeyMap = { [qs[0].id]: 1, [qs[1].id]: 1, [qs[2].id]: 1, [qs[3].id]: 1 };
    // 2/4 to'g'ri → 50% → iq = round(70 + 30) = 100
    const answers: AnswerMap = { [qs[0].id]: 1, [qs[1].id]: 1, [qs[2].id]: 0, [qs[3].id]: 0 };
    const res = scoreTest("raven", qs, answers, keys);
    expect(res.rawScores).toMatchObject({ correct: 2, total: 4 });
    expect(res.scaledScores.percent).toBe(50);
    expect(res.scaledScores.iq).toBe(100);
  });

  it("kalitsiz savollar hisobga olinmaydi (total faqat kalitli savollar)", () => {
    const qs = [q(null, BINARY), q(null, BINARY)];
    const keys: KeyMap = { [qs[0].id]: 1 }; // faqat bittasi
    const res = scoreTest("math_iq", qs, { [qs[0].id]: 1, [qs[1].id]: 1 }, keys);
    expect(res.rawScores.total).toBe(1);
    expect(res.scaledScores.percent).toBe(100);
  });
});

// ─── Fan testlari (5 balli baho) ─────────────────────────────────────────────
describe("scoreTest — subject (baho chegaralari)", () => {
  function gradeFor(correct: number, total: number): number {
    const qs = Array.from({ length: total }, () => q(null, BINARY));
    const keys: KeyMap = {};
    const answers: AnswerMap = {};
    qs.forEach((qq, i) => {
      keys[qq.id] = 1;
      answers[qq.id] = i < correct ? 1 : 0;
    });
    return scoreTest("subject", qs, answers, keys).scaledScores.grade;
  }

  it("86%+ → 5", () => expect(gradeFor(90, 100)).toBe(5));
  it("71–85% → 4", () => expect(gradeFor(80, 100)).toBe(4));
  it("56–70% → 3", () => expect(gradeFor(60, 100)).toBe(3));
  it("<56% → 2", () => expect(gradeFor(40, 100)).toBe(2));
  it("aniq chegara 86% → 5", () => expect(gradeFor(86, 100)).toBe(5));
  it("aniq chegara 71% → 4", () => expect(gradeFor(71, 100)).toBe(4));
});

// ─── Umumiy (EQ, liderlik va boshqalar) ──────────────────────────────────────
describe("scoreTest — generic (default)", () => {
  it("yig'indi/maksimum bo'yicha foiz", () => {
    const opts = [{ value: 0 }, { value: 1 }, { value: 2 }];
    // 2 savol, har biri max 2 → max 4; javob 2+1=3 → 75%
    const qs = [q(null, opts), q(null, opts)];
    const answers: AnswerMap = { [qs[0].id]: 2, [qs[1].id]: 1 };
    const res = scoreTest("eq", qs, answers, {});
    expect(res.scaledScores.percent).toBe(75);
    expect(res.scaledScores.score).toBe(75);
  });

  it("noma'lum test turi ham generic sifatida ishlaydi", () => {
    const qs = [q(null, [{ value: 0 }, { value: 1 }])];
    const res = scoreTest("allaqachon-yoq-tur", qs, { [qs[0].id]: 1 }, {});
    expect(res.scaledScores.percent).toBe(100);
  });
});
