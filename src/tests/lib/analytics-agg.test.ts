import { describe, it, expect } from "vitest";
import {
  avgCompleteness,
  hollandDistribution,
  temperamentDistribution,
  testPopularity,
  topRecommendedCareers,
  computeSubjectStats,
  type AnalyticsResult,
  type AnalyticsProfile,
  type AnalyticsSubject,
} from "@/lib/analytics-agg";

const results: AnalyticsResult[] = [
  {
    holland_code: "RIA",
    personality_type: "Sangvinik",
    test_id: "t1",
    tests: { name_uz: "Holland" },
  },
  {
    holland_code: "RAS",
    personality_type: "Xolerik",
    test_id: "t1",
    tests: { name_uz: "Holland" },
  },
  {
    holland_code: "IAS",
    personality_type: "Sangvinik",
    test_id: "t2",
    tests: { name_uz: "Ayzenk" },
  },
  { holland_code: null, personality_type: null, test_id: "t3", tests: { name_uz: "Holland" } },
];

const profiles: AnalyticsProfile[] = [
  { profile_completeness: 50, top_careers: [{ name_uz: "Dasturchi" }, { name_uz: "Vrach" }] },
  { profile_completeness: 100, top_careers: [{ name_uz: "Dasturchi" }] },
  { profile_completeness: null, top_careers: null },
];

describe("avgCompleteness", () => {
  it("bo'sh ro'yxat -> 0", () => {
    expect(avgCompleteness([])).toBe(0);
  });
  it("null'lar 0 deb hisoblanadi va yaxlitlanadi", () => {
    expect(avgCompleteness(profiles)).toBe(50); // (50+100+0)/3
  });
});

describe("hollandDistribution", () => {
  it("1-harf bo'yicha sanaydi, nol'larni chiqarib tashlaydi", () => {
    expect(hollandDistribution(results)).toEqual([
      { name: "Realistik", short: "R", value: 2 },
      { name: "Tadqiqotchi", short: "I", value: 1 },
    ]);
  });
  it("null holland_code e'tiborga olinmaydi", () => {
    expect(hollandDistribution([{ ...results[3] }])).toEqual([]);
  });
});

describe("temperamentDistribution", () => {
  it("temperamentlarni sanaydi (null skip)", () => {
    expect(temperamentDistribution(results)).toEqual([
      { name: "Sangvinik", value: 2 },
      { name: "Xolerik", value: 1 },
    ]);
  });
});

describe("testPopularity", () => {
  it("test nomi bo'yicha sanaydi, kamayuvchi tartibda", () => {
    expect(testPopularity(results)).toEqual([
      { name: "Holland", value: 3 },
      { name: "Ayzenk", value: 1 },
    ]);
  });
});

describe("topRecommendedCareers", () => {
  it("kasblarni sanaydi va tartiblaydi", () => {
    expect(topRecommendedCareers(profiles)).toEqual([
      { name: "Dasturchi", value: 2 },
      { name: "Vrach", value: 1 },
    ]);
  });
  it("limitni hurmat qiladi", () => {
    expect(topRecommendedCareers(profiles, 1)).toEqual([{ name: "Dasturchi", value: 2 }]);
  });
});

describe("computeSubjectStats", () => {
  const subjects: AnalyticsSubject[] = [
    { scaled_scores: { percent: 90, grade: 5 }, tests: { name_uz: "Tarix", test_type: "subject" } },
    { scaled_scores: { percent: 70, grade: 3 }, tests: { name_uz: "Tarix", test_type: "subject" } },
  ];
  it("bo'sh -> []", () => {
    expect(computeSubjectStats([])).toEqual([]);
  });
  it("fan bo'yicha o'rtacha + baho taqsimoti", () => {
    const [s] = computeSubjectStats(subjects);
    expect(s.name).toBe("Tarix");
    expect(s.avgPercent).toBe(80);
    expect(s.avgGrade).toBe(4);
    expect(s.count).toBe(2);
    expect(s.grades).toEqual({ 2: 0, 3: 1, 4: 0, 5: 1 });
  });
});
