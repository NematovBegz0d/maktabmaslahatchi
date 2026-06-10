import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AISummary } from "@/components/ai-summary";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/my-report")({
  head: () => ({ meta: [{ title: "Portfolio hisoboti — EduLens" }] }),
  component: () => (<ProtectedRoute><MyReport /></ProtectedRoute>),
});

const HOLLAND_INFO: Record<string, { label: string; desc: string }> = {
  R: { label: "Realistik", desc: "Amaliy, texnik, jismoniy ish" },
  I: { label: "Tadqiqotchi", desc: "Tahlil, fan, muammolarni hal qilish" },
  A: { label: "Ijodkor", desc: "San'at, ijod, ifoda erkinligi" },
  S: { label: "Ijtimoiy", desc: "Odamlar bilan ishlash, yordam berish" },
  E: { label: "Tadbirkor", desc: "Rahbarlik, biznes, ta'sir ko'rsatish" },
  C: { label: "Konventsion", desc: "Tartib, tizim, aniqlik" },
};

const TEMP_INFO: Record<string, { desc: string; strong: string }> = {
  Sangvinik: { desc: "Faol, ijtimoiy, xushchaqchaq", strong: "Muloqotchanlik, moslashuvchanlik, optimizm" },
  Xolerik: { desc: "Energik, qizg'in, tashabbuskor", strong: "Liderlik, qat'iyatlilik, tez qaror qilish" },
  Flegmatik: { desc: "Xotirjam, barqaror, ishonchli", strong: "Chidamlilik, diqqatlilik, ishonchlilik" },
  Melanxolik: { desc: "Sezgir, chuqur fikrlovchi", strong: "Ijodkorlik, tahliliy fikrlash, sezgirlik" },
};

function iqLabel(score: number) {
  if (score >= 130) return "A'lo darajali";
  if (score >= 115) return "Yuqori";
  if (score >= 100) return "O'rtadan yuqori";
  if (score >= 85) return "O'rtacha";
  return "Rivojlantirilishi kerak";
}

interface RadarItem { skill: string; value: number }
interface IqItem { type: string; score: number }
interface TopCareer { id: string; name_uz: string; description: string | null; required_skills: string[]; salary_range: string | null; universities?: { name: string; city?: string }[] }
interface ReportResult {
  id: string; holland_code: string | null; personality_type: string | null;
  raw_scores: Record<string, number> | null; scaled_scores: Record<string, number> | null;
  created_at: string; tests: { name_uz: string | null; test_type?: string | null } | null;
}
type SchoolRef = { name?: string; region?: string } | null;

