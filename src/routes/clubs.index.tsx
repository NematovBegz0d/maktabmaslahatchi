import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { ClubCard } from "@/components/club-card";
import { StatCard } from "@/components/stat-card";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { CLUBS_STATIC, type Club } from "@/types/clubs";
import { Users, Trophy, Star, BookOpen } from "lucide-react";

export const Route = createFileRoute("/clubs/")({
  head: () => ({ meta: [{ title: "Klublar — EduLens" }] }),
  component: () => (
    <ProtectedRoute>
      <ClubsPage />
    </ProtectedRoute>
  ),
});

function ClubsPage() {
  const { user, role } = useAuth();
  const { t } = useI18n();
  const isAdmin = role === "admin";

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
      const { data } = await supabase.from("club_members").select("club_id");
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
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("student_id", user!.id);
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
  const totalMembers = memberCounts
    ? Object.values(memberCounts).reduce((a, b) => a + b, 0)
    : 0;
  const topClub = (clubs ?? []).reduce<{ name: string; count: number } | null>(
    (top, c) => {
      const count = memberCounts?.[c.id] ?? 0;
      if (!top || count > top.count) return { name: c.name, count };
      return top;
    },
    null
  );
  const myClubCount = myMemberships?.size ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Sarlavha ── */}
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Trophy className="h-7 w-7 text-primary" /> {t("clubs_title")}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            {isAdmin ? t("clubs_subtitle_staff") : t("clubs_subtitle_student")}
          </p>
        </div>

        {clubsError ? (
          <QueryError onRetry={() => refetchClubs()} />
        ) : (
          <>
            {/* ── Statistika (faqat admin) ── */}
            {isAdmin && (
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
            {!isAdmin && (
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
                {isFallback && isAdmin && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    ⚠️ Klublar hali databazaga qo'shilmagan. Quyidagi klublar namuna
                    ko'rinishida ko'rsatilmoqda. Ularni Supabase migratsiyasi orqali seed
                    qiling.
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
      </main>
    </div>
  );
}
