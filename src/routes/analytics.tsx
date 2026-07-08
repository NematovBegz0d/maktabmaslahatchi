import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import {
  Users,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
  Briefcase,
  BookOpenCheck,
} from "lucide-react";
import { QueryError } from "@/components/query-error";

// recharts'ga asoslangan grafiklar — alohida bundle, faqat kerak bo'lganda yuklanadi
const AnalyticsCharts = lazy(() => import("@/components/analytics-charts"));

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Tahlil — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin", "counselor"]}>
      <Analytics />
    </ProtectedRoute>
  ),
});

const GRADE_BAR = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"]; // 2,3,4,5 ranglari

// public.analytics_overview() RPC qaytaradigan jamlama (jsonb).
// Barcha agregatsiya server tomonida (RLS doirasida) bajarilgan.
interface SubjectStat {
  name: string;
  avgPercent: number;
  avgGrade: number;
  count: number;
  grades: Record<number, number>;
}
interface AnalyticsOverview {
  total_students: number;
  completed_tests: number;
  active_students: number;
  avg_completeness: number;
  holland: { short: string; name: string; value: number }[];
  temperament: { name: string; value: number }[];
  test_popularity: { name: string; value: number }[];
  top_careers: { name: string; value: number }[];
  subjects: SubjectStat[];
}

const EMPTY: AnalyticsOverview = {
  total_students: 0,
  completed_tests: 0,
  active_students: 0,
  avg_completeness: 0,
  holland: [],
  temperament: [],
  test_popularity: [],
  top_careers: [],
  subjects: [],
};

function Analytics() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const res = unwrap(await supabase.rpc("analytics_overview")) as unknown as AnalyticsOverview;
      return res ?? EMPTY;
    },
  });

  const o = data ?? EMPTY;

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
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                label="Oʻquvchilar"
                value={o.total_students}
                icon={Users}
                accent="primary"
              />
              <StatCard
                label="Faol (test yechgan)"
                value={o.active_students}
                icon={Sparkles}
                accent="success"
              />
              <StatCard
                label="Yechilgan testlar"
                value={o.completed_tests}
                icon={ClipboardCheck}
                accent="warning"
              />
              <StatCard
                label="Oʻrtacha toʻliqlik"
                value={`${o.avg_completeness}%`}
                icon={TrendingUp}
                accent="primary"
              />
            </div>

            {/* Grafiklar — lazy yuklanadi (recharts) */}
            <Suspense
              fallback={
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <Skeleton className="h-[336px] rounded-xl" />
                  <Skeleton className="h-[336px] rounded-xl" />
                </div>
              }
            >
              <AnalyticsCharts
                holland={o.holland}
                temperament={o.temperament}
                testPopularity={o.test_popularity}
              />
            </Suspense>

            {/* Fan testlari natijalari */}
            {o.subjects.length > 0 && (
              <Card className="mt-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <BookOpenCheck className="h-4 w-4 text-primary" /> Fan testlari natijalari
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {o.subjects.map((s) => (
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
              {o.top_careers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Hozircha maʼlumot yoʻq.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {o.top_careers.map((c, i) => (
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
