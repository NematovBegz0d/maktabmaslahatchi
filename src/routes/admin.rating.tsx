import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { useSchoolStats } from "@/lib/school-stats";
import { computeRating, rankEmoji, type TaskStats } from "@/lib/rating";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/rating")({
  head: () => ({ meta: [{ title: "Reyting — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminRating />
    </ProtectedRoute>
  ),
});

function AdminRating() {
  const { data: stats, isLoading, isError, refetch } = useSchoolStats();

  // Vazifa statistikasi: maslahatchi → {biriktirilgan, qabul qilingan}
  const { data: taskStats } = useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const data = unwrap(await supabase.from("task_assignments").select("counselor_id, status"));
      const map: Record<string, TaskStats> = {};
      (data ?? []).forEach((a) => {
        const entry = (map[a.counselor_id] ??= { assigned: 0, accepted: 0 });
        entry.assigned += 1;
        if (a.status === "accepted") entry.accepted += 1;
      });
      return map;
    },
  });

  const ratings = (stats ?? [])
    .map((s) => computeRating(s, taskStats?.[s.counselor_id ?? ""]))
    .filter((r) => r !== null)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <Trophy className="h-7 w-7 text-primary" /> Maslahatchilar reytingi
        </h1>
        <p className="mb-6 text-muted-foreground">
          100 ballik tizim: baza qamrovi (30) + test qamrovi (30) + faollik (20) + vazifalar (20).
        </p>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Reyting uchun hali maslahatchi tayinlanmagan.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">O'rin</th>
                      <th className="px-3 py-2 font-medium">Maslahatchi</th>
                      <th className="px-3 py-2 font-medium">Maktab</th>
                      <th className="px-3 py-2 font-medium">Qamrov (30)</th>
                      <th className="px-3 py-2 font-medium">Test (30)</th>
                      <th className="px-3 py-2 font-medium">Faollik (20)</th>
                      <th className="px-3 py-2 font-medium">Vazifa (20)</th>
                      <th className="px-3 py-2 font-medium">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map((r, i) => (
                      <tr key={r.counselorId} className="border-b border-border/50">
                        <td className="px-3 py-2.5 text-base">{rankEmoji(i)}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {r.statusEmoji} {r.counselorName}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{r.schoolName}</td>
                        <td className="px-3 py-2.5">{r.parts.coverage}</td>
                        <td className="px-3 py-2.5">{r.parts.tested}</td>
                        <td className="px-3 py-2.5">{r.parts.activity}</td>
                        <td className="px-3 py-2.5">{r.parts.tasks}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                            {r.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
