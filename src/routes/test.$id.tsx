import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// SVG content from DB — allowlist-style sanitizer: remove dangerous tags/attrs
function sanitizeSvg(raw: string): string {
  return raw
    // 1. script taglarini o'chirish
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // 2. foreignObject — ixtiyoriy HTML ni o'chirish
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    // 3. Barcha on* event handlerlarini o'chirish (qiymat bilan birga)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    // 4. <use> tashqi havola: faqat #anchor ruxsat, boshqalarni o'chirish
    .replace(/(<use[^>]*?\s)(?:xlink:href|href)\s*=\s*["'](?!#)[^"']*["']/gi, "$1")
    // 5. <style> ichidagi @import ni o'chirish
    .replace(/(<style[\s\S]*?)@import[^;]*;?([\s\S]*?<\/style>)/gi, "$1$2")
    // 6. javascript: sxemasini o'chirish (href, src, action)
    .replace(/\s+(?:href|src|action)\s*=\s*["']\s*javascript:[^"']*["']/gi, "");
}

export const Route = createFileRoute("/test/$id")({
  head: () => ({ meta: [{ title: "Test — EduLens" }] }),
  component: () => (<ProtectedRoute><TestRunner /></ProtectedRoute>),
});

interface OptionItem { value: number; label?: string; svg?: string }

function TestRunner() {
  const { id } = Route.useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);

  const { data: test } = useQuery({
    queryKey: ["test", id],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["questions", id],
    queryFn: async () => {
      const { data } = await supabase.from("questions").select("*").eq("test_id", id).order("question_number");
      return data ?? [];
    },
  });

  // Create or fetch session — supabase.auth.getUser() directly (ProtectedRoute already guards auth)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) {
          if (!cancelled) setSessionError("Foydalanuvchi topilmadi. Qayta kiring.");
          return;
        }
        if (cancelled) return;

        const { data: existing, error: selectErr } = await supabase
          .from("test_sessions")
          .select("id, status")
          .eq("student_id", user.id)
          .eq("test_id", id)
          .neq("status", "completed")
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (selectErr) {
          console.error("[TestRunner] SELECT sessions error:", selectErr);
          setSessionError("Testni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
          return;
        }

        if (existing) {
          setSessionId(existing.id);
          const { data: prev } = await supabase
            .from("answers")
            .select("question_id, answer_value")
            .eq("session_id", existing.id);
          if (cancelled) return;
          const map: Record<string, number> = {};
          (prev ?? []).forEach((a) => { map[a.question_id] = (a.answer_value as { v: number })?.v ?? 0; });
          setAnswers(map);
        } else {
          const { data: created, error: insertErr } = await supabase
            .from("test_sessions")
            .insert({ student_id: user.id, test_id: id, status: "in_progress" })
            .select("id")
            .single();

          if (cancelled) return;

          if (insertErr) {
            console.error("[TestRunner] INSERT session error:", insertErr);
            setSessionError("Testni boshlashda xatolik yuz berdi. Qayta urinib ko'ring.");
            return;
          }

          if (created) setSessionId(created.id);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[TestRunner] session init error:", e);
          setSessionError("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const total = questions?.length ?? 0;
  const q = questions?.[idx];
  const progress = total ? Math.round(((idx + 1) / total) * 100) : 0;
  const options = useMemo<OptionItem[]>(() => (q?.options as unknown as OptionItem[]) ?? [], [q]);

  async function selectAnswer(val: number) {
    if (!q || !sessionId) return;
    setAnswers((p) => ({ ...p, [q.id]: val }));
    await supabase.from("answers").upsert({ session_id: sessionId, question_id: q.id, answer_value: { v: val } }, { onConflict: "session_id,question_id" });
    if (idx < total - 1) setTimeout(() => setIdx((i) => i + 1), 150);
  }

  async function finishTest() {
    if (!sessionId) return;
    setFinishing(true);
    // Ball hisoblash serverda (Edge Function) bajariladi —
    // u natijani yozadi va profilni (radar, kasblar) yangilaydi.
    const { error } = await supabase.functions.invoke("complete-session", {
      body: { sessionId },
    });
    setFinishing(false);
    if (error) {
      toast.error("Natijani hisoblashda xatolik. Qayta urinib ko'ring.");
      return;
    }
    setDone(true);
    toast.success("Test muvaffaqiyatli tugatildi!");
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">Test tugadi!</h1>
          <p className="mt-2 text-muted-foreground">Javoblaringiz saqlandi. Natijalar tez orada profilingizda paydo bo'ladi.</p>
          <div className="mt-8 flex gap-3">
            <Button asChild variant="outline"><Link to="/my-tests">Boshqa test</Link></Button>
            <Button asChild><Link to="/my-profile">Profilimni ko'rish</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">Xatolik yuz berdi</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sessionError}</p>
          <button
            onClick={() => { setSessionError(null); window.location.reload(); }}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Qayta urinish
          </button>
        </main>
      </div>
    );
  }

  if (!test || !questions || !sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Bu test uchun savollar hali tayyorlanmoqda</h1>
          <p className="mt-2 text-muted-foreground">Boshqa testni sinab ko'ring.</p>
          <Button asChild className="mt-6"><Link to="/my-tests">Testlarga qaytish</Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{test.name_uz}</span>
            <span className="text-muted-foreground">{idx + 1} / {total}</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6 md:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Savol {idx + 1}</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">{q?.question_text_uz}</h2>

            {(q as { image_svg?: string } | undefined)?.image_svg && (
              <div
                className="mt-5 flex justify-center overflow-x-auto rounded-xl bg-muted/40 p-4"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg((q as { image_svg?: string }).image_svg!) }}
              />
            )}

            {options.some((o) => o.svg) ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {options.map((opt) => {
                  const selected = answers[q!.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectAnswer(opt.value)}
                      aria-label={`Variant ${opt.value}`}
                      className={`flex items-center justify-center rounded-xl border p-3 transition-all ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:border-primary/50 hover:bg-muted"}`}
                      dangerouslySetInnerHTML={{ __html: sanitizeSvg(opt.svg!) }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {options.map((opt) => {
                  const selected = answers[q!.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectAnswer(opt.value)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${selected ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-muted"}`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />Oldingi
          </Button>
          {idx < total - 1 ? (
            <Button onClick={() => setIdx((i) => i + 1)} disabled={!(q && q.id in answers)}>
              Keyingi<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finishTest} disabled={finishing || !(q && q.id in answers)}>
              {finishing ? "Saqlanmoqda..." : "Tugatish"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}