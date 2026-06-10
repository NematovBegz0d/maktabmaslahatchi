import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/query-error";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  CLUB_COLOR_MAP,
  type ClubColor,
  type Club,
  type MembershipWithClub,
} from "@/types/clubs";
import { Trophy, ArrowRight, Star, BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/my-clubs")({
  head: () => ({ meta: [{ title: "Mening Klublarim — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["student"]}>
      <MyClubsPage />
    </ProtectedRoute>
  ),
});

function MyClubsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const {
    data: memberships,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    // Distinct key: my-profile sahifasi ["my-clubs-profile", uid] dan foydalanadi
    queryKey: ["my-clubs-detail", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_members")
        .select("id, joined_at, notes, clubs(*)")
        .eq("student_id", user!.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MembershipWithClub[];
    },
  });

  // Qo'shilmagan klublar (tavsiya uchun)
  const { data: allClubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clubs")
        .select("*")
        .order("created_at", { ascending: true });
      return (data ?? []) as Club[];
    },
  });

  const myClubIds = new Set((memberships ?? []).map((m) => m.clubs?.id));
  const suggestedClubs = (allClubs ?? [])
    .filter((c) => !myClubIds.has(c.id))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Sarlavha ── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Star className="h-7 w-7 text-primary" /> {t("clubs_my_title")}
            </h1>
            <p className="mt-1.5 text-muted-foreground">{t("clubs_my_subtitle")}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/clubs">
              <BookOpen className="mr-1.5 h-4 w-4" /> {t("clubs_all")}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* ── Mening klublarim ── */}
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !memberships || memberships.length === 0 ? (
          /* Bo'sh holat */
          <Card className="mb-8 border-dashed border-border">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Trophy className="mb-4 h-14 w-14 text-muted-foreground/30" />
              <h2 className="text-lg font-semibold text-foreground">
                {t("clubs_my_empty_title")}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {t("clubs_my_empty_desc")}
              </p>
              <Button asChild className="mt-6">
                <Link to="/clubs">
                  <BookOpen className="mr-1.5 h-4 w-4" /> {t("clubs_view_all")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* A'zo bo'lgan klublar soni */}
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Star className="h-3.5 w-3.5" />
                {memberships.length} ta klubda a'zo
              </span>
            </div>

            {/* Klublar grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {memberships.map((m) => {
                const club = m.clubs;
                if (!club) return null;
                const colors =
                  CLUB_COLOR_MAP[club.color as ClubColor] ?? CLUB_COLOR_MAP.blue;

                return (
                  <Card
                    key={m.id}
                    className={`overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-md ${colors.border}`}
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className={`h-1.5 w-full ${colors.bg}`} />
                    <CardContent className="p-5">
                      {/* Club header */}
                      <div className="mb-3 flex items-start gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${colors.soft}`}
                        >
                          {club.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{club.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(m.joined_at).toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                            da qo'shilgan
                          </p>
                        </div>
                      </div>

                      {/* Tavsif */}
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {club.description}
                      </p>

                      {/* Fokus yo'nalishlari */}
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {club.focus_area.split(", ").map((tag: string) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Izoh */}
                      {m.notes && (
                        <p className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground italic">
                          "{m.notes}"
                        </p>
                      )}

                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to="/clubs/$id" params={{ id: club.id }}>
                          Batafsil <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ── Tavsiya etilgan klublar ── */}
        {suggestedClubs.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-secondary" />
              {t("clubs_other")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {suggestedClubs.map((club) => {
                const colors =
                  CLUB_COLOR_MAP[club.color as ClubColor] ?? CLUB_COLOR_MAP.blue;
                return (
                  <Link
                    key={club.id}
                    to="/clubs/$id"
                    params={{ id: club.id }}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 transition hover:shadow-sm ${colors.border} ${colors.soft}`}
                  >
                    <span className="text-2xl">{club.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${colors.text}`}>
                        {club.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {club.focus_area.split(", ")[0]}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
            {(allClubs ?? []).filter((c) => !myClubIds.has(c.id)).length > 3 && (
              <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
                <Link to="/clubs">
                  {t("clubs_all")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
