import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AISummary } from "@/components/ai-summary";
import { SubjectResults, type SubjectResult } from "@/components/subject-results";
import { QueryError } from "@/components/query-error";
import { PortfolioSkeleton } from "@/components/portfolio-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import {
  Sparkles, GraduationCap, Briefcase, Award, FileText, Brain,
  Heart, Zap, Target, BookOpen, CheckCircle2, Circle, TrendingUp,
  User, School, Printer, Trophy, Activity,
} from "lucide-react";
import { ClubBadge } from "@/components/club-badge";
import type { ClubColor } from "@/types/clubs";

export const Route = createFileRoute("/my-profile")({
  head: () => ({ meta: [{ title: "Mening portfoliom — EduLens" }] }),
  component: () => (<ProtectedRoute><MyProfile /></ProtectedRoute>),
});

// ─── Holland kodi ta'riflari ───────────────────────────────────────────────
const HOLLAND_INFO: Record<string, { label: string; desc: string; color: string }> = {
  R: { label: "Realistik", desc: "Amaliy, texnik, jismoniy ish yoqadi", color: "bg-orange-100 text-orange-700" },
  I: { label: "Tadqiqotchi", desc: "Tahlil, fan, muammolarni hal qilish", color: "bg-blue-100 text-blue-700" },
  A: { label: "Ijodkor", desc: "San'at, ijod, ifoda erkinligi", color: "bg-purple-100 text-purple-700" },
  S: { label: "Ijtimoiy", desc: "Odamlar bilan ishlash, yordam berish", color: "bg-green-100 text-green-700" },
  E: { label: "Tadbirkor", desc: "Rahbarlik, biznes, ta'sir ko'rsatish", color: "bg-red-100 text-red-700" },
  C: { label: "Konventsion", desc: "Tartib, tizim, aniqlik", color: "bg-gray-100 text-gray-700" },
};

// ─── Temperament ta'riflari ────────────────────────────────────────────────
const TEMP_INFO: Record<string, { emoji: string; desc: string; strong: string; develop: string }> = {
  Sangvinik: {
    emoji: "😊", desc: "Faol, ijtimoiy, xushchaqchaq",
    strong: "Muloqotchanlik, moslashuvchanlik, optimizm",
    develop: "Ishni oxiriga yetkazish, diqqatni jamlash",
  },
  Xolerik: {
    emoji: "⚡", desc: "Energik, qizg'in, tashabbuskor",
    strong: "Liderlik, qat'iyatlilik, tez qaror qilish",
    develop: "Sabr-toqat, hissiyotlarni boshqarish",
  },
  Flegmatik: {
    emoji: "🧘", desc: "Xotirjam, barqaror, ishonchli",
    strong: "Chidamlilik, diqqatlilik, ishonchlilik",
    develop: "Tashabbuskorlik, o'zgarishlarga moslashish",
  },
  Melanxolik: {
    emoji: "🎨", desc: "Sezgir, chuqur fikrlovchi, intiluvchi",
    strong: "Ijodkorlik, tahliliy fikrlash, sezgirlik",
    develop: "O'ziga ishonch, stressni boshqarish",
  },
};

// ─── IQ interpretatsiya ────────────────────────────────────────────────────
function iqLabel(score: number) {
  if (score >= 130) return { text: "A'lo darajali", color: "text-purple-600" };
  if (score >= 115) return { text: "Yuqori", color: "text-blue-600" };
  if (score >= 100) return { text: "O'rtadan yuqori", color: "text-green-600" };
  if (score >= 85) return { text: "O'rtacha", color: "text-yellow-600" };
  return { text: "Rivojlantirilishi kerak", color: "text-red-500" };
}

// ─── Radar rangi ──────────────────────────────────────────────────────────
const RADAR_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

interface RadarItem { skill: string; value: number }
interface IqItem { type: string; score: number }
interface TopCareer {
  id: string; name_uz: string; description: string | null;
  required_skills: string[]; salary_range: string | null;
  universities?: { name: string; city?: string }[];
}
interface ResultRow {
  id: string; test_id: string;
  holland_code: string | null; personality_type: string | null;
  raw_scores: Record<string, number> | null;
  scaled_scores: Record<string, number> | null;
  created_at: string;
  tests: { name_uz: string | null; category?: string | null; test_type?: string | null } | null;
}
interface ClubMembership {
  id: string; joined_at: string;
  clubs: { id: string; name: string; icon: string; color: string } | null;
}
interface AllTest { id: string; name_uz: string | null; category?: string | null }
type SchoolRef = { name?: string; region?: string } | null;

function MyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [aiBusy, setAiBusy] = useState(false);

  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: profileRefetch } = useQuery({
    queryKey: ["profile-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, schools(name, region)")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: sp, isLoading: spLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("radar_scores, iq_scores, top_careers, profile_completeness, ai_summary")
        .eq("student_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["my-results-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("test_results")
        .select("id, test_id, holland_code, personality_type, raw_scores, scaled_scores, created_at, tests(name_uz, category, test_type)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as ResultRow[];
    },
  });

  // Mening klublarim
  const { data: myClubs } = useQuery({
    // Distinct key: my-clubs sahifasi ["my-clubs-detail", uid] dan foydalanadi
    queryKey: ["my-clubs-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("club_members")
        .select("id, joined_at, clubs(*)")
        .eq("student_id", user!.id)
        .order("joined_at", { ascending: false });
      return (data ?? []) as ClubMembership[];
    },
  });

  const { data: allTests } = useQuery({
    queryKey: ["all-tests"],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("id, name_uz, category").eq("is_active", true);
      return (data ?? []) as AllTest[];
    },
  });

  const loading = profileLoading || spLoading || resultsLoading;
  const isError = profileError;

  const radarData = (sp?.radar_scores as RadarItem[] | null) ?? [];
  const iqData = (sp?.iq_scores as IqItem[] | null) ?? [];
  const topCareers = (sp?.top_careers as TopCareer[] | null) ?? [];
  const completeness = sp?.profile_completeness ?? 0;
  const hollandCode = results?.find((r) => r.holland_code)?.holland_code ?? null;
  const temperament = results?.find((r) => r.personality_type)?.personality_type ?? null;
  const aiSummary = sp?.ai_summary ?? null;
  const completedTestIds = new Set((results ?? []).map((r) => r.test_id));
  const totalTests = allTests?.length ?? 8;
  const completedCount = completedTestIds.size;

  // Fan testlari (subject) — alohida; psixologik natijalardan ajratamiz
  const subjectResults: SubjectResult[] = (results ?? [])
    .filter((r) => r.tests?.test_type === "subject")
    .map((r) => {
      const ss = (r.scaled_scores as Record<string, number> | null) ?? {};
      return {
        test_id: r.test_id,
        name: r.tests?.name_uz ?? "Fan",
        percent: ss.percent ?? 0,
        grade: ss.grade ?? 0,
        correct: ss.correct ?? 0,
        total: ss.total ?? 0,
      };
    });
  const psychResults = (results ?? []).filter((r) => r.tests?.test_type !== "subject");

  // Kuchli va zaif tomonlar — radar ma'lumotidan
  const sorted = [...radarData].sort((a, b) => b.value - a.value);
  const strengths = sorted.slice(0, 3).filter((x) => x.value >= 50);
  const improvements = sorted.slice(-3).filter((x) => x.value < 60);

  // OTM ro'yxati
  const universities = Array.from(
    new Map(topCareers.flatMap((c) => c.universities ?? []).map((u) => [u.name, u])).values()
  ).slice(0, 6);

  async function generateAI() {
    setAiBusy(true);
    const { error } = await supabase.functions.invoke("analyze-profile", { body: {} });
    setAiBusy(false);
    if (error) { toast.error("AI tahlilni yaratib bo'lmadi"); return; }
    toast.success("AI tahlil tayyor!");
    queryClient.invalidateQueries({ queryKey: ["student-profile", user?.id] });
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <QueryError onRetry={() => profileRefetch()} />
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <PortfolioSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 print:py-0">

        {/* ── 1. PORTFOLIO SARLAVHA ────────────────────────────────── */}
        {false ? (
          <Card className="mb-6"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ) : (
          <Card className="mb-6 overflow-hidden border-border/60" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="h-2 w-full" style={{ background: "var(--gradient-primary)" }} />
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-primary/20">
                    {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{profile?.full_name ?? "O'quvchi"}</h1>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <School className="h-3.5 w-3.5" />
                      {profile?.class_number ? `${profile.class_number}-${profile.class_letter ?? ""} sinf` : "Sinf kiritilmagan"}
                      {(profile?.schools as SchoolRef)?.name ? ` • ${(profile!.schools as SchoolRef)!.name}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hollandCode && hollandCode.split("").map((ch: string) => (
                        <span key={ch} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${HOLLAND_INFO[ch]?.color ?? "bg-muted text-muted-foreground"}`}>
                          {ch} – {HOLLAND_INFO[ch]?.label}
                        </span>
                      ))}
                      {temperament && (
                        <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                          {TEMP_INFO[temperament]?.emoji} {temperament}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profil to'liqligi + tugmalar */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Portfolio to'liqligi</p>
                    <p className="text-2xl font-bold text-foreground">{completeness}%</p>
                    <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/my-report"><Printer className="mr-1.5 h-4 w-4" />Chop etish</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/my-tests"><BookOpen className="mr-1.5 h-4 w-4" />Testlar</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Test progress */}
              <div className="mt-5 border-t border-border/50 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Testlar bajarilishi — {completedCount}/{totalTests}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(allTests ?? []).map((t) => (
                    <span
                      key={t.id}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                        completedTestIds.has(t.id)
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completedTestIds.has(t.id)
                        ? <CheckCircle2 className="h-3 w-3" />
                        : <Circle className="h-3 w-3" />}
                      {t.name_uz}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 2. PSIXOLOGIK PORTRET ────────────────────────────────── */}
        {radarData.length > 0 && (
          <div className="mb-6 grid gap-5 md:grid-cols-2">
            {/* Radar */}
            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardContent className="p-6">
                <h3 className="mb-1 font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> Qobiliyatlar radari
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">Barcha test natijalari yig'indisi</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.9 0.01 247)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v}/100`, "Ball"]} />
                      <Radar dataKey="value" stroke="oklch(0.546 0.215 262.9)" fill="oklch(0.546 0.215 262.9)" fillOpacity={0.35} isAnimationActive animationDuration={800} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Shaxsiy portret */}
            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary" /> Shaxsiy portret
                </h3>
                <div className="space-y-4">
                  {/* Holland */}
                  {hollandCode && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Holland kasb yo'nalishi</p>
                      <div className="space-y-1.5">
                        {hollandCode.split("").map((ch: string) => (
                          <div key={ch} className="flex items-center gap-2">
                            <span className={`w-6 text-center rounded text-xs font-bold py-0.5 ${HOLLAND_INFO[ch]?.color}`}>{ch}</span>
                            <div>
                              <span className="text-sm font-medium text-foreground">{HOLLAND_INFO[ch]?.label}</span>
                              <span className="ml-1.5 text-xs text-muted-foreground">— {HOLLAND_INFO[ch]?.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Temperament */}
                  {temperament && TEMP_INFO[temperament] && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temperament</p>
                      <p className="font-semibold text-foreground">{TEMP_INFO[temperament].emoji} {temperament}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{TEMP_INFO[temperament].desc}</p>
                    </div>
                  )}

                  {/* Radar scores mini */}
                  {radarData.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Asosiy ko'rsatkichlar</p>
                      <div className="space-y-1.5">
                        {radarData.map((item, i) => (
                          <div key={item.skill} className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-xs text-muted-foreground">{item.skill}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                            </div>
                            <span className="w-8 text-right text-xs font-medium text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 3. INTELLEKT (IQ) ───────────────────────────────────── */}
        {iqData.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-1 font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Intellekt ko'rsatkichlari (taxminiy)
              </h3>
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                ⚠️ Bu <strong>rasmiy IQ testi emas</strong>. Natija faqat ichki taqqoslash uchun taxminiy nisbiy ball — yosh normalari va klinik validatsiyaga asoslanmagan.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={iqData}>
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                      <YAxis domain={[60, 140]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, "IQ"]} />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="oklch(0.534 0.246 296.8)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  {iqData.map((item) => {
                    const label = iqLabel(item.score);
                    return (
                      <div key={item.type} className="rounded-lg border border-border/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{item.type}</span>
                          <span className="text-xl font-bold text-foreground">{item.score}</span>
                        </div>
                        <span className={`text-xs font-semibold ${label.color}`}>{label.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 4. KUCHLI va ZAIF TOMONLAR ──────────────────────────── */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {strengths.length > 0 && (
              <Card className="border-success/30 bg-success/5" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-success">
                    <TrendingUp className="h-4 w-4" /> Kuchli tomonlar
                  </h3>
                  <div className="space-y-2">
                    {strengths.map((s) => (
                      <div key={s.skill} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{s.skill}</span>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">{s.value}/100</Badge>
                      </div>
                    ))}
                  </div>
                  {temperament && TEMP_INFO[temperament] && (
                    <p className="mt-3 text-xs text-muted-foreground">✓ {TEMP_INFO[temperament].strong}</p>
                  )}
                </CardContent>
              </Card>
            )}
            {improvements.length > 0 && (
              <Card className="border-warning/30 bg-warning/5" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-warning">
                    <Target className="h-4 w-4" /> Rivojlantirish sohalari
                  </h3>
                  <div className="space-y-2">
                    {improvements.map((s) => (
                      <div key={s.skill} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{s.skill}</span>
                        <Badge variant="outline">{s.value}/100</Badge>
                      </div>
                    ))}
                  </div>
                  {temperament && TEMP_INFO[temperament] && (
                    <p className="mt-3 text-xs text-muted-foreground">→ {TEMP_INFO[temperament].develop}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Fan bilimlari (subject testlar) ──────────────────────── */}
        <SubjectResults items={subjectResults} />

        {/* ── 5. HAR BIR TEST NATIJALARI (psixologik) ─────────────── */}
        {psychResults.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Test natijalari
              </h3>
              <div className="space-y-3">
                {psychResults.map((r) => {
                  const raw = r.raw_scores as Record<string, number> | null;
                  const scaled = r.scaled_scores as Record<string, number> | null;
                  const scores = scaled ?? raw;
                  return (
                    <div key={r.id} className="rounded-xl border border-border/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{r.tests?.name_uz ?? "Test"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })}
                            {r.tests?.category ? ` • ${r.tests.category}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.holland_code && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              Holland: {r.holland_code}
                            </Badge>
                          )}
                          {r.personality_type && (
                            <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                              {r.personality_type}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Natija ballari (subscale'lar) */}
                      {scores && Object.keys(scores).length > 0 && (
                        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {Object.entries(scores).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="w-32 shrink-0 text-xs text-muted-foreground">{key}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/60 transition-all"
                                  style={{ width: `${Math.min(100, (val / 140) * 100)}%` }}
                                />
                              </div>
                              <span className="w-6 text-right text-xs font-semibold text-foreground">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 6. TOP KASBLAR ──────────────────────────────────────── */}
        {topCareers.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Sizga mos kasblar
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {topCareers.slice(0, 6).map((c, i) => (
                  <div key={c.id} className="group rounded-xl border border-border/50 p-4 transition-all hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">#{i + 1}</span>
                      <h4 className="flex-1 font-semibold text-foreground group-hover:text-primary text-sm">{c.name_uz}</h4>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mb-2">{c.description}</p>}
                    {c.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.required_skills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    {c.salary_range && (
                      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" />{c.salary_range}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 7. UNIVERSITETLAR ───────────────────────────────────── */}
        {universities.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-secondary" /> Tavsiya etilgan oliy ta'lim muassasalari
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {universities.map((u, i) => (
                  <div key={u.name} className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary shrink-0">#{i + 1}</span>
                      <p className="flex-1 font-semibold text-foreground text-sm">{u.name}</p>
                    </div>
                    {u.city && <p className="mt-1.5 text-xs text-muted-foreground">📍 {u.city}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 8. KLUBLARIM ────────────────────────────────────────── */}
        <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Mening Klublarim
            </h3>
            {myClubs && myClubs.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {myClubs.map((m) => {
                  const club = m.clubs;
                  if (!club) return null;
                  return (
                    <ClubBadge
                      key={m.id}
                      name={club.name}
                      icon={club.icon}
                      color={club.color as ClubColor}
                      joinedAt={m.joined_at}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-8 text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Hali hech bir klubga a'zo emassiz.
                  <br />
                  Maslahatchi sizni clubga qo'shgandan so'ng bu yerda ko'rinadi.
                </p>
              </div>
            )}

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/social-portfolio">
                <Activity className="mr-1.5 h-4 w-4" /> To'liq Ijtimoiy Portfolio
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* ── 9. AI XULOSA ────────────────────────────────────────── */}
        <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" /> Psixologik xulosa (AI)
              </h3>
              {aiSummary && (
                <Button size="sm" variant="ghost" onClick={generateAI} disabled={aiBusy}>
                  {aiBusy ? "Yangilanmoqda..." : "Qayta yaratish"}
                </Button>
              )}
            </div>

            {aiSummary ? (
              <AISummary text={aiSummary} />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground mb-1">AI psixologik tahlili</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Sun'iy intellekt barcha test natijalaringizni tahlil qilib, shaxsiy xarakter, kuchli
                  tomonlar va kelajak uchun yo'l xaritasini tuzadi.
                  {completedCount < 3 && " Aniqroq tahlil uchun kamida 3 ta test yeching."}
                </p>
                <Button onClick={generateAI} disabled={aiBusy || completedCount < 1}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {aiBusy ? "Tahlil qilinmoqda..." : "AI tahlilini yaratish"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bo'sh holat */}
        {radarData.length === 0 && !results?.length && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Brain className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Portfolio hali bo'sh</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Testlarni yakunlang — natijalar avtomatik ravishda portfolionga qo'shiladi va psixologik profilingiz shakllanadi.
              </p>
              <Button asChild className="mt-2">
                <Link to="/my-tests">Testlarni boshlash</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
