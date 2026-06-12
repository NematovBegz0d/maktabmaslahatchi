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
import { uploadMedia } from "@/lib/media";
import { toast } from "sonner";
import { Landmark, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/center-clubs")({
  head: () => ({ meta: [{ title: "Markaz to'garaklari — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminCenterClubs />
    </ProtectedRoute>
  ),
});

interface CenterClubRow {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  schedule: string | null;
  age_range: string | null;
  teacher: string | null;
  is_published: boolean;
  sort_order: number;
}

interface ClubForm {
  id?: string;
  name: string;
  description: string;
  icon: string;
  image_url: string;
  schedule: string;
  age_range: string;
  teacher: string;
  sort_order: string;
}

const EMPTY: ClubForm = {
  name: "",
  description: "",
  icon: "🎯",
  image_url: "",
  schedule: "",
  age_range: "",
  teacher: "",
  sort_order: "0",
};

function AdminCenterClubs() {
  const qc = useQueryClient();

  const {
    data: clubs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-center-clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("center_clubs")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as CenterClubRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClubForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-center-clubs"] });
    qc.invalidateQueries({ queryKey: ["landing-center-clubs"] });
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "clubs");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Rasm yuklandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("To'garak nomini kiriting");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || "🎯",
      image_url: form.image_url.trim() || null,
      schedule: form.schedule.trim() || null,
      age_range: form.age_range.trim() || null,
      teacher: form.teacher.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("center_clubs").update(payload).eq("id", form.id)
      : await supabase.from("center_clubs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Saqlanmadi: " + error.message);
      return;
    }
    toast.success(form.id ? "To'garak yangilandi" : "To'garak qo'shildi");
    setOpen(false);
    invalidate();
  }

  async function togglePublish(c: CenterClubRow) {
    setBusyId(c.id);
    const { error } = await supabase
      .from("center_clubs")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    setBusyId(null);
    if (error) {
      toast.error("Xatolik: " + error.message);
      return;
    }
    toast.success(c.is_published ? "Landing'dan yashirildi" : "Landing'da ko'rinadi");
    invalidate();
  }

  async function remove(c: CenterClubRow) {
    if (!confirm(`"${c.name}" to'garagini o'chirasizmi?`)) return;
    setBusyId(c.id);
    const { error } = await supabase.from("center_clubs").delete().eq("id", c.id);
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
              <Landmark className="h-7 w-7 text-primary" /> Markaz to'garaklari
            </h1>
            <p className="mt-1 text-muted-foreground">
              "Kelajak" binosidagi to'garaklar — landing sahifasida ko'rsatiladi.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> To'garak qo'shish
          </Button>
        </div>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (clubs ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hali to'garak qo'shilmagan — birinchisini qo'shing.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(clubs ?? []).map((c) => (
              <Card key={c.id} className={`border-border/60 ${c.is_published ? "" : "opacity-60"}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                        {c.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {c.icon} {c.name}
                        {!c.is_published && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Yashirin
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[c.schedule, c.age_range, c.teacher].filter(Boolean).join(" · ") ||
                          "Tafsilotlar kiritilmagan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => togglePublish(c)}
                    >
                      {c.is_published ? (
                        <>
                          <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Yashirish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ko'rsatish
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          id: c.id,
                          name: c.name,
                          description: c.description ?? "",
                          icon: c.icon,
                          image_url: c.image_url ?? "",
                          schedule: c.schedule ?? "",
                          age_range: c.age_range ?? "",
                          teacher: c.teacher ?? "",
                          sort_order: c.sort_order.toString(),
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Tahrirlash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => remove(c)}
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

        {/* ── Qo'shish/tahrirlash dialogi ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "To'garakni tahrirlash" : "Yangi to'garak"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_90px]">
                <div className="space-y-2">
                  <Label htmlFor="c-name">
                    Nomi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Robototexnika"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-icon">Belgi</Label>
                  <Input
                    id="c-icon"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="🤖"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-desc">Tavsif</Label>
                <Textarea
                  id="c-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="To'garakda nimalar o'rganiladi..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-schedule">Jadval</Label>
                  <Input
                    id="c-schedule"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    placeholder="Dush/Chor/Juma 15:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-age">Yosh chegarasi</Label>
                  <Input
                    id="c-age"
                    value={form.age_range}
                    onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                    placeholder="7-14 yosh"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                <div className="space-y-2">
                  <Label htmlFor="c-teacher">Ustoz</Label>
                  <Input
                    id="c-teacher"
                    value={form.teacher}
                    onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                    placeholder="Aliyev Bobur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-sort">Tartib</Label>
                  <Input
                    id="c-sort"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rasm</Label>
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="To'garak"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
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
                      onChange={onImageFile}
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
