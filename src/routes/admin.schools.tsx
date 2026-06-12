import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AdminTabs } from "@/components/admin-tabs";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { School, Plus, Pencil, Users, Loader2 } from "lucide-react";
import { useSchoolStats, schoolStatus, type SchoolStat } from "@/lib/school-stats";

export const Route = createFileRoute("/admin/schools")({
  head: () => ({ meta: [{ title: "Maktablar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminSchools />
    </ProtectedRoute>
  ),
});

interface SchoolForm {
  id?: string;
  name: string;
  region: string;
  district: string;
  expected_students: string;
}

const EMPTY_FORM: SchoolForm = { name: "", region: "", district: "", expected_students: "" };

function AdminSchools() {
  const qc = useQueryClient();
  const { data: stats, isLoading, isError, refetch } = useSchoolStats();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SchoolForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(s: SchoolStat) {
    setForm({
      id: s.id,
      name: s.name ?? "",
      region: s.region ?? "",
      district: s.district ?? "",
      expected_students: s.expected_students?.toString() ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Maktab nomini kiriting");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      region: form.region.trim() || null,
      district: form.district.trim() || null,
      expected_students: form.expected_students ? parseInt(form.expected_students) : null,
    };
    const { error } = form.id
      ? await supabase.from("schools").update(payload).eq("id", form.id)
      : await supabase.from("schools").insert(payload);
    setSaving(false);
    if (error) {
      console.error("[admin-schools]", error);
      toast.error("Saqlashda xatolik: " + error.message);
      return;
    }
    toast.success(form.id ? "Maktab yangilandi" : "Maktab qo'shildi");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["school-stats"] });
    qc.invalidateQueries({ queryKey: ["schools"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <School className="h-7 w-7 text-primary" /> Maktablar
            </h1>
            <p className="mt-1 text-muted-foreground">
              Maktab qo'shing va har biriga maslahatchi tayinlang.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Maktab qo'shish
          </Button>
        </div>

        <AdminTabs />

        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (stats ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hali maktab qo'shilmagan — yuqoridagi "Maktab qo'shish" tugmasidan boshlang.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(stats ?? []).map((s) => {
              const st = schoolStatus(s);
              return (
                <Card key={s.id} className="border-border/60">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-48">
                      <p className="font-semibold text-foreground">
                        {st.emoji} {s.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[s.district, s.region].filter(Boolean).join(", ") || "Hudud kiritilmagan"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {s.student_count ?? 0}
                      {s.expected_students ? ` / ${s.expected_students}` : ""} o'quvchi
                    </div>
                    <div className="text-sm">
                      {s.counselor_name ? (
                        <span className="text-foreground">{s.counselor_name}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          Maslahatchi tayinlanmagan
                        </span>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Tahrirlash
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Qo'shish/tahrirlash dialogi ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{form.id ? "Maktabni tahrirlash" : "Yangi maktab"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">
                  Nomi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="12-umumiy o'rta ta'lim maktabi"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s-region">Viloyat</Label>
                  <Input
                    id="s-region"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="Namangan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-district">Tuman/shahar</Label>
                  <Input
                    id="s-district"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Chust tumani"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-expected">Taxminiy o'quvchilar soni</Label>
                <Input
                  id="s-expected"
                  type="number"
                  min={1}
                  value={form.expected_students}
                  onChange={(e) => setForm({ ...form, expected_students: e.target.value })}
                  placeholder="1200"
                />
                <p className="text-xs text-muted-foreground">
                  Qamrov foizini hisoblash uchun ishlatiladi.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Bekor qilish
              </Button>
              <Button onClick={save} disabled={saving}>
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
