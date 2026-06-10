import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/query-error";
import { AchievementCard } from "@/components/achievement-card";
import { AddAchievementDialog } from "@/components/add-achievement-dialog";
import { AddEnrollmentDialog } from "@/components/add-enrollment-dialog";
import { ClubBadge } from "@/components/club-badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  ENROLLMENT_STATUS_MAP,
  computeEngagement,
  type Achievement,
  type Enrollment,
  type EnrollmentStatus,
} from "@/types/social-portfolio";
import type { ClubColor } from "@/types/clubs";
import {
  Trophy,
  Medal,
  BookOpen,
  Activity,
  Plus,
  Trash2,
  GraduationCap,
  Building2,
} from "lucide-react";

interface SocialPortfolioProps {
  studentId: string;
  canEdit?: boolean;
}

export function SocialPortfolio({ studentId, canEdit }: SocialPortfolioProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [addAchievementOpen, setAddAchievementOpen] = useState(false);
  const [addEnrollmentOpen, setAddEnrollmentOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Klublar
  const { data: clubs } = useQuery({
    queryKey: ["sp-clubs", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_members")
        .select("id, joined_at, clubs(id, name, icon, color)")
        .eq("student_id", studentId);
      return (data ?? []) as unknown as {
        id: string;
        joined_at: string;
        clubs: { id: string; name: string; icon: string; color: string } | null;
      }[];
    },
  });

  // Yutuqlar
  const {
    data: achievements,
    isLoading: achLoading,
    isError: achError,
    refetch: refetchAch,
  } = useQuery({
    queryKey: ["sp-achievements", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_achievements")
        .select("*")
        .eq("student_id", studentId)
        .order("achieved_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });

  // Maktabdan tashqari ta'lim
  const {
    data: enrollments,
    isLoading: enrLoading,
    isError: enrError,
    refetch: refetchEnr,
  } = useQuery({
    queryKey: ["sp-enrollments", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extracurricular_enrollments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
  });

  const clubsCount = clubs?.length ?? 0;
  const activeEnrollments = (enrollments ?? []).filter((e) => e.status === "active").length;
  const engagement = computeEngagement({
    clubsCount,
    achievements: achievements ?? [],
    activeEnrollments,
  });

  function invalidateAch() {
    queryClient.invalidateQueries({ queryKey: ["sp-achievements", studentId] });
  }
  function invalidateEnr() {
    queryClient.invalidateQueries({ queryKey: ["sp-enrollments", studentId] });
  }

  async function deleteAchievement(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("student_achievements").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("sp_achievement_removed"));
      invalidateAch();
    } catch {
      toast.error(t("delete_error"));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteEnrollment(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("extracurricular_enrollments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success(t("sp_enrollment_removed"));
      invalidateEnr();
    } catch {
      toast.error(t("delete_error"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Ijtimoiy faollik ko'rsatkichi ── */}
      <Card className="overflow-hidden border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="h-1.5 w-full" style={{ background: "var(--gradient-primary)" }} />
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{t("sp_engagement")}</h3>
                <p className={`text-sm font-medium ${engagement.color}`}>
                  {t(engagement.levelKey as TranslationKey)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-foreground">{engagement.score}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${engagement.score}%` }}
            />
          </div>

          {/* Mini statistika */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <Trophy className="mx-auto mb-1 h-4 w-4 text-purple-500" />
              <p className="text-lg font-bold text-foreground">{clubsCount}</p>
              <p className="text-xs text-muted-foreground">{t("sp_clubs")}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <Medal className="mx-auto mb-1 h-4 w-4 text-amber-500" />
              <p className="text-lg font-bold text-foreground">{achievements?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t("sp_achievements")}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <BookOpen className="mx-auto mb-1 h-4 w-4 text-blue-500" />
              <p className="text-lg font-bold text-foreground">{activeEnrollments}</p>
              <p className="text-xs text-muted-foreground">{t("sp_active_activity")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Klublar ── */}
      <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-purple-500" /> {t("sp_clubs")}
          </h3>
          {clubsCount > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {clubs!.map((m) =>
                m.clubs ? (
                  <ClubBadge
                    key={m.id}
                    name={m.clubs.name}
                    icon={m.clubs.icon}
                    color={m.clubs.color as ClubColor}
                    joinedAt={m.joined_at}
                  />
                ) : null
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("sp_no_clubs")}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Yutuqlar ── */}
      <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Medal className="h-4 w-4 text-amber-500" /> {t("sp_achievements_title")}
            </h3>
            {canEdit && (
              <Button size="sm" onClick={() => setAddAchievementOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("add")}
              </Button>
            )}
          </div>

          {achError ? (
            <QueryError onRetry={() => refetchAch()} />
          ) : achLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (achievements?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center">
              <Medal className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {canEdit ? t("sp_no_ach_admin") : t("sp_no_ach_student")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {achievements!.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  canEdit={canEdit}
                  onDelete={deleteAchievement}
                  deleting={deletingId === a.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Maktabdan tashqari ta'lim ── */}
      <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <GraduationCap className="h-4 w-4 text-blue-500" /> {t("sp_extracurricular")}
            </h3>
            {canEdit && (
              <Button size="sm" onClick={() => setAddEnrollmentOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("add")}
              </Button>
            )}
          </div>

          {enrError ? (
            <QueryError onRetry={() => refetchEnr()} />
          ) : enrLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (enrollments?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {canEdit ? t("sp_no_enr_admin") : t("sp_no_enr_student")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {enrollments!.map((e) => {
                const st =
                  ENROLLMENT_STATUS_MAP[e.status as EnrollmentStatus] ??
                  ENROLLMENT_STATUS_MAP.active;
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 rounded-xl border border-border/50 p-4 transition hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/40">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground leading-tight">
                          {e.institution_name}
                        </p>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === e.id}
                            className="h-7 w-7 shrink-0 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteEnrollment(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {e.direction && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{e.direction}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.badge}`}>
                          {st.label}
                        </span>
                        {e.schedule && (
                          <span className="text-xs text-muted-foreground">🕐 {e.schedule}</span>
                        )}
                        {e.start_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.start_date).toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            dan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialoglar (faqat admin) ── */}
      {canEdit && (
        <>
          <AddAchievementDialog
            studentId={studentId}
            open={addAchievementOpen}
            onOpenChange={setAddAchievementOpen}
            onAdded={invalidateAch}
          />
          <AddEnrollmentDialog
            studentId={studentId}
            open={addEnrollmentOpen}
            onOpenChange={setAddEnrollmentOpen}
            onAdded={invalidateEnr}
          />
        </>
      )}
    </div>
  );
}
