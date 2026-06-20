// analytics.tsx sahifasi uchun sof agregatsiya mantig'i — UI'dan ajratilgan,
// vitest bilan qoplangan. Komponent faqat ma'lumotni yuklab, shu funksiyalarni chaqiradi.

export interface AnalyticsResult {
  holland_code: string | null;
  personality_type: string | null;
  test_id: string;
  tests: { name_uz: string } | null;
}
export interface AnalyticsProfile {
  profile_completeness: number | null;
  top_careers: { name_uz?: string; name?: string }[] | null;
}
export interface AnalyticsSubject {
  scaled_scores: Record<string, number> | null;
  tests: { name_uz: string | null; test_type: string | null } | null;
}

export const HOLLAND_NAMES: Record<string, string> = {
  R: "Realistik",
  I: "Tadqiqotchi",
  A: "Ijodkor",
  S: "Ijtimoiy",
  E: "Tadbirkor",
  C: "Konventsion",
};

// O'rtacha profil to'liqligi (%) — bo'sh ro'yxatda 0.
export function avgCompleteness(profiles: AnalyticsProfile[]): number {
  if (!profiles.length) return 0;
  return Math.round(
    profiles.reduce((a, p) => a + (p.profile_completeness ?? 0), 0) / profiles.length,
  );
}

// Holland yo'nalishlari taqsimoti (kod 1-harfi bo'yicha), bo'shlarsiz.
export function hollandDistribution(
  results: AnalyticsResult[],
): { name: string; short: string; value: number }[] {
  const counts: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const r of results) {
    const first = (r.holland_code ?? "").charAt(0).toUpperCase();
    if (first in counts) counts[first] += 1;
  }
  return Object.entries(counts)
    .map(([k, v]) => ({ name: HOLLAND_NAMES[k], short: k, value: v }))
    .filter((x) => x.value > 0);
}

// Temperament taqsimoti.
export function temperamentDistribution(
  results: AnalyticsResult[],
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const r of results) {
    if (r.personality_type) counts[r.personality_type] = (counts[r.personality_type] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

// Test mashhurligi (yechilganlar soni bo'yicha kamayuvchi).
export function testPopularity(results: AnalyticsResult[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const r of results) {
    const n = r.tests?.name_uz ?? "Test";
    counts[n] = (counts[n] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Eng ko'p tavsiya etilgan kasblar (top N).
export function topRecommendedCareers(
  profiles: AnalyticsProfile[],
  limit = 6,
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const p of profiles) {
    for (const c of p.top_careers ?? []) {
      const n = c.name_uz ?? c.name;
      if (n) counts[n] = (counts[n] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export interface SubjectStat {
  name: string;
  avgPercent: number;
  avgGrade: number;
  count: number;
  grades: Record<number, number>;
}

// Fan testlari statistikasi: fan bo'yicha o'rtacha foiz/baho + baho taqsimoti.
export function computeSubjectStats(subjectRows: AnalyticsSubject[]): SubjectStat[] {
  const agg: Record<string, { sumP: number; sumG: number; n: number; g: Record<number, number> }> =
    {};
  for (const r of subjectRows) {
    const name = r.tests?.name_uz ?? "Fan";
    const ss = r.scaled_scores ?? {};
    if (!agg[name]) agg[name] = { sumP: 0, sumG: 0, n: 0, g: { 2: 0, 3: 0, 4: 0, 5: 0 } };
    agg[name].sumP += ss.percent ?? 0;
    agg[name].sumG += ss.grade ?? 0;
    agg[name].n += 1;
    const gr = ss.grade ?? 2;
    if (gr >= 2 && gr <= 5) agg[name].g[gr] = (agg[name].g[gr] ?? 0) + 1;
  }
  return Object.entries(agg).map(([name, v]) => ({
    name,
    avgPercent: Math.round(v.sumP / v.n),
    avgGrade: Math.round((v.sumG / v.n) * 10) / 10,
    count: v.n,
    grades: v.g,
  }));
}
