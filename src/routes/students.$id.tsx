import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AISummary } from "@/components/ai-summary";
import { QueryError } from "@/components/query-error";
import { PortfolioSkeleton } from "@/components/portfolio-skeleton";
import { SocialPortfolio } from "@/components/social-portfolio";
import { EditStudentDialog } from "@/components/edit-student-dialog";
import { SubjectResults, type SubjectResult } from "@/components/subject-results";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  ArrowLeft, Brain, Zap, Target, TrendingUp, Briefcase,
  GraduationCap, FileText, User, School, Sparkles, CheckCircle2, Circle, Award, Activity, Pencil, Archive, Trash2,
} from "lucide-react";

export const Route = createFileRoute("/students/$id")({
  head: () => ({ meta: [{ title: "O'quvchi portfoliosi — EduLens" }] }),
  component: () => (<ProtectedRoute requiredRoles={["admin"]}><StudentDetail /></ProtectedRoute>),
});

// ─── Holland kodi ta'riflari ───────────────────────────────────────────────
const HOLLAND_INFO: Record<string, { label: string; desc: string; color: string }> = {
  R: { label: "Realistik", desc: "Amaliy, texnik", color: "bg-orange-100 text-orange-700" },
  I: { label: "Tadqiqotchi", desc: "Fan, tahlil", color: "bg-blue-100 text-blue-700" },
  A: { label: "Ijodkor", desc: "San'at, ijod", color: "bg-purple-100 text-purple-700" },
  S: { label: "Ijtimoiy", desc: "Odamlar, yordam", color: "bg-green-100 text-green-700" },
  E: { label: "Tadbirkor", desc: "Rahbarlik, biznes", color: "bg-red-100 text-red-700" },
  C: { label: "Konventsion", desc: "Tartib, tizim", color: "bg-gray-100 text-gray-700" },
};

const TEMP_INFO: Record<string, { emoji: string; desc: string; strong: string; develop: string }> = {
  Sangvinik: { emoji: "😊", desc: "Faol, ijtimoiy, xushchaqchaq", strong: "Muloqotchanlik, moslashuvchanlik", develop: "Diqqatni jamlash, ishni tugallash" },
  Xolerik: { emoji: "⚡", desc: "Energik, tashabbuskor", strong: "Liderlik, tez qaror qilish", develop: "Sabr, hissiyotlarni boshqarish" },
  Flegmatik: { emoji: "🧘", desc: "Xotirjam, barqaror", strong: "Chidamlilik, ishonchlilik", develop: "Tashabbuskorlik, o'zgarishlarga moslashish" },
  Melanxolik: { emoji: "🎨", desc: "Sezgir, chuqur fikrlovchi", strong: "Ijodkorlik, tahliliy fikrlash", develop: "O'ziga ishonch, stressni boshqarish" },
};

const RADAR_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

function iqLabel(score: number) {
  if (score >= 130) return { text: "A'lo darajali", color: "text-purple-600" };
  if (score >= 115) return { text: "Yuqori", color: "text-blue-600" };
  if (score >= 100) return { text: "O'rtadan yuqori", color: "text-green-600" };
  if (score >= 85) return { text: "O'rtacha", color: "text-yellow-600" };
  return { text: "Rivojlantirilishi kerak", color: "text-red-500" };
}

interface RadarItem { skill: string; value: number }
interface IqItem { type: string; score: number }
interface DetailCareer {
  id: string; name_uz: string; name?: string; description: string | null;
  required_skills: string[]; salary_range: string | null;
  universities?: { name: string; city?: string }[];
}
interface DetailResult {
  id: string; test_id: string;
  holland_code: string | null; personality_type: string | null;
  raw_scores: Record<string, number> | null;
  scaled_scores: Record<string, number> | null;
  created_at: string;
  tests: { name_uz: string | null; category?: string | null; test_type?: string | null } | null;
}
interface DetailTest { id: string; name_uz: string | null }

function StudentDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteStudent(name: string) {
    if (!confirm(
      `DIQQAT! "${name}" BUTUNLAY o'chiriladi:\n\n` +
      `• Profil va login\n` +
      `• Barcha test natijalari va sessiyalari\n` +
      `• Klub va kengash a'zoliklari\n\n` +
      `Bu amalni QAYTARIB BO'LMAYDI. Davom etasizmi?`
    )) return;
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-student", { body: { student_id: id } });
    setDeleting(false);
    if (error) {
      console.error("[delete-student]", error);
      toast.error("O'chirishda xatolik yuz berdi. Qayta urinib ko'ring.");
      return;
    }
    toast.success("O'quvchi butunlay o'chirildi.");
    qc.invalidateQueries({ queryKey: ["students-list"] });
    qc.invalidateQueries({ queryKey: ["admin-students"] });
    navigate({ to: "/students" });
  }

  async function archiveStudent() {
    if (!confirm("O'quvchini o'quvchilar safidan chiqarasizmi?\n\nMa'lumotlari (test natijalari) saqlanadi va keyin qaytarish mumkin.")) return;
    setArchiving(true);
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
    setArchiving(false);
    if (error) {
      console.error("[archive-student]", error);
      toast.error("Arxivlashda xatolik yuz berdi.");
      return;
    }
    toast.success("O'quvchi arxivlandi (safdan chiqarildi).");
    qc.invalidateQueries({ queryKey: ["students-list"] });
    qc.invalidateQueries({ queryKey: ["admin-students"] });
    navigate({ to: "/students" });
  }

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["student-detail-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, schools(name, region, district)")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: sp } = useQuery({
    queryKey: ["student-detail-sp", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("radar_scores, iq_scores, top_careers, profile_completeness, ai_summary")
        .eq("student_id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: results } = useQuery({
    queryKey: ["student-detail-results", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_results")
        .select("id, test_id, holland_code, personality_type, raw_scores, scaled_scores, created_at, tests(name_uz, category, test_type)")
        .eq("student_id", id)
        .order("created_at", { ascending: false });
      return (data ?? []) as DetailResult[];
    },
  });

  const { data: allTests } = useQuery({
    queryKey: ["all-tests"],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("id, name_uz").eq("is_active", true);
      return (data ?? []) as DetailTest[];
    },
  });

  const radarData = (sp?.radar_scores as RadarItem[] | null) ?? [];
  const iqData = (sp?.iq_scores as IqItem[] | null) ?? [];
  const topCareers = (sp?.top_careers as DetailCareer[] | null) ?? [];
  const completeness = sp?.profile_completeness ?? 0;
  const hollandCode = results?.find((r) => r.holland_code)?.holland_code ?? null;
  const temperament = results?.find((r) => r.personality_type)?.personality_type ?? null;
  const completedTestIds = new Set((results ?? []).map((r) => r.test_id));

  // Fan testlari (subject) — alohida ko'rsatiladi
  const subjectResults: SubjectResult[] = (results ?? [])
    .filter((r) => r.tests?.test_type === "subject")
    .map((r) => {
      const ss = r.scaled_scores ?? {};
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

  const sorted = [...radarData].sort((a, b) => b.value - a.value);
  const strengths = sorted.slice(0, 3).filter((x) => x.value >= 50);
  const improvements = sorted.slice(-3).filter((x) => x.value < 60);

  const universities = Array.from(
    new Map(topCareers.flatMap((c) => c.universities ?? []).map((u) => [u.name, u])).values()
  ).slice(0, 6) as { name: string; city?: string }[];

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <QueryError onRetry={() => refetch()} />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <PortfolioSkeleton />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Link to="/students"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Orqaga</Button></Link>
          <Card className="mt-4"><CardContent className="p-10 text-center text-muted-foreground">O'quvchi topilmadi yoki ruxsat yo'q.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link to="/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />O'quvchilar ro'yxati
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Tahrirlash
            </Button>
            <Button
              variant="outline" size="sm" disabled={archiving}
              onClick={archiveStudent}
              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
            >
              <Archive className="mr-1.5 h-4 w-4" /> {archiving ? "Arxivlanmoqda..." : "Safdan chiqarish"}
            </Button>
            <Button
              variant="outline" size="sm" disabled={deleting}
              onClick={() => deleteStudent(profile.full_name ?? "o'quvchi")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </div>
        </div>

        <EditStudentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          student={{
            id,
            full_name: profile.full_name ?? null,
            passport_series: (profile as { passport_series?: string | null }).passport_series ?? null,
            class_number: profile.class_number ?? null,
            class_letter: profile.class_letter ?? null,
            gender: (profile as { gender?: string | null }).gender ?? null,
            birth_date: (profile as { birth_date?: string | null }).birth_date ?? null,
            school_id: profile.school_id ?? null,
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["student-detail-profile", id] });
            qc.invalidateQueries({ queryKey: ["students-list"] });
            qc.invalidateQueries({ queryKey: ["admin-students"] });
            refetch();
          }}
        />

        {/* ── 1. SARLAVHA KARTI ─────────────────────────────────── */}
        <Card className="mb-6 overflow-hidden border-border/60" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="h-2 w-full" style={{ background: "var(--gradient-primary)" }} />
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-primary/20">
                  {(profile.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{profile.full_name ?? "Noma'lum"}</h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <School className="h-3.5 w-3.5" />
                    {profile.class_number ? `${profile.class_number}-${profile.class_letter ?? ""} sinf` : "Sinf kiritilmagan"}
                    {profile.schools?.name ? ` • ${profile.schools.name}` : ""}
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
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Portfolio to'liqligi</p>
                <p className="text-2xl font-bold text-foreground">{completeness}%</p>
                <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
                </div>
              </div>
            </div>

            {/* Test progress */}
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bajarilgan testlar — {completedTestIds.size}/{allTests?.length ?? 8}
              </p>
              <div className="flex flex-wrap gap-2">
                {(allTests ?? []).map((t) => (
                  <span key={t.id} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${completedTestIds.has(t.id) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {completedTestIds.has(t.id) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    {t.name_uz}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. PSIXOLOGIK PORTRET ─────────────────────────────── */}
        {radarData.length > 0 && (
          <div className="mb-6 grid gap-5 md:grid-cols-2">
            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> Qobiliyatlar radari
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.9 0.01 247)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v}/100`, "Ball"]} />
                      <Radar dataKey="value" stroke="oklch(0.546 0.215 262.9)" fill="oklch(0.546 0.215 262.9)" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary" /> Shaxsiy portret
                </h3>
                <div className="space-y-4">
                  {hollandCode && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Holland kasb yo'nalishi</p>
                      <div className="space-y-1.5">
                        {hollandCode.split("").map((ch: string) => (
                          <div key={ch} className="flex items-center gap-2">
                            <span className={`w-6 text-center rounded text-xs font-bold py-0.5 ${HOLLAND_INFO[ch]?.color}`}>{ch}</span>
                            <span className="text-sm font-medium text-foreground">{HOLLAND_INFO[ch]?.label}</span>
                            <span className="text-xs text-muted-foreground">— {HOLLAND_INFO[ch]?.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {temperament && TEMP_INFO[temperament] && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temperament</p>
                      <p className="font-semibold text-foreground">{TEMP_INFO[temperament].emoji} {temperament}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{TEMP_INFO[temperament].desc}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {radarData.map((item, i) => (
                      <div key={item.skill} className="flex items-center gap-2">
                        <span className="w-28 shrink-0 text-xs text-muted-foreground">{item.skill}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 3. IQ ─────────────────────────────────────────────── */}
        {iqData.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Intellekt ko'rsatkichlari (taxminiy)
              </h3>
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                ⚠️ Rasmiy IQ testi emas — faqat ichki taqqoslash uchun taxminiy nisbiy ball.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-52">
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

        {/* ── 4. KUCHLI / ZAIF ──────────────────────────────────── */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {strengths.length > 0 && (
              <Card className="border-success/30 bg-success/5">
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
              <Card className="border-warning/30 bg-warning/5">
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

        {/* ── 5. TEST NATIJALARI (psixologik) ─────────────────────── */}
        {psychResults.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Test natijalari
              </h3>
              <div className="space-y-3">
                {psychResults.map((r) => {
                  const scores = (r.scaled_scores ?? r.raw_scores) as Record<string, number> | null;
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
                          {r.holland_code && <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Holland: {r.holland_code}</Badge>}
                          {r.personality_type && <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20">{r.personality_type}</Badge>}
                        </div>
                      </div>
                      {scores && Object.keys(scores).length > 0 && (
                        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {Object.entries(scores).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="w-32 shrink-0 text-xs text-muted-foreground">{key}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, (val / 140) * 100)}%` }} />
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

        {/* ── 6. TOP KASBLAR ────────────────────────────────────── */}
        {topCareers.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Mos kasblar
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {topCareers.slice(0, 6).map((c, i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">#{i + 1}</span>
                      <h4 className="font-semibold text-foreground text-sm">{c.name_uz ?? c.name ?? `Kasb #${i + 1}`}</h4>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mb-2">{c.description}</p>}
                    {c.salary_range && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" />{c.salary_range}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 7. UNIVERSITETLAR ─────────────────────────────────── */}
        {universities.length > 0 && (
          <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-secondary" /> Tavsiya etilgan oliy ta'lim muassasalari
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {universities.map((u, i) => (
                  <div key={u.name} className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">#{i + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{u.name}</p>
                        {u.city && <p className="text-xs text-muted-foreground mt-0.5">📍 {u.city}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 8. AI XULOSA ──────────────────────────────────────── */}
        <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6">
            <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" /> Psixologik xulosa (AI)
            </h3>
            {sp?.ai_summary ? (
              <AISummary text={sp.ai_summary as string} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Hozircha AI tahlili tayyor emas. O'quvchi testlarni yakunlagach, bu yerda psixologik xulosa paydo bo'ladi.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── 9. IJTIMOIY PORTFOLIO ──────────────────────────────── */}
        <div className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <Activity className="h-5 w-5 text-primary" /> Ijtimoiy Portfolio
          </h2>
          <SocialPortfolio studentId={id} canEdit />
        </div>

        {/* Bo'sh holat */}
        {radarData.length === 0 && !results?.length && (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              Bu o'quvchi hali birorta test topshirmagan.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
