import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { taskStatusBadge, logClientActivity } from "@/lib/tasks";
import { toast } from "sonner";
import { ClipboardList, Plus, Loader2, CheckCircle2, Undo2, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/admin/tasks")({
  head: () => ({ meta: [{ title: "Vazifalar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminTasks />
    </ProtectedRoute>
  ),
});

interface Assignment {
  id: string;
  task_id: string;
  counselor_id: string;
  status: string;
  submission_note: string | null;
  submitted_at: string | null;
  review_note: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  task_assignments: Assignment[];
}

function AdminTasks() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: counselors = [] } = useQuery({
    queryKey: ["counselor-directory"],
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("counselor_directory")
          .select("id, full_name, school_name, is_active")
          .order("full_name"),
      );
      return (data ?? []) as {
        id: string;
        full_name: string | null;
        school_name: string | null;
        is_active: boolean | null;
      }[];
    },
  });
  const counselorName = (id: string) =>
    counselors.find((c) => c.id === id)?.full_name ?? "Noma'lum";
  const counselorSchool = (id: string) => counselors.find((c) => c.id === id)?.school_name ?? "";

  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, task_assignments(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });

  // ── Yaratish dialogi ──
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // ── Qaytarish dialogi ──
  const [returning, setReturning] = useState<{ a: Assignment; taskTitle: string } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCounselors = counselors.filter((c) => c.is_active !== false);

  function toggleCounselor(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createTask() {
    if (!title.trim()) {
      toast.error("Vazifa nomini kiriting");
      return;
    }
    if (selected.size === 0) {
      toast.error("Kamida bitta maslahatchini tanlang");
      return;
    }
    setSaving(true);
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        created_by: user?.id,
      })
      .select("id")
      .single();
    if (error || !task) {
      setSaving(false);
      toast.error("Vazifa yaratilmadi: " + (error?.message ?? ""));
      return;
    }
    const { error: aErr } = await supabase
      .from("task_assignments")
      .insert([...selected].map((cid) => ({ task_id: task.id, counselor_id: cid })));
    setSaving(false);
    if (aErr) {
      toast.error("Biriktirishda xatolik: " + aErr.message);
      return;
    }
    await logClientActivity(user?.id, "task_created", title.trim(), {
      assignees: selected.size,
    });
    toast.success(`Vazifa ${selected.size} ta maslahatchiga yuborildi`);
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setDueDate("");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  }

  async function review(a: Assignment, taskTitle: string, accept: boolean, note?: string) {
    setBusyId(a.id);
    const { error } = await supabase
      .from("task_assignments")
      .update({
        status: accept ? "accepted" : "returned",
        review_note: note?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", a.id);
    setBusyId(null);
    if (error) {
      toast.error("Xatolik: " + error.message);
      return;
    }
    await logClientActivity(
      user?.id,
      accept ? "task_accepted" : "task_returned",
      `${taskTitle} — ${counselorName(a.counselor_id)}`,
    );
    toast.success(accept ? "Vazifa qabul qilindi" : "Vazifa qaytarildi");
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <ClipboardList className="h-7 w-7 text-primary" /> Vazifalar
            </h1>
            <p className="mt-1 text-muted-foreground">
              Maslahatchilarga vazifa bering va bajarilishini qabul qiling.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Vazifa berish
          </Button>
        </div>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (tasks ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hali vazifa berilmagan — "Vazifa berish" tugmasidan boshlang.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(tasks ?? []).map((t) => {
              const overdue =
                t.due_date &&
                new Date(t.due_date) < new Date() &&
                t.task_assignments.some((a) => a.status === "assigned" || a.status === "returned");
              return (
                <Card key={t.id} className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {t.title}
                      {t.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            overdue
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <CalendarClock className="h-3 w-3" />
                          {new Date(t.due_date).toLocaleDateString("uz-UZ")}
                        </span>
                      )}
                    </CardTitle>
                    {t.description && (
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-border/50">
                      {t.task_assignments.map((a) => {
                        const badge = taskStatusBadge(a.status);
                        return (
                          <div
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2"
                          >
                            <div className="min-w-48">
                              <p className="text-sm font-medium text-foreground">
                                {counselorName(a.counselor_id)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {counselorSchool(a.counselor_id)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            {a.submission_note && (
                              <p
                                className="max-w-sm flex-1 text-xs text-muted-foreground"
                                title={a.submission_note}
                              >
                                💬 {a.submission_note}
                              </p>
                            )}
                            {a.status === "submitted" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={busyId === a.id}
                                  onClick={() => review(a, t.title, true)}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Qabul
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === a.id}
                                  onClick={() => {
                                    setReturning({ a, taskTitle: t.title });
                                    setReviewNote("");
                                  }}
                                >
                                  <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Qaytarish
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Vazifa yaratish dialogi ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi vazifa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="t-title">
                  Nomi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="t-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="May oyi hisobotini topshirish"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-desc">Tavsif</Label>
                <Textarea
                  id="t-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Nimani, qanday formatda bajarish kerakligi..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-due">Muddat</Label>
                <Input
                  id="t-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Kimga <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() =>
                      setSelected(
                        selected.size === activeCounselors.length
                          ? new Set()
                          : new Set(activeCounselors.map((c) => c.id)),
                      )
                    }
                  >
                    {selected.size === activeCounselors.length
                      ? "Barchasini bekor qilish"
                      : "Barchasini tanlash"}
                  </button>
                </div>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                  {activeCounselors.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">Aktiv maslahatchi yo'q.</p>
                  )}
                  {activeCounselors.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleCounselor(c.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex-1">{c.full_name}</span>
                      <span className="text-xs text-muted-foreground">{c.school_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Bekor qilish
              </Button>
              <Button onClick={createTask} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yuborish ({selected.size})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Qaytarish dialogi ── */}
        <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Vazifani qaytarish</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="r-note">Izoh (nima yetishmaydi?)</Label>
              <Textarea
                id="r-note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Hisobotda 9-sinflar qamrovi ko'rsatilmagan..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturning(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (returning) review(returning.a, returning.taskTitle, false, reviewNote);
                  setReturning(null);
                }}
              >
                Qaytarish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
