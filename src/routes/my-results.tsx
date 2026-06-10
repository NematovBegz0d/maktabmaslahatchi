import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, FileText } from "lucide-react";

export const Route = createFileRoute("/my-results")({
  head: () => ({ meta: [{ title: "Mening natijalarim — EduLens" }] }),
  component: () => (<ProtectedRoute><MyResults /></ProtectedRoute>),
});

function MyResults() {
  const { user } = useAuth();

  const { data: results, isLoading } = useQuery({
    queryKey: ["my-test-results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("test_results")
        .select("id, holland_code, personality_type, scaled_scores, raw_scores, created_at, tests(name_uz)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as {
        id: string;
        holland_code: string | null;
        personality_type: string | null;
        scaled_scores: Record<string, number> | null;
        raw_scores: Record<string, number> | null;
        created_at: string;
        tests: { name_uz: string } | null;
      }[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mening natijalarim</h1>
            <p className="mt-1 text-muted-foreground">Topshirilgan testlar va ballar</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/my-profile"><FileText className="mr-1.5 h-4 w-4" />Portfoliom</Link>
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (results ?? []).length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <p className="text-muted-foreground">Hozircha yakunlangan test yo'q.</p>
                <Button asChild className="mt-4">
                  <Link to="/my-tests">Testlarni boshlash →</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            results!.map((r) => {
              const scores = r.scaled_scores ?? r.raw_scores;
              const scoreEntries = scores ? Object.entries(scores) : [];
              return (
                <Card key={r.id} className="border-border/60 transition hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{r.tests?.name_uz ?? "Test"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>

                        {/* Natija teglari */}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.holland_code && (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Holland: {r.holland_code}
                            </span>
                          )}
                          {r.personality_type && (
                            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {r.personality_type}
                            </span>
                          )}
                        </div>

                        {/* Subscale ballar */}
                        {scoreEntries.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                            {scoreEntries.map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs text-muted-foreground">{key}</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-primary"
                                      style={{ width: `${Math.min(100, Math.round((val / 20) * 100))}%` }}
                                    />
                                  </div>
                                  <span className="w-6 text-right text-xs font-semibold text-foreground">{val}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {results && results.length > 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Barcha natijalar portfolioda to'liq tahlil bilan ko'rsatiladi.{" "}
            <Link to="/my-profile" className="text-primary hover:underline">Portfoliomga o'tish →</Link>
          </p>
        )}
      </main>
    </div>
  );
}
