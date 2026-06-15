import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useSchoolStats } from "@/lib/school-stats";
import { computeRating } from "@/lib/rating";
import { toast } from "sonner";
import { ClipboardList, Mail, Send, Loader2, CalendarClock, Megaphone, Trophy } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Vazifalar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["counselor"]}>
      <CounselorTasks />
    </ProtectedRoute>
  ),
});

interface MyAssignment {
  id: string;
  status: string;
  submission_note: string | null;
  review_note: string | null;
  tasks: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    created_at: string;
  } | null;
}

interface MessageRow {
  id: string;
  sender_name: string | null;
  recipient_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
}

function CounselorTasks() {
  const { user, schoolId } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"tasks" | "messages">("tasks");

  // ── Vazifalarim ──
  const {
    data: assignments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignments")
        .select(
          "id, status, submission_note, review_note, tasks(id, title, description, due_date, created_at)",
        )
        .eq("counselor_id", user!.id)
        .order("id", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyAssignment[];
    },
  });

  // ── Xabarlarim ──
  const { data: messages } = useQuery({
    queryKey: ["my-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_name, recipient_id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  const { data: myReads } = useQuery({
    queryKey: ["my-message-reads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("message_reads").select("message_id").eq("user_id", user!.id),
      );
      return new Set((data ?? []).map((r) => r.message_id));
    },
  });

  const unreadCount = (messages ?? []).filter((m) => !myReads?.has(m.id)).length;

  // Xabarlar oynasi ochilganda — barchasini o'qilgan deb belgilash
  useEffect(() => {
    if (tab !== "messages" || !user || !messages || !myReads) return;
    const unread = messages.filter((m) => !myReads.has(m.id));
    if (unread.length === 0) return;
    supabase
      .from("message_reads")
      .upsert(
        unread.map((m) => ({ message_id: m.id, user_id: user.id })),
        { onConflict: "message_id,user_id", ignoreDuplicates: true },
      )
      .then(() => {
        qc.invalidateQueries({ queryKey: ["my-message-reads"] });
      });
  }, [tab, user, messages, myReads, qc]);

  // ── O'z reytingim ──
  const { data: stats } = useSchoolStats();
  const { data: myTaskStats } = useQuery({
    queryKey: ["my-task-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("task_assignments").select("status").eq("counselor_id", user!.id),
      );
      const assigned = (data ?? []).length;
      const accepted = (data ?? []).filter((a) => a.status === "accepted").length;
      return { assigned, accepted };
    },
  });
  const mySchool = (stats ?? []).find((s) => s.id === schoolId);
  const myRating = mySchool ? computeRating(mySchool, myTaskStats) : null;

  // ── Topshirish dialogi ──
  const [submitting, setSubmitting] = useState<MyAssignment | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitTask() {
    if (!submitting) return;
    setBusy(true);
    const { error } = await supabase
      .from("task_assignments")
      .update({
        status: "submitted",
        submission_note: note.trim() || null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", submitting.id);
    setBusy(false);
    if (error) {
      toast.error("Topshirilmadi: " + error.message);
      return;
    }
    await logClientActivity(
      user?.id,
      "task_submitted",
      submitting.tasks?.title ?? "",
      undefined,
      schoolId,
    );
    toast.success("Vazifa topshirildi — admin ko'rib chiqadi");
    setSubmitting(null);
    setNote("");
    qc.invalidateQueries({ queryKey: ["my-assignments"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <ClipboardList className="h-7 w-7 text-primary" /> Vazifalar va xabarlar
        </h1>
        <p className="mb-6 text-muted-foreground">
          Super admindan kelgan vazifalar, e'lonlar va sizning reytingingiz.
        </p>

        {/* ── Reyting kartasi ── */}
        {myRating && (
          <Card className="mb-6 border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Mening reytingim
                  </p>
                  <p className="text-2xl font-bold text-foreground">{myRating.score} / 100</p>
                </div>
              </div>
              <div className="flex gap-4 text-center text-xs text-muted-foreground">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {myRating.parts.coverage}/30
                  </p>
                  Qamrov
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {myRating.parts.tested}/30
                  </p>
                  Test
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {myRating.parts.activity}/20
                  </p>
                  Faollik
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {myRating.parts.tasks}/20
                  </p>
                  Vazifalar
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Tab switcher ── */}
        <div className="mb-6 flex rounded-lg border border-border bg-muted/30 p-1">
          <button
            onClick={() => setTab("tasks")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "tasks"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="mr-1.5 inline h-4 w-4" />
            Vazifalar
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "messages"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="mr-1.5 inline h-4 w-4" />
            Xabarlar
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {tab === "tasks" ? (
          isError ? (
            <QueryError onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (assignments ?? []).length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Hozircha vazifa yo'q. 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {(assignments ?? []).map((a) => {
                const badge = taskStatusBadge(a.status);
                const overdue =
                  a.tasks?.due_date &&
                  new Date(a.tasks.due_date) < new Date() &&
                  (a.status === "assigned" || a.status === "returned");
                return (
                  <Card key={a.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                            {a.tasks?.title ?? "Vazifa"}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            {a.tasks?.due_date && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  overdue
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <CalendarClock className="h-3 w-3" />
                                {new Date(a.tasks.due_date).toLocaleDateString("uz-UZ")}
                              </span>
                            )}
                          </p>
                          {a.tasks?.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {a.tasks.description}
                            </p>
                          )}
                          {a.status === "returned" && a.review_note && (
                            <p className="mt-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                              Qaytarish sababi: {a.review_note}
                            </p>
                          )}
                          {a.status === "submitted" && a.submission_note && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Sizning izohingiz: {a.submission_note}
                            </p>
                          )}
                        </div>
                        {(a.status === "assigned" || a.status === "returned") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSubmitting(a);
                              setNote(a.submission_note ?? "");
                            }}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" /> Topshirish
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid gap-3">
            {(messages ?? []).length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  Hozircha xabar yo'q.
                </CardContent>
              </Card>
            ) : (
              (messages ?? []).map((m) => {
                const unread = !myReads?.has(m.id);
                return (
                  <Card
                    key={m.id}
                    className={`border-border/60 ${unread ? "border-primary/40 bg-primary/[0.03]" : ""}`}
                  >
                    <CardContent className="px-4 py-3">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {!m.recipient_id && <Megaphone className="h-3.5 w-3.5 text-primary" />}
                          {m.title ?? (m.recipient_id ? "Xabar" : "E'lon")}
                          {unread && (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                              YANGI
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.sender_name ?? "Admin"} ·{" "}
                          {new Date(m.created_at).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── Topshirish dialogi ── */}
        <Dialog open={!!submitting} onOpenChange={(o) => !o && setSubmitting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Vazifani topshirish</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{submitting?.tasks?.title}</p>
              <Label htmlFor="s-note">Izoh (nima bajarildi?)</Label>
              <Textarea
                id="s-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Hisobot tayyorlandi, 250 o'quvchi test topshirdi..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitting(null)} disabled={busy}>
                Bekor qilish
              </Button>
              <Button onClick={submitTask} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Topshirish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
