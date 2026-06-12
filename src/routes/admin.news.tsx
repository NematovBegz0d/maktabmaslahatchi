import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/media";
import { toast } from "sonner";
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/news")({
  head: () => ({ meta: [{ title: "Yangiliklar CMS — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminNews />
    </ProtectedRoute>
  ),
});

interface NewsRow {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

interface NewsForm {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string;
}

const EMPTY: NewsForm = { title: "", excerpt: "", body: "", cover_url: "" };

function AdminNews() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const {
    data: news,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-news-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewsForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-news-list"] });
    qc.invalidateQueries({ queryKey: ["public-news"] });
    qc.invalidateQueries({ queryKey: ["landing-news"] });
  }

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "news");
      setForm((f) => ({ ...f, cover_url: url }));
      toast.success("Rasm yuklandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Sarlavha va matn majburiy");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim(),
      cover_url: form.cover_url.trim() || null,
    };
    const { error } = form.id
      ? await supabase.from("news").update(payload).eq("id", form.id)
      : await supabase.from("news").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) {
      toast.error("Saqlanmadi: " + error.message);
      return;
    }
    toast.success(form.id ? "Yangilik yangilandi" : "Qoralama saqlandi — endi e'lon qiling");
    setOpen(false);
    invalidate();
  }

  async function togglePublish(n: NewsRow) {
    setBusyId(n.id);
    const publishing = n.status !== "published";
    const { error } = await supabase
      .from("news")
      .update({
        status: publishing ? "published" : "draft",
        published_at: publishing ? (n.published_at ?? new Date().toISOString()) : n.published_at,
      })
      .eq("id", n.id);
    setBusyId(null);
    if (error) {
      toast.error("Xatolik: " + error.message);
      return;
    }
    toast.success(publishing ? "E'lon qilindi — landing'da ko'rinadi" : "Qoralamaga qaytarildi");
    invalidate();
  }

  async function remove(n: NewsRow) {
    if (!confirm(`"${n.title}" yangilikni o'chirasizmi?`)) return;
    setBusyId(n.id);
    const { error } = await supabase.from("news").delete().eq("id", n.id);
    setBusyId(null);
    if (error) {
      toast.error("O'chirilmadi: " + error.message);
      return;
    }
    toast.success("O'chirildi");
    invalidate();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Newspaper className="h-7 w-7 text-primary" /> Yangiliklar
            </h1>
            <p className="mt-1 text-muted-foreground">
              Landing sahifasidagi yangiliklar — qoralama yozing, tayyor bo'lgach e'lon qiling.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Yangilik yozish
          </Button>
        </div>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (news ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hali yangilik yo'q — birinchisini yozing.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(news ?? []).map((n) => (
              <Card key={n.id} className="border-border/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {n.cover_url ? (
                      <img
                        src={n.cover_url}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Newspaper className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.status === "published" ? (
                          <span className="text-emerald-600">
                            ✓ E'lon qilingan
                            {n.published_at
                              ? ` — ${new Date(n.published_at).toLocaleDateString("uz-UZ")}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-amber-600">Qoralama</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === n.id}
                      onClick={() => togglePublish(n)}
                    >
                      {n.status === "published" ? (
                        <>
                          <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Yashirish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> E'lon qilish
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          id: n.id,
                          title: n.title,
                          excerpt: n.excerpt ?? "",
                          body: n.body,
                          cover_url: n.cover_url ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Tahrirlash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === n.id}
                      onClick={() => remove(n)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Yozish/tahrirlash dialogi ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{form.id ? "Yangilikni tahrirlash" : "Yangi yangilik"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="n-title">
                  Sarlavha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="n-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Robototexnika to'garagi yangi guruh ochdi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="n-excerpt">Qisqa matn (ro'yxatda ko'rinadi)</Label>
                <Input
                  id="n-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Bir-ikki jumlalik qisqacha..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="n-body">
                  To'liq matn <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="n-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={10}
                  placeholder="Yangilikning to'liq matni..."
                />
              </div>
              <div className="space-y-2">
                <Label>Muqova rasmi</Label>
                {form.cover_url && (
                  <img
                    src={form.cover_url}
                    alt="Muqova"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.cover_url}
                    onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                    placeholder="Rasm URL yoki yuklang →"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    Yuklash
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onCoverFile}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Bekor qilish
              </Button>
              <Button onClick={save} disabled={saving || uploading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
