import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { StatCard } from "@/components/stat-card";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { schoolStatus, useSchoolStats, DAY_MS } from "@/lib/school-stats";
import { School, Users, ClipboardCheck, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Boshqaruv — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminOverview />
    </ProtectedRoute>
  ),
});

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
}

function AdminOverview() {
  const { data: stats, isLoading, isError, refetch } = useSchoolStats();

  // Maslahatchilar soni (adminning asosiy "resursi")
  const { data: counselorCount } = useQuery({
    queryKey: ["counselor-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("counselor_directory")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  // Tekshirilishi kutilayotgan (topshirilgan) vazifalar
  const { data: pendingReviews } = useQuery({
    queryKey: ["pending-task-reviews"],
    queryFn: async () => {
      const { count } = await supabase
        .from("task_assignments")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted");
      return count ?? 0;
    },
  });

  // Landing'dan kelgan yangi to'garak arizalari
  const { data: newApplications } = useQuery({
    queryKey: ["new-applications-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("club_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      return count ?? 0;
    },
  });

  const schools = stats ?? [];
  const totalResults30d = schools.reduce((a, s) => a + (s.results_30d ?? 0), 0);
  const noCounselor = schools.filter((s) => !s.counselor_id);
  const inactive = schools.filter((s) => s.counselor_id && schoolStatus(s).rank <= 1);

  // Reyting: eng faol/qamrovi yuqori maktablar tepada, muammolilar pastda
  const ranked = [...schools].sort((a, b) => {
    const st = schoolStatus(b).rank - schoolStatus(a).rank;
    if (st !== 0) return st;
    return (
      pct(b.tested_students ?? 0, b.student_count ?? 0) -
      pct(a.tested_students ?? 0, a.student_count ?? 0)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="mb-6 text-muted-foreground">
          Platforma pulsi — barcha maktablar va maslahatchilar holati.
        </p>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* ── KPI kartalar ── */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Maktablar" value={schools.length} icon={School} accent="primary" />
              <StatCard
                label="Maslahatchilar"
                value={counselorCount ?? 0}
                icon={Users}
                accent="success"
              />
              <StatCard
                label="Testlar (30 kun)"
                value={totalResults30d}
                icon={ClipboardCheck}
                accent="warning"
              />
              <StatCard
                label="E'tibor kerak"
                value={noCounselor.length + inactive.length + (pendingReviews ?? 0)}
                icon={AlertTriangle}
                accent="destructive"
              />
            </div>

            {/* ── Ogohlantirishlar ── */}
            {(noCounselor.length > 0 ||
              inactive.length > 0 ||
              (pendingReviews ?? 0) > 0 ||
              (newApplications ?? 0) > 0) && (
              <Card className="mb-8 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" /> Ogohlantirishlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {(newApplications ?? 0) > 0 && (
                    <p>
                      🟣{" "}
                      <span className="font-medium">
                        {newApplications} ta yangi to'garak arizasi
                      </span>{" "}
                      kelib tushdi.{" "}
                      <Link to="/admin/applications" className="text-primary underline">
                        Ko'rish
                      </Link>
                    </p>
                  )}
                  {(pendingReviews ?? 0) > 0 && (
                    <p>
                      🔵{" "}
                      <span className="font-medium">{pendingReviews} ta topshirilgan vazifa</span>{" "}
                      tekshirishni kutmoqda.{" "}
                      <Link to="/admin/tasks" className="text-primary underline">
                        Ko'rish
                      </Link>
                    </p>
                  )}
                  {noCounselor.map((s) => (
                    <p key={s.id}>
                      ⚪ <span className="font-medium">{s.name}</span> — maslahatchi tayinlanmagan.{" "}
                      <Link to="/admin/counselors" className="text-primary underline">
                        Tayinlash
                      </Link>
                    </p>
                  ))}
                  {inactive.map((s) => (
                    <p key={s.id}>
                      🔴 <span className="font-medium">{s.name}</span> —{" "}
                      {s.last_activity
                        ? `${Math.floor((Date.now() - new Date(s.last_activity).getTime()) / DAY_MS)} kundan beri faollik yo'q`
                        : "hali hech qanday faollik bo'lmagan"}{" "}
                      (maslahatchi: {s.counselor_name ?? "—"}).
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── Maktablar reytingi ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maktablar holati</CardTitle>
              </CardHeader>
              <CardContent>
                {schools.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Hali maktab qo'shilmagan.{" "}
                    <Link to="/admin/schools" className="text-primary underline">
                      Birinchi maktabni qo'shing
                    </Link>
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Maktab</th>
                          <th className="px-3 py-2 font-medium">Maslahatchi</th>
                          <th className="px-3 py-2 font-medium">Qamrov</th>
                          <th className="px-3 py-2 font-medium">Test qamrovi</th>
                          <th className="px-3 py-2 font-medium">30 kun testlar</th>
                          <th className="px-3 py-2 font-medium">Oxirgi faollik</th>
                          <th className="px-3 py-2 font-medium">Holat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranked.map((s) => {
                          const st = schoolStatus(s);
                          const students = s.student_count ?? 0;
                          const coverage = s.expected_students
                            ? `${students}/${s.expected_students} (${pct(students, s.expected_students)}%)`
                            : `${students}`;
                          return (
                            <tr key={s.id} className="border-b border-border/50">
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-foreground">{s.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[s.district, s.region].filter(Boolean).join(", ")}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">{s.counselor_name ?? "—"}</td>
                              <td className="px-3 py-2.5">{coverage}</td>
                              <td className="px-3 py-2.5">
                                {pct(s.tested_students ?? 0, students)}%
                              </td>
                              <td className="px-3 py-2.5">{s.results_30d ?? 0}</td>
                              <td className="px-3 py-2.5">{fmtDate(s.last_activity)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {st.emoji} {st.label}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
