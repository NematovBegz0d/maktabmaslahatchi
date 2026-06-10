import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ClipboardList, CheckCircle2, Sparkles, ArrowRight,
  Users, TrendingUp, Brain, FileText,
  UserPlus, AlertCircle, BarChart3, GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Boshqaruv paneli — EduLens" }] }),
  component: () => (<ProtectedRoute><Dashboard /></ProtectedRoute>),
});

interface SessionWithTest {
  id: string;
  status: string;
  test_id: string;
  started_at?: string | null;
  completed_at?: string | null;
  student_id?: string;
  tests: { name_uz: string | null; description?: string | null } | null;
}
interface DashTest {
  id: string;
  name_uz: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  question_count?: number | null;
}
interface AdminStudent {
  id: string;
  full_name: string | null;
  class_number: number | null;
  class_letter: string | null;
  created_at: string | null;
}
interface CareerLite { id?: string; name_uz?: string; name?: string }

function Dashboard() {
  const { role, loading } = useAuth();

  if (loading || role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (role === "admin") return <AdminDashboard />;
  return <StudentDashboard />;
}

/* ─── O'QUVCHI ─────────────────────────────────────────────────────────── */
function StudentDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("test_sessions")
        .select("id, status, test_id, tests(name_uz, description)")
        .eq("student_id", user!.id)
        .order("started_at", { ascending: false });
      return (data ?? []) as SessionWithTest[];
    },
  });

  const { data: tests } = useQuery({
    queryKey: ["tests-active"],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("*").eq("is_active", true).order("id");
      return (data ?? []) as DashTest[];
    },
  });

  const { data: sp } = useQuery({
    queryKey: ["sp-completeness", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("profile_completeness, top_careers")
        .eq("student_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const completedIds = new Set(
    (sessions ?? []).filter((s) => s.status === "completed").map((s) => s.test_id)
  );
  const inProgressSessions = (sessions ?? []).filter((s) => s.status === "in_progress");
  const completedCount = completedIds.size;
  // Faol testlar soni dinamik (Schulte nofaol qilingach 8 emas, 7) — qattiq kod o'rniga
  const totalTests = tests?.length ?? 0;
  const remainingCount = Math.max(0, totalTests - completedCount);
  const completeness = sp?.profile_completeness
    ?? (totalTests > 0 ? Math.min(100, Math.round((completedCount / totalTests) * 100)) : 0);
  const topCareer = (sp?.top_careers as CareerLite[] | null)?.[0];

  // Bajarilmagan testlar
  const remainingTests = (tests ?? []).filter((t) => !completedIds.has(t.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">

        {/* Salom */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Assalomu alaykum, {profile?.full_name?.split(" ")[0] ?? "do'st"}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Portfoliongizni to'ldiring — har bir test yangi qirralaringizni ochadi.
          </p>
        </div>

        {/* Stat kartalar */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Yechilgan testlar" value={`${completedCount}/${totalTests}`} icon={CheckCircle2} accent="success" />
          <StatCard label="Davom etmoqda" value={inProgressSessions.length} icon={ClipboardList} accent="warning" />
          <StatCard label="Portfolio to'liqligi" value={`${completeness}%`} icon={Sparkles} accent="primary" />
        </div>

        {/* Progress bar */}
        <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Portfolio holati</p>
                <p className="text-sm text-muted-foreground">
                  {totalTests > 0 && remainingCount === 0
                    ? "Barcha testlar yakunlandi!"
                    : `${remainingCount} ta test qoldi`}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
            {topCareer && (
              <p className="mt-3 text-sm text-muted-foreground">
                🎯 Sizga mos kasb:{" "}
                <span className="font-semibold text-foreground">
                  {topCareer.name_uz ?? topCareer.name}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Davom etmoqda */}
        {inProgressSessions.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <ClipboardList className="h-5 w-5 text-warning" /> Tugallanmagan testlar
            </h2>
            <div className="grid gap-3">
              {inProgressSessions.map((s) => (
                <Card key={s.id} className="border-warning/30 bg-warning/5">
                  <CardContent className="flex items-center justify-between p-4">
                    <p className="font-medium text-foreground">{s.tests?.name_uz ?? "Test"}</p>
                    <Button asChild size="sm">
                      <Link to="/test/$id" params={{ id: s.test_id }}>Davom ettirish</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Navbatdagi testlar */}
        {remainingTests.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Brain className="h-5 w-5 text-primary" /> Keyingi testlar
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/my-tests">Hammasi <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {remainingTests.map((t) => (
                <Card key={t.id} className="border-border/60 transition hover:border-primary/40" style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground">{t.name_uz}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      {t.duration_minutes && <span>⏱ {t.duration_minutes} daq</span>}
                      {t.question_count && <span>{t.question_count} ta savol</span>}
                    </div>
                    <Button asChild size="sm" className="mt-4 w-full">
                      <Link to="/test/$id" params={{ id: t.id }}>Boshlash</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio havola */}
        {completedCount > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Portfoliongizni ko'ring</p>
                  <p className="text-sm text-muted-foreground">Psixologik profil, radar chart va kasb tavsiyalari</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/my-profile">Ochish <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

/* ─── ADMIN PANEL ───────────────────────────────────────────────────────── */
function AdminDashboard() {
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      // student_directory — faqat 'student' rolli profillar (admin/maslahatchi chiqarib tashlangan)
      const { data } = await supabase
        .from("student_directory")
        .select("id, full_name, class_number, class_letter, created_at")
        .order("created_at", { ascending: false });
      return (data ?? []) as AdminStudent[];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_sessions")
        .select("id, student_id, status, started_at, completed_at, tests(name_uz)")
        .order("started_at", { ascending: false })
        .limit(8);
      return (data ?? []) as SessionWithTest[];
    },
  });

  const { data: spData } = useQuery({
    queryKey: ["admin-sp"],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("student_id, profile_completeness");
      return data ?? [];
    },
  });

  const { data: tests } = useQuery({
    queryKey: ["tests-active"],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("id, name_uz").eq("is_active", true);
      return data ?? [];
    },
  });

  const totalStudents = students?.length ?? 0;
  const completedSessions = (sessions ?? []).filter((s) => s.status === "completed").length;

  const avgCompleteness = spData && spData.length
    ? Math.round(spData.reduce((a, p) => a + (p.profile_completeness ?? 0), 0) / spData.length)
    : 0;

  // O'quvchilar sinf bo'yicha guruhlash
  const classCounts: Record<string, number> = {};
  (students ?? []).forEach((s) => {
    const key = s.class_number ? `${s.class_number}${s.class_letter ?? ""}` : "Belgilanmagan";
    classCounts[key] = (classCounts[key] ?? 0) + 1;
  });
  const classGroups = Object.entries(classCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 6);

  // Diqqat talab qiladigan o'quvchilar (portfolio 0%)
  const completenessMap = Object.fromEntries((spData ?? []).map((p) => [p.student_id, p.profile_completeness ?? 0]));
  const needsAttention = (students ?? [])
    .filter((s) => (completenessMap[s.id] ?? 0) === 0)
    .slice(0, 5);

  // So'nggi faollik
  const recentActivity = (sessions ?? []).filter((s) => s.status === "completed").slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">

        {/* Sarlavha */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin paneli</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              EduLens — maktab psixologik monitoring tizimi
            </p>
          </div>
          <Link to="/students-manage">
            <Button size="sm">
              <UserPlus className="mr-1.5 h-4 w-4" /> O'quvchi qo'shish
            </Button>
          </Link>
        </div>

        {/* Stat kartalar */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <StatCard label="Jami o'quvchilar" value={totalStudents} icon={Users} accent="primary" />
          <StatCard label="Yechilgan testlar" value={completedSessions} icon={CheckCircle2} accent="success" />
          <StatCard label="O'rt. to'liqlik" value={`${avgCompleteness}%`} icon={TrendingUp} accent="warning" />
          <StatCard label="Testlar soni" value={tests?.length ?? 0} icon={Brain} accent="primary" />
        </div>

        {/* Asosiy grid */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Sinf bo'yicha taqsimot */}
          <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> Sinf bo'yicha
              </h3>
              {studentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : classGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">O'quvchilar yo'q</p>
              ) : (
                <div className="space-y-2">
                  {classGroups.map(([cls, count]) => (
                    <div key={cls} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm font-medium text-foreground">{cls}-sinf</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">{count} ta</Badge>
                    </div>
                  ))}
                  {Object.keys(classCounts).length > 6 && (
                    <p className="text-center text-xs text-muted-foreground">
                      +{Object.keys(classCounts).length - 6} ta sinf yana
                    </p>
                  )}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link to="/students">Barchasi <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Diqqat talab qiluvchilar */}
          <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-destructive" /> E'tibor kerak
                {needsAttention.length > 0 && (
                  <Badge className="ml-auto bg-destructive/10 text-destructive">{needsAttention.length}</Badge>
                )}
              </h3>
              {studentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : needsAttention.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-foreground">Hammasi yaxshi!</p>
                  <p className="text-xs text-muted-foreground">Barcha o'quvchilar testlarni boshlagan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {needsAttention.map((s) => (
                    <Link
                      key={s.id}
                      to="/students/$id"
                      params={{ id: s.id }}
                      className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm font-bold text-destructive">
                        {(s.full_name ?? "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{s.full_name ?? "Noma'lum"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.class_number ? `${s.class_number}-${s.class_letter ?? ""} sinf` : "Sinf yo'q"} • 0% test
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* So'nggi faollik */}
          <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <ClipboardList className="h-4 w-4 text-emerald-600" /> So'nggi faollik
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hozircha faollik yo'q</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {s.tests?.name_uz ?? "Test"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.completed_at ? new Date(s.completed_at).toLocaleDateString("uz") : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quyi qator: Tezkor havolalar */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { to: "/students" as const, icon: Users, label: "O'quvchilar ro'yxati", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
            { to: "/students-manage" as const, icon: UserPlus, label: "O'quvchi qo'shish", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { to: "/analytics" as const, icon: BarChart3, label: "Tahlil va statistika", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { to: "/my-tests" as const, icon: Brain, label: "Testlar", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl border border-border/50 p-4 transition hover:border-primary/40 hover:shadow-sm ${item.bg}`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${item.color}`} />
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