function MyReport() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["report-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, class_number, class_letter, birth_date, schools(name, region)")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: sp } = useQuery({
    queryKey: ["report-sp", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("radar_scores, iq_scores, top_careers, ai_summary, profile_completeness")
        .eq("student_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: results } = useQuery({
    queryKey: ["report-results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("test_results")
        .select("id, holland_code, personality_type, raw_scores, scaled_scores, created_at, tests(name_uz, test_type)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as ReportResult[];
    },
  });

  const radarData = (sp?.radar_scores as RadarItem[] | null) ?? [];
  const iqData = (sp?.iq_scores as IqItem[] | null) ?? [];
  const topCareers = (sp?.top_careers as TopCareer[] | null) ?? [];
  const aiSummary = (sp?.ai_summary as string | null) ?? null;
  const completeness = sp?.profile_completeness ?? 0;
  const hollandCode = results?.find((r) => r.holland_code)?.holland_code ?? null;
  const temperament = results?.find((r) => r.personality_type)?.personality_type ?? null;

  // Fan testlari (subject)
  const subjectResults = (results ?? [])
    .filter((r) => r.tests?.test_type === "subject")
    .map((r) => {
      const ss = r.scaled_scores ?? {};
      return {
        name: r.tests?.name_uz ?? "Fan",
        percent: ss.percent ?? 0,
        grade: ss.grade ?? 0,
        correct: ss.correct ?? 0,
        total: ss.total ?? 0,
      };
    });

  const sorted = [...radarData].sort((a, b) => b.value - a.value);
  const strengths = sorted.slice(0, 3).filter((x) => x.value >= 50);

  const universities = Array.from(
    new Map(topCareers.flatMap((c) => c.universities ?? []).map((u) => [u.name, u])).values()
  ).slice(0, 4) as { name: string; city?: string }[];

  const today = new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-sheet { box-shadow: none !important; margin: 0 !important; width: 100% !important; border-radius: 0 !important; }
          @page { size: A4; margin: 12mm; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Boshqaruv (chop etilmaydi) */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/my-profile"><ArrowLeft className="mr-1.5 h-4 w-4" />Portfolioga qaytish</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />PDF / Chop etish
        </Button>
      </div>

      {/* Hisobot varag'i */}
      <div className="report-sheet mx-auto my-6 max-w-3xl rounded-xl bg-white shadow-xl">

        {/* ── SARLAVHA ── */}
        <div className="rounded-t-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <Logo />
              <p className="mt-1 text-sm text-indigo-200">Psixometrik portfolio hisoboti</p>
            </div>
            <p className="text-right text-sm text-indigo-200">{today}</p>
          </div>
        </div>

        <div className="p-8">

          {/* ── O'QUVCHI MA'LUMOTI ── */}
          <div className="mb-6 flex items-start gap-4 rounded-xl bg-slate-50 p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
              {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{profile?.full_name ?? "O'quvchi"}</h1>
              <p className="text-sm text-slate-500">
                {profile?.class_number ? `${profile.class_number}-${profile.class_letter ?? ""} sinf` : ""}
                {(profile?.schools as SchoolRef)?.name ? ` • ${(profile!.schools as SchoolRef)!.name}` : ""}
                {(profile?.schools as SchoolRef)?.region ? `, ${(profile!.schools as SchoolRef)!.region}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {hollandCode && hollandCode.split("").map((ch: string) => (
                  <span key={ch} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {ch} – {HOLLAND_INFO[ch]?.label}
                  </span>
                ))}
                {temperament && (
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                    {temperament}
                  </span>
                )}
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  To'liqlik: {completeness}%
                </span>
              </div>
            </div>
          </div>

          {/* ── GRAFIKLAR ── */}
          {radarData.length > 0 && (
            <div className="mb-6 grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Qobiliyatlar radari</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.35} isAnimationActive={false} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {iqData.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-700">Intellekt (taxminiy)</h3>
                  <p className="mb-2 text-[10px] text-amber-600">Rasmiy IQ testi emas — taxminiy nisbiy ball.</p>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={iqData}>
                        <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                        <YAxis domain={[60, 140]} tick={{ fontSize: 9 }} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#7C3AED" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {iqData.map((item) => (
                      <p key={item.type} className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{item.type}:</span> {item.score} — {iqLabel(item.score)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FAN BILIMLARI (subject testlar) ── */}
          {subjectResults.length > 0 && (
            <div className="mb-6 rounded-xl border border-slate-200 p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Fan bilimlari</h3>
              <div className="space-y-1.5">
                {subjectResults.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{s.name}</span>
                    <span className="text-slate-500">
                      {s.correct}/{s.total} • {s.percent}% — baho: <span className="font-bold text-slate-700">{s.grade}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SHAXSIY PORTRET ── */}
          {(hollandCode || temperament) && (
            <div className="mb-6 rounded-xl border border-slate-200 p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Shaxsiy portret</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {hollandCode && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Holland kasb yo'nalishi</p>
                    <div className="space-y-1">
                      {hollandCode.split("").map((ch: string) => (
                        <p key={ch} className="text-xs text-slate-700">
                          <span className="font-bold text-indigo-600">{ch}</span> — {HOLLAND_INFO[ch]?.label}: {HOLLAND_INFO[ch]?.desc}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {temperament && TEMP_INFO[temperament] && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Temperament</p>
                    <p className="text-sm font-semibold text-slate-800">{temperament}</p>
                    <p className="text-xs text-slate-500">{TEMP_INFO[temperament].desc}</p>
                    <p className="mt-1 text-xs text-slate-600">Kuchli tomonlar: {TEMP_INFO[temperament].strong}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── KUCHLI TOMONLAR ── */}
          {strengths.length > 0 && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="mb-2 text-sm font-semibold text-green-800">Kuchli tomonlar</h3>
              <div className="space-y-1.5">
                {strengths.map((s) => (
                  <div key={s.skill} className="flex items-center gap-2">
                    <span className="text-xs text-green-700">✓</span>
                    <span className="text-xs font-medium text-slate-700">{s.skill}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-green-200 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${s.value}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{s.value}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TEST NATIJALARI ── */}
          {results && results.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Test natijalari</h3>
              <div className="space-y-2">
                {results.map((r) => {
                  const scores = (r.scaled_scores ?? r.raw_scores) as Record<string, number> | null;
                  return (
                    <div key={r.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{r.tests?.name_uz ?? "Test"}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.holland_code && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">Holland: {r.holland_code}</span>
                        )}
                        {r.personality_type && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">{r.personality_type}</span>
                        )}
                      </div>
                      {scores && Object.keys(scores).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {Object.entries(scores).map(([key, val]) => (
                            <p key={key} className="text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{key}:</span> {val}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TOP KASBLAR ── */}
          {topCareers.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Tavsiya etilgan kasblar</h3>
              <div className="space-y-2">
                {topCareers.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.name_uz}</p>
                      {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                      {c.salary_range && <p className="mt-0.5 text-xs text-slate-400">Maosh: {c.salary_range}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── UNIVERSITETLAR ── */}
          {universities.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Tavsiya etilgan oliy ta'lim muassasalari</h3>
              <div className="grid grid-cols-2 gap-2">
                {universities.map((u, i) => (
                  <div key={u.name} className="flex items-center gap-2 rounded-lg border border-slate-100 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                      {u.city && <p className="text-xs text-slate-400">📍 {u.city}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI XULOSA ── */}
          {aiSummary && (
            <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-indigo-800">Psixologik xulosa (AI)</h3>
              <AISummary text={aiSummary} />
            </div>
          )}

          {/* Bo'sh holat */}
          {radarData.length === 0 && !aiSummary && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              Hisobot uchun ma'lumot yetarli emas. Avval testlarni yakunlang.
            </div>
          )}

          {/* Izoh */}
          <p className="mt-6 border-t pt-4 text-center text-[11px] leading-relaxed text-slate-400">
            Ushbu portfolio EduLens platformasi tomonidan ilmiy psixologik testlar asosida shakllantirildi.
            Natijalar maslahat xarakteriga ega — yakuniy qaror pedagog-psixolog tasdig'i bilan qabul qilinadi.
          </p>
        </div>
      </div>
    </div>
  );
}
