// ===================================================================
// EduLens — Kasb mosligi va yig'ma profil hisoblash
// ===================================================================

export interface CareerRow {
  id: string;
  name_uz: string;
  description: string | null;
  holland_codes: string[] | null;
  required_skills: string[] | null;
  salary_range: string | null;
  universities: unknown;
}

export interface ResultRow {
  test_id: string;
  raw_scores: Record<string, number> | null;
  scaled_scores: Record<string, number> | null;
  personality_type: string | null;
  holland_code: string | null;
  test_type?: string | null;
}

// --- Kasb mosligi: Holland kodi -> top 5 kasb ----------------------
// Har bir kasbning holland_codes'i o'quvchi kodidagi harflar bilan
// qanchalik mos kelishiga qarab ball beriladi. Kod boshidagi harf
// (eng kuchli qiziqish) ko'proq vazn oladi.
export function matchCareers(hollandCode: string | null, careers: CareerRow[]) {
  if (!hollandCode) return [];
  const letters = hollandCode.toUpperCase().split("");
  // Pozitsiyaga qarab vazn: 1-harf=3, 2-harf=2, 3-harf=1
  const weight: Record<string, number> = {};
  letters.forEach((l, i) => { weight[l] = 3 - i; });

  const scored = careers.map((c) => {
    let score = 0;
    for (const code of c.holland_codes ?? []) {
      score += weight[code.toUpperCase()] ?? 0;
    }
    return { career: c, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => ({
      id: x.career.id,
      name_uz: x.career.name_uz,
      description: x.career.description,
      required_skills: x.career.required_skills ?? [],
      salary_range: x.career.salary_range,
      universities: x.career.universities ?? [],
      match_score: x.score,
    }));
}

// --- Yig'ma profil: barcha natijalardan radar va IQ qurish ---------
export function aggregateProfile(
  results: ResultRow[],
  totalTests: number,
) {
  const byType: Record<string, ResultRow> = {};
  for (const r of results) {
    if (r.test_type) byType[r.test_type] = r;
  }

  const pct = (t: string, key: string): number | null => {
    const s = byType[t]?.scaled_scores;
    if (!s || s[key] == null) return null;
    return s[key];
  };

  // 6 ta asosiy qobiliyat (radar)
  const intellektVals = [pct("raven", "percent"), pct("math_iq", "percent")].filter(
    (v): v is number => v != null,
  );
  const intellekt = intellektVals.length
    ? Math.round(intellektVals.reduce((a, b) => a + b, 0) / intellektVals.length)
    : null;

  const ijodkorlik = pct("creativity", "percent") ?? pct("big5", "O");
  const eq = pct("eq", "percent");
  const diqqat = pct("schulte", "percent") ?? pct("attention", "percent");
  const liderlik = pct("leadership", "percent");
  const stress = pct("eysenck", "stability");

  const radar = [
    { skill: "Intellekt", value: intellekt },
    { skill: "Ijodkorlik", value: ijodkorlik },
    { skill: "EQ", value: eq },
    { skill: "Diqqat", value: diqqat },
    { skill: "Liderlik", value: liderlik },
    { skill: "Stress-chidamlilik", value: stress },
  ].filter((x) => x.value != null);

  // IQ ko'rsatkichlari
  const ravenIq = byType["raven"]?.scaled_scores?.iq ?? null;
  const mathIq = byType["math_iq"]?.scaled_scores?.iq ?? null;
  const iqVals = [ravenIq, mathIq].filter((v): v is number => v != null);
  const umumiy = iqVals.length
    ? Math.round(iqVals.reduce((a, b) => a + b, 0) / iqVals.length)
    : null;

  const iqScores = [
    umumiy != null ? { type: "Umumiy", score: umumiy } : null,
    mathIq != null ? { type: "Matematik", score: mathIq } : null,
    ravenIq != null ? { type: "Vizual", score: ravenIq } : null,
  ].filter(Boolean);

  const hollandCode = byType["holland"]?.holland_code ?? null;
  const mbti = byType["eysenck"]?.personality_type ?? null;

  const completeness = Math.min(
    100,
    Math.round((results.length / Math.max(totalTests, 1)) * 100),
  );

  return {
    radar_scores: radar,
    iq_scores: iqScores,
    holland_code: hollandCode,
    personality_type: mbti,
    profile_completeness: completeness,
  };
}
