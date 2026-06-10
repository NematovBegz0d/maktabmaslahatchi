import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/query-error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  CLUB_COLOR_MAP,
  type ClubColor,
  type ClubMemberWithProfile,
} from "@/types/clubs";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Search,
  GraduationCap,
  CalendarDays,
  Trophy,
} from "lucide-react";

const ADD_LIST_LIMIT = 50;

export const Route = createFileRoute("/clubs/$id")({
  head: () => ({ meta: [{ title: "Klub — EduLens" }] }),
  component: () => (
    <ProtectedRoute>
      <ClubDetailPage />
    </ProtectedRoute>
  ),
});

function ClubDetailPage() {
  const { id } = Route.useParams();
  const { role } = useAuth();
  const { t } = useI18n();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [addSearchQ, setAddSearchQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [notes, setNotes] = useState("");

  // Klub ma'lumotlari
  const {
    data: club,
    isLoading: clubLoading,
    isError: clubError,
    refetch: refetchClub,
  } = useQuery({
    queryKey: ["club", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Klub a'zolari (RLS: o'quvchi faqat o'zini, ota-ona faqat farzandini ko'radi)
  const {
    data: members,
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["club-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_members")
        .select(
          "id, student_id, joined_at, notes, profiles(id, full_name, class_number, class_letter)"
        )
        .eq("club_id", id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClubMemberWithProfile[];
    },
  });

  // O'quvchilar ro'yxati (faqat maslahatchi/admin uchun, a'zo qo'shish)
  // student_directory view — faqat 'student' rolidagilar (bitta so'rov).
  const { data: allStudents } = useQuery({
    queryKey: ["students-for-clubs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_directory")
        .select("id, full_name, class_number, class_letter")
        .order("full_name", { ascending: true });
      return data ?? [];
    },
  });

  const colors = club
    ? (CLUB_COLOR_MAP[club.color as ClubColor] ?? CLUB_COLOR_MAP.blue)
    : CLUB_COLOR_MAP.blue;

  // Mavjud a'zolar ID lari seti
  const memberStudentIds = new Set((members ?? []).map((m) => m.student_id));

  // Filtrlangan a'zolar (qidiruv)
  const filteredMembers = (members ?? []).filter((m) => {
    if (!searchQ) return true;
    const name = m.profiles?.full_name?.toLowerCase() ?? "";
    return name.includes(searchQ.toLowerCase());
  });

  // Qo'shish modali uchun — a'zo bo'lmagan o'quvchilar
  const availableStudents = (allStudents ?? []).filter(
    (s) =>
      !memberStudentIds.has(s.id) &&
      (!addSearchQ ||
        (s.full_name ?? "").toLowerCase().includes(addSearchQ.toLowerCase()))
  );
  const visibleStudents = availableStudents.slice(0, ADD_LIST_LIMIT);
  const hiddenCount = availableStudents.length - visibleStudents.length;

  // Sinf bo'yicha statistika
  const classCounts: Record<string, number> = {};
  (members ?? []).forEach((m) => {
    const key = m.profiles?.class_number
      ? `${m.profiles.class_number}${m.profiles.class_letter ?? ""}`
      : "Belgilanmagan";
    classCounts[key] = (classCounts[key] ?? 0) + 1;
  });

  /** Supabase xatosini tushunarli xabarga aylantirish */
  function describeError(error: { code?: string; message?: string } | null): string {
    if (!error) return "Noma'lum xatolik.";
    if (error.code === "23505") return "Bu o'quvchi allaqachon klub a'zosi.";
    if (error.code === "42501" || error.code === "PGRST301")
      return "Sizda bu amalni bajarish uchun ruxsat yo'q.";
    return error.message ?? "Xatolik yuz berdi.";
  }

  async function addMember(studentId: string) {
    setAdding(true);
    try {
      const { error } = await supabase.from("club_members").insert({
        club_id: id,
        student_id: studentId,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success(t("clubs_member_added"));
      queryClient.invalidateQueries({ queryKey: ["club-members", id] });
      queryClient.invalidateQueries({ queryKey: ["club-member-counts"] });
      setNotes("");
    } catch (e: unknown) {
      toast.error(describeError(e as { code?: string; message?: string }));
    } finally {
      setAdding(false);
    }
  }

  async function removeMember(memberId: string) {
    if (removing) return; // double-click himoyasi
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success(t("clubs_member_removed"));
      queryClient.invalidateQueries({ queryKey: ["club-members", id] });
      queryClient.invalidateQueries({ queryKey: ["club-member-counts"] });
    } catch (e: unknown) {
      toast.error(describeError(e as { code?: string; message?: string }));
    } finally {
      setRemoving(false);
      setRemoveId(null);
    }
  }

  if (clubLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <QueryError onRetry={() => refetchClub()} />
        </main>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 text-center">
          <p className="text-muted-foreground">{t("clubs_not_found")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/clubs">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("clubs_back")}
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Orqaga tugma ── */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-5 -ml-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/clubs" })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("clubs_back")}
        </Button>

        {/* ── Klub sarlavha kartasi ── */}
        <Card
          className={`mb-6 overflow-hidden border ${colors.border}`}
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className={`h-2 w-full ${colors.bg}`} />
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${colors.soft}`}
                >
                  {club.icon}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{club.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {club.focus_area
                      .split(", ")
                      .filter(Boolean)
                      .map((tag: string) => (
                        <Badge key={tag} className={`text-xs ${colors.badge}`}>
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              {/* A'zolar soni — faqat staff uchun (RLS o'quvchiga to'liq sonni bermaydi) */}
              {isAdmin && (
                <div className={`rounded-xl px-5 py-3 text-center ${colors.soft}`}>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {members?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("clubs_member_count")}</p>
                </div>
              )}
            </div>

            {/* Sinf bo'yicha breakdown — faqat staff */}
            {isAdmin && Object.keys(classCounts).length > 0 && (
              <div className="mt-5 border-t border-border/40 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("clubs_by_class")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(classCounts)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([cls, count]) => (
                      <span
                        key={cls}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colors.badge}`}
                      >
                        <GraduationCap className="h-3 w-3" />
                        {cls}-sinf — {count} ta
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── A'zolar bo'limi — faqat maslahatchi/admin ko'radi ── */}
        {isAdmin ? (
          <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              {/* Header + qidiruv + qo'shish */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Users className="h-5 w-5 text-primary" /> {t("clubs_members_list")}
                  <Badge variant="secondary" className="ml-1">
                    {filteredMembers.length}
                  </Badge>
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("clubs_search_name")}
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      className="h-8 w-44 pl-8 text-sm"
                    />
                  </div>
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {t("clubs_add_member")}
                  </Button>
                </div>
              </div>

              {/* A'zolar jadvali */}
              {membersError ? (
                <QueryError onRetry={() => refetchMembers()} />
              ) : membersLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium text-foreground">
                    {searchQ ? t("clubs_search_empty") : t("clubs_empty_members")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQ
                      ? "Boshqa ism bilan qidiring"
                      : "\"Qo'shish\" tugmasi orqali o'quvchilarni qo'shing"}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/50">
                  {/* Jadval sarlavhasi */}
                  <div className="grid grid-cols-[1fr_100px_140px_auto] gap-3 border-b border-border/50 bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>F.I.O</span>
                    <span>Sinf</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Qo'shilgan
                    </span>
                    <span className="text-right">Amal</span>
                  </div>

                  {/* Qatorlar */}
                  <div className="divide-y divide-border/30">
                    {filteredMembers.map((m, idx) => (
                      <div
                        key={m.id}
                        className={`grid grid-cols-[1fr_100px_140px_auto] items-center gap-3 px-4 py-3 transition hover:bg-muted/20 ${
                          idx % 2 === 0 ? "" : "bg-muted/10"
                        }`}
                      >
                        {/* Ism */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colors.soft} ${colors.text}`}
                          >
                            {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {m.profiles?.full_name ?? "Noma'lum"}
                            </p>
                            {/* notes faqat staff ko'radi */}
                            {m.notes && (
                              <p className="truncate text-xs text-muted-foreground">
                                {m.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Sinf */}
                        <span className="text-sm text-muted-foreground">
                          {m.profiles?.class_number
                            ? `${m.profiles.class_number}-${m.profiles.class_letter ?? ""}`
                            : "—"}
                        </span>

                        {/* Sana */}
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.joined_at).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>

                        {/* O'chirish tugmasi */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={removing}
                          className="h-7 w-7 shrink-0 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setRemoveId(m.id)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* O'quvchi / ota-ona uchun — faqat o'z a'zoligi holati */
          <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6">
              {memberStudentIds.size > 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Siz ushbu klub a'zosisiz 🎉
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-8 text-center">
                  <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Bu klubga a'zo bo'lish uchun maktab maslahatchingizga murojaat qiling.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* ── A'zo qo'shish modali (faqat staff) ── */}
      {isAdmin && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{club.icon}</span> {club.name} — {t("clubs_add_member")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* Izoh */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Izoh (ixtiyoriy)
                </label>
                <Input
                  placeholder="Masalan: faol ishtirokchi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* O'quvchi qidirish */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  O'quvchi tanlang
                </label>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Ism bo'yicha qidirish..."
                    value={addSearchQ}
                    onChange={(e) => setAddSearchQ(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto rounded-lg border border-border/50">
                  {availableStudents.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      {addSearchQ ? t("clubs_search_empty") : "Barcha o'quvchilar allaqachon a'zo"}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {visibleStudents.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => addMember(s.id)}
                          disabled={adding}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50 disabled:opacity-60"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colors.soft} ${colors.text}`}
                          >
                            {(s.full_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {s.full_name ?? "Noma'lum"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.class_number
                                ? `${s.class_number}-${s.class_letter ?? ""} sinf`
                                : "Sinf kiritilmagan"}
                            </p>
                          </div>
                          <UserPlus className={`ml-auto h-4 w-4 shrink-0 ${colors.text}`} />
                        </button>
                      ))}
                      {hiddenCount > 0 && (
                        <p className="p-3 text-center text-xs text-muted-foreground">
                          Yana {hiddenCount} ta o'quvchi — qidiruvdan foydalaning
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                {t("close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── A'zoni o'chirish tasdiqlash ── */}
      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clubs_remove_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              Ushbu o'quvchini <strong>{club.name}</strong> klubidan chiqarmoqchimisiz? Bu
              amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (removeId) removeMember(removeId);
              }}
            >
              Chiqarish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
