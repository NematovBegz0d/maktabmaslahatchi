import { describe, it, expect } from "vitest";
import {
  matchCareers,
  aggregateProfile,
  type CareerRow,
  type ResultRow,
} from "../../supabase/functions/_shared/profile";

// ─── Yordamchi: kasb yozuvi ──────────────────────────────────────────────────
function career(id: string, name: string, codes: string[]): CareerRow {
  return {
    id,
    name_uz: name,
    description: null,
    holland_codes: codes,
    required_skills: ["ko'nikma"],
    salary_range: "5-10 mln",
    universities: [],
  };
}

// ─── matchCareers ────────────────────────────────────────────────────────────
describe("matchCareers", () => {
  const careers = [
    career("1", "Dasturchi", ["I", "R"]),
    career("2", "Psixolog", ["S", "I"]),
    career("3", "Buxgalter", ["C"]),
    career("4", "Rassom", ["A"]),
  ];

  it("Holland kodi yo'q bo'lsa bo'sh ro'yxat", () => {
    expect(matchCareers(null, careers)).toEqual([]);
  });

  it("pozitsiya vazni: 1-harf=3, 2-harf=2, 3-harf=1", () => {
    // Kod "IRS": I=3, R=2, S=1
    // Dasturchi [I,R] = 3+2 = 5; Psixolog [S,I] = 1+3 = 4; Buxgalter [C]=0 (filtrlanadi)
    const res = matchCareers("IRS", careers);
    expect(res[0].name_uz).toBe("Dasturchi");
    expect(res[0].match_score).toBe(5);
    expect(res[1].name_uz).toBe("Psixolog");
    expect(res[1].match_score).toBe(4);
  });

  it("ball 0 bo'lgan kasblar chiqarib tashlanadi", () => {
    const res = matchCareers("C", careers);
    // Faqat Buxgalter [C] mos keladi
    expect(res).toHaveLength(1);
    expect(res[0].name_uz).toBe("Buxgalter");
  });

  it("ko'pi bilan 5 ta kasb qaytadi", () => {
    const many = Array.from({ length: 10 }, (_, i) => career(String(i), `K${i}`, ["I"]));
    expect(matchCareers("I", many)).toHaveLength(5);
  });

  it("natija match_score bo'yicha kamayuvchi tartibda", () => {
    const res = matchCareers("IRS", careers);
    const scores = res.map((r) => r.match_score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

// ─── aggregateProfile ────────────────────────────────────────────────────────
describe("aggregateProfile", () => {
  function result(
    test_type: string,
    scaled: Record<string, number>,
    extra: Partial<ResultRow> = {},
  ): ResultRow {
    return {
      test_id: test_type,
      raw_scores: null,
      scaled_scores: scaled,
      personality_type: null,
      holland_code: null,
      test_type,
      ...extra,
    };
  }

  it("IQ: raven va math_iq o'rtachasi 'Umumiy' sifatida", () => {
    const results = [
      result("raven", { percent: 50, iq: 100 }),
      result("math_iq", { percent: 90, iq: 120 }),
    ];
    const agg = aggregateProfile(results, 8);
    const umumiy = agg.iq_scores.find((x) => x!.type === "Umumiy");
    expect(umumiy!.score).toBe(110); // round((100+120)/2)
    expect(agg.iq_scores.find((x) => x!.type === "Matematik")!.score).toBe(120);
    expect(agg.iq_scores.find((x) => x!.type === "Vizual")!.score).toBe(100);
  });

  it("radar: Intellekt = raven va math_iq foizlari o'rtachasi", () => {
    const agg = aggregateProfile(
      [result("raven", { percent: 40, iq: 94 }), result("math_iq", { percent: 60, iq: 106 })],
      8,
    );
    const intellekt = agg.radar_scores.find((x) => x.skill === "Intellekt");
    expect(intellekt!.value).toBe(50);
  });

  it("completeness = natijalar/jami testlar foizi (100 bilan cheklangan)", () => {
    const results = [result("holland", {}, { holland_code: "RIA" }), result("eq", { percent: 70 })];
    expect(aggregateProfile(results, 8).profile_completeness).toBe(25); // 2/8
  });

  it("completeness 100% dan oshmaydi", () => {
    const results = [result("holland", {}), result("eq", {})];
    expect(aggregateProfile(results, 1).profile_completeness).toBe(100);
  });

  it("ma'lumot bo'lmagan o'lchamlar radar va IQ'dan tushib qoladi", () => {
    const agg = aggregateProfile([result("eq", { percent: 80 })], 8);
    expect(agg.iq_scores).toHaveLength(0); // IQ testi yo'q
    expect(agg.radar_scores.every((x) => x.value != null)).toBe(true);
    expect(agg.radar_scores.find((x) => x.skill === "EQ")!.value).toBe(80);
  });

  it("holland_code va temperament tegishli testlardan olinadi", () => {
    const agg = aggregateProfile(
      [
        result("holland", {}, { holland_code: "SIA" }),
        result("eysenck", { extraversion: 80 }, { personality_type: "Sangvinik" }),
      ],
      8,
    );
    expect(agg.holland_code).toBe("SIA");
    expect(agg.personality_type).toBe("Sangvinik");
  });
});
