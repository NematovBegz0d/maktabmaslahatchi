import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { ClubCard } from "@/components/club-card";
import { StatCard } from "@/components/stat-card";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { CLUBS_STATIC, CLUB_COLOR_MAP, type Club, type ClubColor } from "@/types/clubs";
import { Users, Trophy, Star, BookOpen, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/clubs/")({
  head: () => ({ meta: [{ title: "Klublar — EduLens" }] }),
  component: () => (
    <ProtectedRoute>
      <ClubsPage />
    </ProtectedRoute>
  ),
});

function ClubsPage() {
  const { user, role, schoolId } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const isStaff = role === "admin" || role === "counselor";
  // Klub yaratish faqat maktabga biriktirilganlarga (maslahatchi) — RLS ham shuni talab qiladi
  const canCreate = role === "counselor" && !!schoolId;

  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cIcon, setCIcon] = useState("🏆");
  const [cColor, setCColor] = useState<ClubColor>("blue");
  const [cFocus, setCFocus] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Namuna rejimida — 7 ta tayyor klubni bir bosishda maktabga yaratish.
  // RLS "Counselors insert own school clubs" school_id = get_my_school_id() ni talab qiladi.
  async function seedSampleClubs() {
    if (!schoolId) return;
    setSeeding(true);
    const { error } = await supabase
      .from("clubs")
      .insert(CLUBS_STATIC.map((c) => ({ ...c, school_id: schoolId })));
    setSeeding(false);
    if (error) {
      toast.error("Klublar yaratilmadi: " + error.message);
      return;
    }
    toast.success("7 ta namuna klub maktabingizga qo'shildi");
    qc.invalidateQueries({ queryKey: ["clubs"] });
    qc.invalidateQueries({ queryKey: ["club-member-counts"] });
  }

  async function createClub() {
    if (!cName.trim()) {
      toast.error("Klub nomini kiriting");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("clubs").insert({
      name: cName.trim(),
      description: cDesc.trim(),
      focus_area: cFocus.trim(),
      icon: cIcon.trim() || "🏆",
      color: cColor,
      school_id: schoolId,
    });
    setCreating(false);
    if (error) {
      toast.error("Klub yaratilmadi: " + error.message);
      return;
    }
    toast.success("Klub yaratildi");
    setCreateOpen(false);
    setCName("");
    setCIcon("🏆");
    setCColor("blue");
    setCFocus("");
    setCDesc("");
    qc.invalidateQueries({ queryKey: ["clubs"] });
  }

  // DB dan klublar (id lar bilan)
  const {
    data: clubs,
    isLoading: clubsLoading,
    isError: clubsError,
    refetch: refetchClubs,
  } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Club[];
    },
  });

  // Har bir klubdagi a'zolar soni
  const { data: memberCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["club-member-counts"],
    enabled: !!clubs && clubs.length > 0,
    queryFn: async () => {
      const data = unwrap(await supabase.from("club_members").select("club_id"));
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        counts[row.club_id] = (counts[row.club_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  // O'quvchi uchun — o'zining klublari
  const { data: myMemberships } = useQuery({
    queryKey: ["my-club-memberships", user?.id],
    enabled: !!user && !isStaff,
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("club_members").select("club_id").eq("student_id", user!.id),
      );
      return new Set((data ?? []).map((r) => r.club_id));
    },
  });

  const isLoading = clubsLoading || countsLoading;

  // DB bo'sh — namuna rejimi (placeholderlar bosib bo'lmaydigan qilinadi)
  const isFallback = !clubsLoading && (!clubs || clubs.length === 0);
  const displayClubs: Club[] =
    clubs && clubs.length > 0
      ? clubs
      : CLUBS_STATIC.map((c, i) => ({
          ...c,
          id: `static-${i}`,
          created_at: new Date().toISOString(),
        }));

  // Statistika
  const totalMembers = memberCounts ? Object.values(memberCounts).reduce((a, b) => a + b, 0) : 0;
  const topClub = (clubs ?? []).reduce<{ name: string; count: number } | null>((top, c) => {
    const count = memberCounts?.[c.id] ?? 0;
    if (!top || count > top.count) return { name: c.name, count };
    return top;
  }, null);
  const myClubCount = myMemberships?.size ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Sarlavha ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Trophy className="h-7 w-7 text-primary" /> {t("clubs_title")}
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              {isStaff ? t("clubs_subtitle_staff") : t("clubs_subtitle_student")}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Klub qo'shish
            </Button>
          )}
        </div>

        {clubsError ? (
          <QueryError onRetry={() => refetchClubs()} />
        ) : (
          <>
            {/* ── Statistika (faqat admin) ── */}
            {isStaff && (
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label={t("clubs_total")}
                  value={displayClubs.length}
                  icon={Trophy}
                  accent="primary"
                />
                <StatCard
                  label={t("clubs_total_members")}
                  value={totalMembers}
                  icon={Users}
                  accent="success"
                />
                <StatCard
                  label={t("clubs_top")}
                  value={topClub?.name ?? "—"}
                  icon={Star}
                  accent="warning"
                />
              </div>
            )}

            {/* ── O'quvchi uchun stat ── */}
            {!isStaff && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <StatCard
                  label={t("clubs_total")}
                  value={displayClubs.length}
                  icon={BookOpen}
                  accent="primary"
                />
                <StatCard
                  label={t("clubs_my_count")}
                  value={myClubCount}
                  icon={Star}
                  accent="success"
                />
              </div>
            )}

            {/* ── Klublar grid ── */}
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Card key={i} className="border-border/60">
                    <div className="h-1.5 w-full bg-muted" />
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-full rounded-md" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* DB bo'sh bo'lsa ogohlantirish (gridtdan oldin) */}
                {isFallback && isStaff && (
                  <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      ⚠️ Maktabingizda hali klub yo'q — quyidagilar <strong>namuna</strong> (bosib
                      bo'lmaydi). O'z klublaringizni yarating yoki shu 7 tasini bir bosishda
                      qo'shing.
                    </p>
                    {canCreate && (
                      <Button
                        size="sm"
                        onClick={seedSampleClubs}
                        disabled={seeding}
                        className="shrink-0"
                      >
                        {seeding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-1.5 h-4 w-4" />
                        )}
                        Shu 7 klubni yaratish
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayClubs.map((club) => (
                    <ClubCard
                      key={club.id}
                      club={club}
                      memberCount={memberCounts?.[club.id] ?? 0}
                      isMember={myMemberships?.has(club.id)}
                      role={role}
                      disabled={isFallback}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Klub yaratish dialogi (maslahatchi) ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi klub</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_90px]">
                <div className="space-y-2">
                  <Label htmlFor="club-name">
                    Nomi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="club-name"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Yosh fiziklar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-icon">Belgi</Label>
                  <Input
                    id="club-icon"
                    value={cIcon}
                    onChange={(e) => setCIcon(e.target.value)}
                    placeholder="🔬"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-focus">Yo'nalish</Label>
                <Input
                  id="club-focus"
                  value={cFocus}
                  onChange={(e) => setCFocus(e.target.value)}
                  placeholder="Fan, Sport, San'at..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-desc">Tavsif</Label>
                <Textarea
                  id="club-desc"
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  rows={3}
                  placeholder="Klubda nimalar qilinadi..."
                />
              </div>
              <div className="space-y-2">
                <Label>Rang</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CLUB_COLOR_MAP) as ClubColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCColor(color)}
                      aria-label={color}
                      className={`h-8 w-8 rounded-full transition-transform ${CLUB_COLOR_MAP[color].bg} ${
                        cColor === color
                          ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Bekor qilish
              </Button>
              <Button onClick={createClub} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yaratish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
