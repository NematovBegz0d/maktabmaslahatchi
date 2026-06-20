import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Users,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
  Briefcase,
  BookOpenCheck,
} from "lucide-react";
import { QueryError } from "@/components/query-error";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Tahlil — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin", "counselor"]}>
      <Analytics />
    </ProtectedRoute>
  ),
});

const PIE_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];
const GRADE_BAR = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"]; // 2,3,4,5 ranglari

function Analytics() {
  const {
    data: students,
    isLoading: sLoading,
    isError: sError,
    refetch: sRefetch,
  } = useQuery({
    queryKey: ["analytics-students"],
    queryFn: async () => {
      // student_directory — faqat 'student' rolli profillar (admin sana' ga kirmaydi)
      const data = unwrap(
        await supabase
          .from("student_directory")
          .select("id, class_number")
          .not("class_number", "is", null),
      );
      return data ?? [];
    },
  });

  const {
    data: results,
    isLoading: rLoading,
    isError: rError,
  } = useQuery({
    queryKey: ["analytics-results"],
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("test_results")
          .select("holland_code, personality_type, test_id, tests(name_uz)"),
      );
      return (data ?? []) as AnalyticsResult[];
    },
  });

  const {
    data: profiles,
    isLoading: pLoading,
    isError: pError,
  } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("student_profiles").select("profile_completeness, top_careers"),
      );
      return (data ?? []) as AnalyticsProfile[];
    },
  });

  const { data: subjectRows } = useQuery({
    queryKey: ["analytics-subjects"],
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("test_results").select("scaled_scores, tests(name_uz, test_type)"),
      );
      return ((data ?? []) as unknown as AnalyticsSubject[]).filter(
        (r) => r.tests?.test_type === "subject",
      );
    },
  });

  const loading = sLoading || rLoading || pLoading;
  const isError = sError || rError || pError;

  // --- Metrikalar (agregatsiya: @/lib/analytics-agg) ---
  const totalStudents = students?.length ?? 0;
  const completedTests = results?.length ?? 0;
  const activeStudents = profiles?.length ?? 0;
  const avgCmpl = avgCompleteness(profiles ?? []);
  const hollandData = hollandDistribution(results ?? []);
  const tempData = temperamentDistribution(results ?? []);
  const testData = testPopularity(results ?? []);
  const topCareers = topRecommendedCareers(profiles ?? []);
  const subjectStats = computeSubjectStats(subjectRows ?? []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <TrendingUp className="h-7 w-7 text-primary" /> Tahlil va statistika
          </h1>
          <p className="mt-1 text-muted-foreground">
            Maktab boʻyicha umumiy koʻrsatkichlar va tendensiyalar.
          </p>
        </div>

        {isError ? (
          <QueryError onRetry={() => sRefetch()} />
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Oʻquvchilar" value={totalStudents} icon={Users} accent="primary" />
              <StatCard
                label="Faol (test yechgan)"
                value={activeStudents}
                icon={Sparkles}
                accent="success"
              />
              <StatCard
                label="Yechilgan testlar"
                value={completedTests}
                icon={ClipboardCheck}
                accent="warning"
              />
              <StatCard
                label="Oʻrtacha toʻliqlik"
                value={`${avgCmpl}%`}
                icon={TrendingUp}
                accent="primary"
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {/* Holland taqsimoti */}
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold text-foreground">
                    Holland yoʻnalishlari taqsimoti
                  </h3>
                  {hollandData.length === 0 ? (
                    <EmptyChart text="Holland testi natijalari hali yoʻq" />
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hollandData}>
                          <XAxis dataKey="short" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid oklch(0.92 0.01 247)",
                              fontSize: 12,
                            }}
                            formatter={(v: number, _n, p: { payload?: { name?: string } }) => [
                              `${v} ta`,
                              p?.payload?.name ?? "",
                            ]}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {hollandData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Temperament taqsimoti */}
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold text-foreground">Temperament taqsimoti</h3>
                  {tempData.length === 0 ? (
                    <EmptyChart text="Ayzenk testi natijalari hali yoʻq" />
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tempData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label
                          >
                            {tempData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip formatter={(v: number) => [`${v} ta`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Test mashhurligi */}
            <Card className="mt-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-foreground">
                  Testlar boʻyicha yechilganlik
                </h3>
                {testData.length === 0 ? (
                  <EmptyChart text="Hali test yakunlanmagan" />
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={testData} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v} ta`, "Yechilgan"]} />
                        <Bar
                          dataKey="value"
                          radius={[0, 8, 8, 0]}
                          fill="oklch(0.546 0.215 262.9)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fan testlari natijalari */}
            {subjectStats.length > 0 && (
              <Card className="mt-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <BookOpenCheck className="h-4 w-4 text-primary" /> Fan testlari natijalari
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subjectStats.map((s) => (
                      <div key={s.name} className="rounded-xl border border-border/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{s.name}</span>
                          <span className="text-2xl font-bold text-primary">{s.avgGrade}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Oʻrtacha baho • {s.count} ta natija
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Oʻrtacha foiz</span>
                          <span className="font-semibold text-foreground">{s.avgPercent}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${s.avgPercent}%` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[5, 4, 3, 2].map((g, i) => (
                            <span
                              key={g}
                              className="rounded px-1.5 py-0.5 text-xs"
                              style={{
                                backgroundColor: `${GRADE_BAR[3 - i]}1a`,
                                color: GRADE_BAR[3 - i],
                              }}
                            >
                              <span className="font-bold">{g}</span>: {s.grades[g] ?? 0}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Eng ko'p tavsiya etilgan kasblar */}
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Eng koʻp tavsiya etilgan kasblar
                </h2>
              </div>
              {topCareers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Hozircha maʼlumot yoʻq.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {topCareers.map((c, i) => (
                    <Card
                      key={c.name}
                      className="border-border/60"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-foreground">{c.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {c.value} oʻquvchi
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              <Link to="/students" className="text-primary hover:underline">
                Oʻquvchilar roʻyxatiga oʻtish →
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
