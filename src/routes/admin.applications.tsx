import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Inbox, Phone, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Arizalar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminApplications />
    </ProtectedRoute>
  ),
});

interface ApplicationRow {
  id: string;
  club_name: string | null;
  full_name: string;
  phone: string;
  note: string | null;
  status: string;
  created_at: string;
}

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  new: {
    label: "Yangi",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  contacted: {
    label: "Aloqa qilindi",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  enrolled: {
    label: "Yozildi",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  rejected: { label: "Rad etildi", cls: "bg-muted text-muted-foreground" },
};

const FILTERS = ["all", "new", "contacted", "enrolled", "rejected"] as const;

function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    data: apps,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["club-applications", filter],
    queryFn: async () => {
      let query = supabase
        .from("club_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ApplicationRow[];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["club-applications"] });
    qc.invalidateQueries({ queryKey: ["new-applications-count"] });
  }

  async function setStatus(a: ApplicationRow, status: string) {
    setBusyId(a.id);
    const { error } = await supabase.from("club_applications").update({ status }).eq("id", a.id);
    setBusyId(null);
    if (error) {
      toast.error("Xatolik: " + error.message);
      return;
    }
    toast.success(`Holat: ${STATUS_INFO[status]?.label ?? status}`);
    invalidate();
  }

  async function remove(a: ApplicationRow) {
    if (!confirm(`${a.full_name} arizasini o'chirasizmi?`)) return;
    setBusyId(a.id);
    const { error } = await supabase.from("club_applications").delete().eq("id", a.id);
    setBusyId(null);
    if (error) {
      toast.error("O'chirilmadi: " + error.message);
      return;
    }
    toast.success("O'chirildi");
    invalidate();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <Inbox className="h-7 w-7 text-primary" /> To'garak arizalari
        </h1>
        <p className="mb-6 text-muted-foreground">
          Landing'dagi "Qiziqish bildirish" formasidan kelgan arizalar.
        </p>

        <AdminTabs />

        {/* Holat filtri */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Barchasi" : STATUS_INFO[f].label}
            </button>
          ))}
        </div>

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (apps ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              {filter === "new" ? "Yangi ariza yo'q. 🎉" : "Ariza topilmadi."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(apps ?? []).map((a) => {
              const st = STATUS_INFO[a.status] ?? STATUS_INFO.new;
              return (
                <Card key={a.id} className="border-border/60">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-48">
                      <p className="font-semibold text-foreground">
                        {a.full_name}
                        <span
                          className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.club_name ?? "To'garak ko'rsatilmagan"} ·{" "}
                        {new Date(a.created_at).toLocaleString("uz-UZ", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {a.note && <p className="mt-1 text-xs text-muted-foreground">💬 {a.note}</p>}
                    </div>
                    <a
                      href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-1.5 font-mono text-sm font-semibold text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" /> {a.phone}
                    </a>
                    <div className="flex flex-wrap gap-2">
                      {a.status === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === a.id}
                          onClick={() => setStatus(a, "contacted")}
                        >
                          Aloqa qilindi
                        </Button>
                      )}
                      {a.status !== "enrolled" && a.status !== "rejected" && (
                        <Button
                          size="sm"
                          disabled={busyId === a.id}
                          onClick={() => setStatus(a, "enrolled")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Yozildi ✓
                        </Button>
                      )}
                      {a.status === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === a.id}
                          onClick={() => setStatus(a, "rejected")}
                          className="text-muted-foreground"
                        >
                          Rad etish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === a.id}
                        onClick={() => remove(a)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
