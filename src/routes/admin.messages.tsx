import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logClientActivity } from "@/lib/tasks";
import { toast } from "sonner";
import { Mail, Send, Loader2, Megaphone, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Xabarlar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminMessages />
    </ProtectedRoute>
  ),
});

interface MessageRow {
  id: string;
  recipient_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
}

function AdminMessages() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: counselors = [] } = useQuery({
    queryKey: ["counselor-directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("counselor_directory")
        .select("id, full_name, school_name")
        .order("full_name");
      return (data ?? []) as { id: string; full_name: string | null; school_name: string | null }[];
    },
  });

  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, recipient_id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  // O'qilganlik: message_id → o'qiganlar soni
  const { data: reads } = useQuery({
    queryKey: ["admin-message-reads"],
    enabled: (messages ?? []).length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("message_reads").select("message_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        counts[r.message_id] = (counts[r.message_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const [recipient, setRecipient] = useState(""); // "" = barcha
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) {
      toast.error("Xabar matnini kiriting");
      return;
    }
    setSending(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .maybeSingle();
    const { error } = await supabase.from("messages").insert({
      sender_id: user?.id,
      sender_name: profile?.full_name ?? "Super admin",
      recipient_id: recipient || null,
      title: title.trim() || null,
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Yuborilmadi: " + error.message);
      return;
    }
    await logClientActivity(
      user?.id,
      "message_sent",
      recipient
        ? (counselors.find((c) => c.id === recipient)?.full_name ?? "")
        : "Barcha maslahatchilarga e'lon",
    );
    toast.success(recipient ? "Xabar yuborildi" : "E'lon barcha maslahatchilarga yuborildi");
    setTitle("");
    setBody("");
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  const counselorName = (id: string | null) =>
    id ? (counselors.find((c) => c.id === id)?.full_name ?? "Noma'lum") : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <Mail className="h-7 w-7 text-primary" /> Xabarlar
        </h1>
        <p className="mb-6 text-muted-foreground">
          Maslahatchilarga shaxsiy xabar yoki umumiy e'lon yuboring.
        </p>

        <AdminTabs />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Yuborish formasi ── */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Yangi xabar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="m-to">Kimga</Label>
                <select
                  id="m-to"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">📢 Barcha maslahatchilarga (e'lon)</option>
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — {c.school_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-title">Sarlavha</Label>
                <Input
                  id="m-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Choraklik hisobot haqida"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-body">
                  Matn <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="m-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Hurmatli hamkasblar..."
                />
              </div>
              <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Yuborish
              </Button>
            </CardContent>
          </Card>

          {/* ── Yuborilganlar ── */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Yuborilganlar
            </h2>
            {isError ? (
              <QueryError onRetry={() => refetch()} />
            ) : isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : (messages ?? []).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Hali xabar yuborilmagan.
                </CardContent>
              </Card>
            ) : (
              (messages ?? []).map((m) => {
                const readCount = reads?.[m.id] ?? 0;
                const isBroadcast = !m.recipient_id;
                return (
                  <Card key={m.id} className="border-border/60">
                    <CardContent className="px-4 py-3">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {isBroadcast ? (
                            <>
                              <Megaphone className="h-3.5 w-3.5 text-primary" /> E'lon
                            </>
                          ) : (
                            <>→ {counselorName(m.recipient_id)}</>
                          )}
                          {m.title ? ` · ${m.title}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCheck className="h-3.5 w-3.5" />
                        {isBroadcast
                          ? `${readCount}/${counselors.length} maslahatchi o'qidi`
                          : readCount > 0
                            ? "O'qildi"
                            : "O'qilmagan"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
