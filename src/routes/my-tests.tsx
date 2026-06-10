import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { TestCard } from "@/components/test-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/my-tests")({
  head: () => ({ meta: [{ title: "Mening testlarim — EduLens" }] }),
  component: () => (<ProtectedRoute><MyTests /></ProtectedRoute>),
});

function MyTests() {
  const { user } = useAuth();
  const { data: tests, isLoading, error } = useQuery({
    queryKey: ["all-tests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tests").select("*").eq("is_active", true).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: sessions } = useQuery({
    queryKey: ["my-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("test_sessions").select("test_id, status").eq("student_id", user!.id);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (error) toast.error("Testlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
  }, [error]);

  function statusOf(testId: string): "not_started" | "in_progress" | "completed" {
    const s = (sessions ?? []).find((x) => x.test_id === testId);
    if (!s) return "not_started";
    return s.status === "completed" ? "completed" : "in_progress";
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">Mening testlarim</h1>
        <p className="mt-1 text-muted-foreground">Quyidagi testlar orqali o'zingizni to'liq tahlil qiling.</p>
        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (tests ?? []).length === 0 ? (
          <Card className="mt-8 border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              Hozircha faol testlar yo'q.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(tests ?? []).map((t) => (
              <TestCard
                key={t.id}
                id={t.id}
                name={t.name_uz}
                description={t.description}
                questionCount={t.question_count}
                durationMinutes={t.duration_minutes}
                status={statusOf(t.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}