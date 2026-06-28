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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { uploadMedia } from "@/lib/media";
import { toast } from "sonner";
import {
  SECTIONS,
  sectionByKey,
  DEMAND_META,
  type BilimnomaSectionKey,
  type BilimnomaCategory,
  type BilimnomaEntry,
  type EntryDetails,
  type Demand,
} from "@/lib/bilimnoma";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ImagePlus,
  FolderTree,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/admin/bilimnoma")({
  head: () => ({ meta: [{ title: "Bilimnoma — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminBilimnoma />
    </ProtectedRoute>
  ),
});

const NONE = "__none__"; // "Kategoriyasiz" sentinel (Radix Select bo'sh qiymatni qabul qilmaydi)

function AdminBilimnoma() {
  const qc = useQueryClient();
  const [section, setSection] = useState<BilimnomaSectionKey>("kasblar");
  const meta = sectionByKey(section)!;

  const cats = useQuery({
    queryKey: ["admin-bilimnoma-categories", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bilimnoma_categories")
        .select("*")
        .eq("section", section)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as BilimnomaCategory[];
    },
  });

  const entries = useQuery({
    queryKey: ["admin-bilimnoma-entries", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bilimnoma_entries")
        .select("*")
        .eq("section", section)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as BilimnomaEntry[];
    },
  });

  const [catDialog, setCatDialog] = useState<CategoryForm | null>(null);
  const [entryDialog, setEntryDialog] = useState<EntryForm | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-bilimnoma-categories", section] });
    qc.invalidateQueries({ queryKey: ["admin-bilimnoma-entries", section] });
    qc.invalidateQueries({ queryKey: ["bilimnoma-section", section] });
  }

  const categories = cats.data ?? [];
  const catTitleById = new Map(categories.map((c) => [c.id, c.title]));

  async function toggleCategoryPublish(c: BilimnomaCategory) {
    setBusyId(c.id);
    const { error } = await supabase
      .from("bilimnoma_categories")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    setBusyId(null);
    if (error) return toast.error("Xatolik: " + error.message);
    toast.success(c.is_published ? "Yashirildi" : "Ko'rinadigan qilindi");
    invalidate();
  }

  async function removeCategory(c: BilimnomaCategory) {
    if (
      !confirm(`"${c.title}" kategoriyasini o'chirasizmi? Ichidagi yozuvlar kategoriyasiz qoladi.`)
    )
      return;
    setBusyId(c.id);
    const { error } = await supabase.from("bilimnoma_categories").delete().eq("id", c.id);
    setBusyId(null);
    if (error) return toast.error("O'chirilmadi: " + error.message);
    toast.success("O'chirildi");
    invalidate();
  }

  async function toggleEntryPublish(e: BilimnomaEntry) {
    setBusyId(e.id);
    const { error } = await supabase
      .from("bilimnoma_entries")
      .update({ is_published: !e.is_published })
      .eq("id", e.id);
    setBusyId(null);
    if (error) return toast.error("Xatolik: " + error.message);
    toast.success(e.is_published ? "Yashirildi" : "E'lon qilindi");
    invalidate();
  }

  async function removeEntry(e: BilimnomaEntry) {
    if (!confirm(`"${e.title}" yozuvini o'chirasizmi?`)) return;
    setBusyId(e.id);
    const { error } = await supabase.from("bilimnoma_entries").delete().eq("id", e.id);
    setBusyId(null);
    if (error) return toast.error("O'chirilmadi: " + error.message);
    toast.success("O'chirildi");
    invalidate();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <BookOpen className="h-7 w-7 text-primary" /> Bilimnoma
          </h1>
          <p className="mt-1 text-muted-foreground">
            O'quvchilar uchun bilim qo'llanmasi — bo'lim tanlang va kontentni boshqaring.
          </p>
        </div>

        <AdminTabs />

        {/* Bo'lim tanlovi */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Label htmlFor="section-select" className="text-sm font-semibold">
            Bo'lim:
          </Label>
          <Select value={section} onValueChange={(v) => setSection(v as BilimnomaSectionKey)}>
            <SelectTrigger id="section-select" className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Kategoriyalar ── */}
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FolderTree className="h-5 w-5 text-primary" /> Kategoriyalar
              {!meta.usesCategories && (
                <span className="text-xs font-normal text-muted-foreground">
                  (bu bo'lim uchun ixtiyoriy)
                </span>
              )}
            </h2>
            <Button size="sm" onClick={() => setCatDialog({ ...EMPTY_CATEGORY })}>
              <Plus className="mr-1.5 h-4 w-4" /> Kategoriya
            </Button>
          </div>

          {cats.isError ? (
            <QueryError onRetry={() => cats.refetch()} />
          ) : cats.isLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Hali kategoriya yo'q.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {categories.map((c) => (
                <Card key={c.id} className={c.is_published ? "" : "opacity-60"}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {c.icon} {c.title}
                        {!c.is_published && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Yashirin
                          </span>
                        )}
                      </p>
                      {c.description && (
                        <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => toggleCategoryPublish(c)}
                      >
                        {c.is_published ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCatDialog({
                            id: c.id,
                            title: c.title,
                            description: c.description ?? "",
                            icon: c.icon,
                            sort_order: c.sort_order.toString(),
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => removeCategory(c)}
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
        </section>

        {/* ── Yozuvlar ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="h-5 w-5 text-primary" /> Yozuvlar
            </h2>
            <Button size="sm" onClick={() => setEntryDialog({ ...EMPTY_ENTRY })}>
              <Plus className="mr-1.5 h-4 w-4" /> Yozuv
            </Button>
          </div>

          {entries.isError ? (
            <QueryError onRetry={() => entries.refetch()} />
          ) : entries.isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (entries.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Hali yozuv qo'shilmagan — birinchisini qo'shing.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {(entries.data ?? []).map((e) => (
                <Card key={e.id} className={e.is_published ? "" : "opacity-60"}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {e.image_url ? (
                        <img
                          src={e.image_url}
                          alt=""
                          className="h-14 w-20 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {e.title}
                          {!e.is_published && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Yashirin
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {(e.category_id && catTitleById.get(e.category_id)) || "Kategoriyasiz"}
                          {e.summary ? ` · ${e.summary}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === e.id}
                        onClick={() => toggleEntryPublish(e)}
                      >
                        {e.is_published ? (
                          <>
                            <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Yashirish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> E'lon
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEntryDialog(rowToEntryForm(e))}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === e.id}
                        onClick={() => removeEntry(e)}
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
        </section>

        {catDialog && (
          <CategoryDialog
            key={catDialog.id ?? "new-cat"}
            section={section}
            initial={catDialog}
            onClose={() => setCatDialog(null)}
            onSaved={invalidate}
          />
        )}
        {entryDialog && (
          <EntryDialog
            key={entryDialog.id ?? "new-entry"}
            section={section}
            categories={categories}
            initial={entryDialog}
            onClose={() => setEntryDialog(null)}
            onSaved={invalidate}
          />
        )}
      </main>
    </div>
  );
}

/* ─── Kategoriya dialogi ─────────────────────────────────────────────────── */
interface CategoryForm {
  id?: string;
  title: string;
  description: string;
  icon: string;
  sort_order: string;
}
const EMPTY_CATEGORY: CategoryForm = { title: "", description: "", icon: "📂", sort_order: "0" };

function CategoryDialog({
  section,
  initial,
  onClose,
  onSaved,
}: {
  section: BilimnomaSectionKey;
  initial: CategoryForm;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CategoryForm>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title.trim()) return toast.error("Kategoriya nomini kiriting");
    setSaving(true);
    const payload = {
      section,
      title: form.title.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || "📂",
      sort_order: parseInt(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("bilimnoma_categories").update(payload).eq("id", form.id)
      : await supabase.from("bilimnoma_categories").insert(payload);
    setSaving(false);
    if (error) return toast.error("Saqlanmadi: " + error.message);
    toast.success(form.id ? "Kategoriya yangilandi" : "Kategoriya qo'shildi");
    onClose();
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_90px]">
            <div className="space-y-2">
              <Label htmlFor="cat-title">
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Yo'qolayotgan kasblar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Belgi</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="📂"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Tavsif</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-sort">Tartib</Label>
            <Input
              id="cat-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="w-28"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Yozuv dialogi ──────────────────────────────────────────────────────── */
interface EntryForm {
  id?: string;
  category_id: string; // kategoriya id yoki NONE
  title: string;
  summary: string;
  icon: string;
  demand: string; // 'growing' | 'stable' | 'declining' | NONE
  what: string;
  skills: string;
  subjects: string;
  study: string;
  fun_fact: string;
  extra_label: string;
  extra: string;
  // chuqur kontent (UI'da matn — har qatordan bittadan; saqlashda massiv)
  video_url: string;
  pros: string;
  cons: string;
  day_in_life: string;
  resources: string; // "Sarlavha | https://url" — har qatordan bitta
  related: string;
  quiz: string;
  // joy (tarixiy obida/muzey) maydonlari
  history: string;
  significance: string;
  location: string;
  map_url: string;
  visit: string;
  counselor_tip: string;
  facts: string; // har qatordan bitta
  gallery: string[];
  body: string;
  image_url: string;
  sort_order: string;
}
const EMPTY_ENTRY: EntryForm = {
  category_id: NONE,
  title: "",
  summary: "",
  icon: "💼",
  demand: NONE,
  what: "",
  skills: "",
  subjects: "",
  study: "",
  fun_fact: "",
  extra_label: "",
  extra: "",
  video_url: "",
  pros: "",
  cons: "",
  day_in_life: "",
  resources: "",
  related: "",
  quiz: "",
  history: "",
  significance: "",
  location: "",
  map_url: "",
  visit: "",
  counselor_tip: "",
  facts: "",
  gallery: [],
  body: "",
  image_url: "",
  sort_order: "0",
};

// matn ↔ massiv yordamchilari
const linesToArr = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const arrToLines = (a?: string[]) => (a ?? []).join("\n");
const parseResources = (s: string) =>
  linesToArr(s)
    .map((line) => {
      const i = line.indexOf("|");
      return i === -1
        ? { label: line, url: line }
        : { label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
    })
    .filter((r) => r.url);
const resourcesToText = (r?: { label: string; url: string }[]) =>
  (r ?? []).map((x) => `${x.label} | ${x.url}`).join("\n");

// DB qatordan formaga (details jsonb'ni alohida maydonlarga yoyamiz)
function rowToEntryForm(e: BilimnomaEntry): EntryForm {
  const d = (e.details ?? {}) as EntryDetails;
  return {
    id: e.id,
    category_id: e.category_id ?? NONE,
    title: e.title,
    summary: e.summary ?? "",
    icon: e.icon || "💼",
    demand: e.demand ?? NONE,
    what: d.what ?? "",
    skills: d.skills ?? "",
    subjects: d.subjects ?? "",
    study: d.study ?? "",
    fun_fact: d.fun_fact ?? "",
    extra_label: d.extra_label ?? "",
    extra: d.extra ?? "",
    video_url: d.video_url ?? "",
    pros: arrToLines(d.pros),
    cons: arrToLines(d.cons),
    day_in_life: arrToLines(d.day_in_life),
    resources: resourcesToText(d.resources),
    related: arrToLines(d.related),
    quiz: arrToLines(d.quiz),
    history: d.history ?? "",
    significance: d.significance ?? "",
    location: d.location ?? "",
    map_url: d.map_url ?? "",
    visit: d.visit ?? "",
    counselor_tip: d.counselor_tip ?? "",
    facts: arrToLines(d.facts),
    gallery: d.gallery ?? [],
    body: e.body ?? "",
    image_url: e.image_url ?? "",
    sort_order: e.sort_order.toString(),
  };
}

function EntryDialog({
  section,
  categories,
  initial,
  onClose,
  onSaved,
}: {
  section: BilimnomaSectionKey;
  categories: BilimnomaCategory[];
  initial: EntryForm;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EntryForm>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Bo'lim turi — joy (tarixiy obida) bo'lsa boshqa maydonlar ko'rsatamiz
  const isPlace = sectionByKey(section)?.kind === "place";

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "bilimnoma");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Rasm yuklandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadMedia(file, "bilimnoma");
        setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
      }
      toast.success("Rasm(lar) yuklandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!form.title.trim()) return toast.error("Sarlavhani kiriting");
    setSaving(true);
    // Plain ob'ekt — saqlashda Json (jsonb) ga kast qilinadi
    const details: Record<string, unknown> = {};
    if (form.what.trim()) details.what = form.what.trim();
    if (form.skills.trim()) details.skills = form.skills.trim();
    if (form.subjects.trim()) details.subjects = form.subjects.trim();
    if (form.study.trim()) details.study = form.study.trim();
    if (form.fun_fact.trim()) details.fun_fact = form.fun_fact.trim();
    if (form.extra.trim()) {
      details.extra = form.extra.trim();
      if (form.extra_label.trim()) details.extra_label = form.extra_label.trim();
    }
    if (form.video_url.trim()) details.video_url = form.video_url.trim();
    const pros = linesToArr(form.pros);
    const cons = linesToArr(form.cons);
    const day = linesToArr(form.day_in_life);
    const quiz = linesToArr(form.quiz);
    const related = linesToArr(form.related);
    const resources = parseResources(form.resources);
    if (pros.length) details.pros = pros;
    if (cons.length) details.cons = cons;
    if (day.length) details.day_in_life = day;
    if (quiz.length) details.quiz = quiz;
    if (related.length) details.related = related;
    if (resources.length) details.resources = resources;
    if (form.gallery.length) details.gallery = form.gallery;
    // joy (tarixiy obida) maydonlari
    if (form.history.trim()) details.history = form.history.trim();
    if (form.significance.trim()) details.significance = form.significance.trim();
    if (form.location.trim()) details.location = form.location.trim();
    if (form.map_url.trim()) details.map_url = form.map_url.trim();
    if (form.visit.trim()) details.visit = form.visit.trim();
    if (form.counselor_tip.trim()) details.counselor_tip = form.counselor_tip.trim();
    const facts = linesToArr(form.facts);
    if (facts.length) details.facts = facts;
    const payload = {
      section,
      category_id: form.category_id === NONE ? null : form.category_id,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      icon: form.icon.trim() || "💼",
      demand: form.demand === NONE ? null : form.demand,
      details: details as unknown as Json,
      body: form.body.trim() || null,
      image_url: form.image_url.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("bilimnoma_entries").update(payload).eq("id", form.id)
      : await supabase.from("bilimnoma_entries").insert(payload);
    setSaving(false);
    if (error) return toast.error("Saqlanmadi: " + error.message);
    toast.success(form.id ? "Yozuv yangilandi" : "Yozuv qo'shildi");
    onClose();
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Yozuvni tahrirlash" : "Yangi yozuv"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kategoriya</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategoriyasiz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kategoriyasiz</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-[90px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="e-icon">Belgi</Label>
              <Input
                id="e-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="💼"
              />
            </div>
            {!isPlace && (
              <div className="space-y-2">
                <Label>Talab darajasi</Label>
                <Select value={form.demand} onValueChange={(v) => setForm({ ...form, demand: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ko'rsatilmasin</SelectItem>
                    {(Object.keys(DEMAND_META) as Demand[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {DEMAND_META[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-title">
              Sarlavha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="e-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Masalan: Data Scientist"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-summary">Qisqa izoh (ro'yxatda ko'rinadi)</Label>
            <Textarea
              id="e-summary"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={2}
              placeholder="Bir-ikki jumlali qisqacha tavsif..."
            />
          </div>

          {/* Career: kasb tafsilotlari — joy bo'limida ko'rsatilmaydi */}
          {!isPlace && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tafsilotlar (ixtiyoriy)
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="e-what">Nima bilan shug'ullanadi?</Label>
                  <Textarea
                    id="e-what"
                    value={form.what}
                    onChange={(e) => setForm({ ...form, what: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-skills">Kerakli ko'nikmalar</Label>
                  <Textarea
                    id="e-skills"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-subjects">Maktabda muhim fanlar</Label>
                  <Input
                    id="e-subjects"
                    value={form.subjects}
                    onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                    placeholder="Matematika, Fizika, Informatika..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-study">Qayerda o'qiladi?</Label>
                  <Input
                    id="e-study"
                    value={form.study}
                    onChange={(e) => setForm({ ...form, study: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-fun">Qiziqarli fakt</Label>
                  <Textarea
                    id="e-fun"
                    value={form.fun_fact}
                    onChange={(e) => setForm({ ...form, fun_fact: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
                  <div className="space-y-2">
                    <Label htmlFor="e-extra-label">Maxsus blok sarlavhasi</Label>
                    <Input
                      id="e-extra-label"
                      value={form.extra_label}
                      onChange={(e) => setForm({ ...form, extra_label: e.target.value })}
                      placeholder="Nega yo'qolyapti?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-extra">Maxsus blok matni</Label>
                    <Textarea
                      id="e-extra"
                      value={form.extra}
                      onChange={(e) => setForm({ ...form, extra: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Place: tarixiy obida / muzey maydonlari */}
          {isPlace && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Joy ma'lumotlari (ixtiyoriy)
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="e-history">Tarixi</Label>
                  <Textarea
                    id="e-history"
                    value={form.history}
                    onChange={(e) => setForm({ ...form, history: e.target.value })}
                    rows={3}
                    placeholder="Qachon, kim tomonidan qurilgan..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-significance">Ahamiyati / nimasi bilan mashhur</Label>
                  <Textarea
                    id="e-significance"
                    value={form.significance}
                    onChange={(e) => setForm({ ...form, significance: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-location">Manzil</Label>
                  <Input
                    id="e-location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Buxoro shahri, ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-map">Xarita havolasi (Google Maps)</Label>
                  <Input
                    id="e-map"
                    value={form.map_url}
                    onChange={(e) => setForm({ ...form, map_url: e.target.value })}
                    placeholder="https://maps.app.goo.gl/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-visit">Tashrif (ish vaqti, chipta, qanday borish)</Label>
                  <Textarea
                    id="e-visit"
                    value={form.visit}
                    onChange={(e) => setForm({ ...form, visit: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-facts">Qiziqarli faktlar (har qatordan bitta)</Label>
                  <Textarea
                    id="e-facts"
                    value={form.facts}
                    onChange={(e) => setForm({ ...form, facts: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-tip">Maslahatchi uchun (ekskursiya maslahati)</Label>
                  <Textarea
                    id="e-tip"
                    value={form.counselor_tip}
                    onChange={(e) => setForm({ ...form, counselor_tip: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Career: chuqur kontent (afzallik/kamchilik, kun, test) */}
          {!isPlace && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chuqur kontent (ixtiyoriy · har qatordan bittadan)
              </p>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="e-pros">Afzalliklari</Label>
                    <Textarea
                      id="e-pros"
                      value={form.pros}
                      onChange={(e) => setForm({ ...form, pros: e.target.value })}
                      rows={4}
                      placeholder={"Yuqori maosh\nQiziqarli loyihalar"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-cons">Kamchiliklari</Label>
                    <Textarea
                      id="e-cons"
                      value={form.cons}
                      onChange={(e) => setForm({ ...form, cons: e.target.value })}
                      rows={4}
                      placeholder={"Doimiy o'rganish"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-day">Bir kunlik hayot (bosqichlar)</Label>
                  <Textarea
                    id="e-day"
                    value={form.day_in_life}
                    onChange={(e) => setForm({ ...form, day_in_life: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-quiz">"Senga mosmi?" savollari</Label>
                  <Textarea
                    id="e-quiz"
                    value={form.quiz}
                    onChange={(e) => setForm({ ...form, quiz: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shared: resurslar, bog'liq, video */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resurslar va havolalar (ixtiyoriy)
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="e-resources">
                  {isPlace ? "Manbalar" : "Foydali resurslar"} (Sarlavha | https://url)
                </Label>
                <Textarea
                  id="e-resources"
                  value={form.resources}
                  onChange={(e) => setForm({ ...form, resources: e.target.value })}
                  rows={3}
                  placeholder={"Wikipedia | https://uz.wikipedia.org"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-related">
                  {isPlace ? "Bog'liq joylar" : "Bog'liq kasblar"} (aniq sarlavhalar)
                </Label>
                <Textarea
                  id="e-related"
                  value={form.related}
                  onChange={(e) => setForm({ ...form, related: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-video">Video havolasi (YouTube)</Label>
                <Input
                  id="e-video"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-body">To'liq matn (ixtiyoriy)</Label>
            <Textarea
              id="e-body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder="To'liq ma'lumot. Yangi qatorlar saqlanadi."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-sort">Tartib</Label>
            <Input
              id="e-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="w-28"
            />
          </div>
          <div className="space-y-2">
            <Label>Cover rasm (ixtiyoriy)</Label>
            {form.image_url && (
              <img src={form.image_url} alt="" className="h-36 w-full rounded-lg object-cover" />
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

          {/* Galereya — bir nechta rasm */}
          <div className="space-y-2">
            <Label>Galereya (qo'shimcha rasmlar)</Label>
            {form.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.gallery.map((url) => (
                  <div key={url} className="group relative">
                    <img src={url} alt="" className="h-20 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Rasmni o'chirish"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Rasm(lar) qo'shish
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onGalleryFiles}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
