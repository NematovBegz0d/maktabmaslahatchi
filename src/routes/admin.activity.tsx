import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "Faoliyat jurnali — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminActivity />
    </ProtectedRoute>
  ),
});

const PAGE_SIZE = 25;

// Amal kodlari → o'zbekcha tavsif
const ACTION_LABELS: Record<string, string> = {
  student_created: "o'quvchi qo'shdi",
  students_imported: "o'quvchilarni import qildi",
  student_deleted: "o'quvchini o'chirdi",
  counselor_created: "maslahatchi yaratdi",
  counselor_password_reset: "maslahatchi parolini tikladi",
  counselor_reassigned: "maslahatchini ko'chirdi",
  counselor_blocked: "maslahatchini blokladi",
  counselor_unblocked: "maslahatchini blokdan chiqardi",
  task_created: "vazifa berdi",
  task_submitted: "vazifani topshirdi",
  task_accepted: "vazifani qabul qildi",
  task_returned: "vazifani qaytardi",
  message_sent: "xabar yubordi",
};

interface LogRow {
  id: string;
  actor_name: string | null;
  action: string;
  target_label: string | null;
  school_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function AdminActivity() {
  const [page, setPage] = useState(1);
  const [schoolFilter, setSchoolFilter] = useState("");

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const data = unwrap(await supabase.from("schools").select("id, name").order("name"));
      return (data ?? []) as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-log", page, schoolFilter],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("id, actor_name, action, target_label, school_id, details, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false });
      if (schoolFilter) query = query.eq("school_id", schoolFilter);
      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as LogRow[], total: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const schoolName = (id: string | null) => schools.find((s) => s.id === id)?.name ?? "";

  function describe(r: LogRow): string {
    const action = ACTION_LABELS[r.action] ?? r.action;
    const target = r.target_label ? ` — ${r.target_label}` : "";
    const count =
      r.action === "students_imported" && r.details?.created ? ` (${r.details.created} ta)` : "";
    return `${action}${target}${count}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <ScrollText className="h-7 w-7 text-primary" /> Faoliyat jurnali
        </h1>
        <p className="mb-6 text-muted-foreground">
          Kim, qachon, nima qildi — o'zgarmas yozuvlar (jami: {total}).
        </p>

        <AdminTabs />

        <div className="mb-4">
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Barcha maktablar</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hozircha yozuv yo'q.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-2">
              {rows.map((r) => (
                <Card key={r.id} className="border-border/60">
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{r.actor_name ?? "Noma'lum"}</span>{" "}
                        {describe(r)}
                      </p>
                      {r.school_id && (
                        <p className="text-xs text-muted-foreground">{schoolName(r.school_id)}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
