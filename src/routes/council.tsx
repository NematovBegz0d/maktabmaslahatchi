import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/query-error";
import { CouncilMemberCard } from "@/components/council-member-card";
import { AddCouncilMemberDialog } from "@/components/add-council-member-dialog";
import { AddCouncilActivityDialog } from "@/components/add-council-activity-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  POSITION_ORDER,
  POSITION_MAP,
  type CouncilMemberWithProfile,
  type CouncilActivity,
  type CouncilPosition,
} from "@/types/council";
import { Landmark, UserPlus, CalendarPlus, Users, Trash2, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/council")({
  head: () => ({ meta: [{ title: "O'quvchilar Kengashi — EduLens" }] }),
  component: () => (
    <ProtectedRoute>
      <CouncilPage />
    </ProtectedRoute>
  ),
});

/** Joriy o'quv yilini hisoblash (sentabrdan boshlanadi) */
function currentTerm(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function CouncilPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const term = currentTerm();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: members,
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["council-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("council_members")
        .select(
          "*, profiles(id, full_name, class_number, class_letter)"
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CouncilMemberWithProfile[];
    },
  });

  const {
    data: activities,
    isLoading: actLoading,
    isError: actError,
    refetch: refetchAct,
  } = useQuery({
    queryKey: ["council-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("council_activities")
        .select("*")
        .order("activity_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as CouncilActivity[];
    },
  });

  const existingStudentIds = new Set((members ?? []).map((m) => m.student_id));

  // Lavozim bo'yicha guruhlash
  const grouped: Record<CouncilPosition, CouncilMemberWithProfile[]> = {
    chairman: [],
    deputy: [],
    secretary: [],
    member: [],
  };
  (members ?? []).forEach((m) => {
    const p = (POSITION_MAP[m.position] ? m.position : "member") as CouncilPosition;
    grouped[p].push(m);
  });

  function invalidateMembers() {
    queryClient.invalidateQueries({ queryKey: ["council-members"] });
  }
  function invalidateActivities() {
    queryClient.invalidateQueries({ queryKey: ["council-activities"] });
  }

  async function deleteMember(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("council_members").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("council_member_removed"));
      invalidateMembers();
    } catch {
      toast.error(t("delete_error"));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteActivity(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("council_activities").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("council_activity_removed"));
      invalidateActivities();
    } catch {
      toast.error(t("delete_error"));
    } finally {
      setDeletingId(null);
    }
  }

  const totalMembers = members?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Sarlavha ── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Landmark className="h-7 w-7 text-primary" /> {t("council_page_title")}
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              {t("council_subtitle")}{" "}
              <span className="font-medium text-foreground">{term}</span> {t("council_year")}.
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddActivityOpen(true)}>
                <CalendarPlus className="mr-1.5 h-4 w-4" /> {t("council_add_activity")}
              </Button>
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" /> {t("council_add_member")}
              </Button>
            </div>
          )}
        </div>

        {/* ── A'zolar ── */}
        {membersError ? (
          <QueryError onRetry={() => refetchMembers()} />
        ) : membersLoading ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : totalMembers === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Landmark className="mb-4 h-14 w-14 text-muted-foreground/30" />
              <h2 className="text-lg font-semibold text-foreground">{t("council_empty_title")}</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {isAdmin ? t("council_empty_admin") : t("council_empty_student")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {POSITION_ORDER.map((pos) => {
              const list = grouped[pos];
              if (list.length === 0) return null;
              const meta = POSITION_MAP[pos];
              return (
                <div key={pos}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>{meta.icon}</span> {meta.label}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{list.length}</span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {list.map((m) => (
                      <CouncilMemberCard
                        key={m.id}
                        member={m}
                        canEdit={isAdmin}
                        onDelete={deleteMember}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Kengash faoliyati ── */}
        <div className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <Users className="h-5 w-5 text-primary" /> {t("council_activities_title")}
          </h2>

          {actError ? (
            <QueryError onRetry={() => refetchAct()} />
          ) : actLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (activities?.length ?? 0) === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {isAdmin ? t("council_act_empty_admin") : t("council_act_empty_student")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities!.map((a) => (
                <Card key={a.id} className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground leading-tight">{a.title}</p>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === a.id}
                            className="h-7 w-7 shrink-0 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteActivity(a.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {a.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                      )}
                      {a.activity_date && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {new Date(a.activity_date).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Dialoglar (faqat admin) ── */}
      {isAdmin && (
        <>
          <AddCouncilMemberDialog
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            term={term}
            existingStudentIds={existingStudentIds}
            onAdded={invalidateMembers}
          />
          <AddCouncilActivityDialog
            open={addActivityOpen}
            onOpenChange={setAddActivityOpen}
            onAdded={invalidateActivities}
          />
        </>
      )}
    </div>
  );
}
