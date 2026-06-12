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
import {
  Users,
  Plus,
  KeyRound,
  ArrowRightLeft,
  Ban,
  CircleCheck,
  Loader2,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/admin/counselors")({
  head: () => ({ meta: [{ title: "Maslahatchilar — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminCounselors />
    </ProtectedRoute>
  ),
});

interface CounselorRow {
  id: string;
  full_name: string | null;
  school_id: string | null;
  school_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  last_activity: string | null;
}

interface Credentials {
  full_name: string;
  login: string;
  password: string;
  school_name?: string;
}

function useSchoolOptions() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
}

function AdminCounselors() {
  const qc = useQueryClient();
  const { data: schools = [] } = useSchoolOptions();

  const {
    data: counselors,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["counselor-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_directory")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as CounselorRow[];
    },
  });

  // ── Yaratish dialogi ──
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cLogin, setCLogin] = useState("");
  const [cSchool, setCSchool] = useState("");
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // ── Ko'chirish dialogi ──
  const [reassign, setReassign] = useState<CounselorRow | null>(null);
  const [reassignSchool, setReassignSchool] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["counselor-directory"] });
    qc.invalidateQueries({ queryKey: ["school-stats"] });
  }

  async function createCounselor() {
    if (!cName.trim() || !cSchool || !cLogin.trim()) {
      toast.error("Ism, login va maktab — uchchalasi ham majburiy");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-counselor", {
      body: {
        full_name: cName.trim(),
        school_id: cSchool,
        ...(cLogin.includes("@") ? { email: cLogin.trim() } : { login: cLogin.trim() }),
      },
    });
    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Xatolik");
      return;
    }
    setCredentials(data.counselor as Credentials);
    setCName("");
    setCLogin("");
    setCSchool("");
    invalidate();
    toast.success("Maslahatchi yaratildi");
  }

  async function manage(
    counselor: CounselorRow,
    action: "reset_password" | "reassign" | "set_active",
    extra?: Record<string, unknown>,
  ) {
    setBusyId(counselor.id);
    const { data, error } = await supabase.functions.invoke("manage-counselor", {
      body: { counselor_id: counselor.id, action, ...extra },
    });
    setBusyId(null);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Xatolik");
      return null;
    }
    invalidate();
    return data as { ok: boolean; password?: string };
  }

  async function resetPassword(c: CounselorRow) {
    const res = await manage(c, "reset_password");
    if (res?.password) {
      setCredentials({
        full_name: c.full_name ?? "",
        login: "(avvalgi login)",
        password: res.password,
        school_name: c.school_name ?? undefined,
      });
      toast.success("Yangi parol yaratildi");
    }
  }

  async function toggleActive(c: CounselorRow) {
    const res = await manage(c, "set_active", { active: !(c.is_active ?? true) });
    if (res?.ok) toast.success(c.is_active ? "Maslahatchi bloklandi" : "Blokdan chiqarildi");
  }

  async function doReassign() {
    if (!reassign || !reassignSchool) return;
    const res = await manage(reassign, "reassign", { school_id: reassignSchool });
    if (res?.ok) {
      toast.success("Maslahatchi boshqa maktabga ko'chirildi");
      setReassign(null);
      setReassignSchool("");
    }
  }

  function copyCreds(c: Credentials) {
    navigator.clipboard
      .writeText(`${c.full_name}\nLogin: ${c.login}\nParol: ${c.password}`)
      .then(() => toast.success("Nusxalandi"))
      .catch(() => toast.error("Nusxalab bo'lmadi"));
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Users className="h-7 w-7 text-primary" /> Maslahatchilar
            </h1>
            <p className="mt-1 text-muted-foreground">
              Har maktabga maslahatchi tayinlang va ularning faolligini kuzating.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Maslahatchi qo'shish
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
        ) : (counselors ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Hali maslahatchi yo'q — "Maslahatchi qo'shish" tugmasidan birinchisini yarating.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(counselors ?? []).map((c) => (
              <Card key={c.id} className={`border-border/60 ${c.is_active ? "" : "opacity-60"}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-48">
                    <p className="font-semibold text-foreground">
                      {c.full_name ?? "Noma'lum"}
                      {!c.is_active && (
                        <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                          Bloklangan
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.school_name ?? "Maktab biriktirilmagan"}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Oxirgi faollik: {fmtDate(c.last_activity)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => resetPassword(c)}
                      title="Yangi parol berish"
                    >
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Parol
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => {
                        setReassign(c);
                        setReassignSchool(c.school_id ?? "");
                      }}
                      title="Boshqa maktabga ko'chirish"
                    >
                      <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Ko'chirish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => toggleActive(c)}
                      className={
                        c.is_active
                          ? "text-destructive hover:text-destructive"
                          : "text-emerald-600 hover:text-emerald-700"
                      }
                    >
                      {c.is_active ? (
                        <>
                          <Ban className="mr-1.5 h-3.5 w-3.5" /> Bloklash
                        </>
                      ) : (
                        <>
                          <CircleCheck className="mr-1.5 h-3.5 w-3.5" /> Ochish
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Yaratish dialogi ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yangi maslahatchi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">
                  To'liq ism <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-name"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Ahmedova Nilufar Karimovna"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-login">
                  Login yoki email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-login"
                  value={cLogin}
                  onChange={(e) => setCLogin(e.target.value)}
                  placeholder="n.ahmedova yoki email@misol.uz"
                />
                <p className="text-xs text-muted-foreground">
                  Email bo'lmasa oddiy login kiriting (lotin harf/raqam) — tizimga shu bilan kiradi.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-school">
                  Maktab <span className="text-destructive">*</span>
                </Label>
                <select
                  id="c-school"
                  value={cSchool}
                  onChange={(e) => setCSchool(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Tanlang...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Bekor qilish
              </Button>
              <Button onClick={createCounselor} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yaratish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Login/parol ko'rsatish dialogi (bir martalik) ── */}
        <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kirish ma'lumotlari</DialogTitle>
            </DialogHeader>
            {credentials && (
              <div className="space-y-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Parol faqat shu yerda BIR MARTA ko'rsatiladi — nusxalab maslahatchiga bering.
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
                  <p className="mb-1 font-sans font-semibold text-foreground">
                    {credentials.full_name}
                  </p>
                  {credentials.school_name && (
                    <p className="mb-2 font-sans text-xs text-muted-foreground">
                      {credentials.school_name}
                    </p>
                  )}
                  <p>
                    Login: <span className="font-semibold">{credentials.login}</span>
                  </p>
                  <p>
                    Parol: <span className="font-semibold">{credentials.password}</span>
                  </p>
                </div>
                <Button className="w-full" variant="outline" onClick={() => copyCreds(credentials)}>
                  <Copy className="mr-1.5 h-4 w-4" /> Nusxalash
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Ko'chirish dialogi ── */}
        <Dialog open={!!reassign} onOpenChange={(o) => !o && setReassign(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Boshqa maktabga ko'chirish</DialogTitle>
            </DialogHeader>
            {reassign && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{reassign.full_name}</span> — hozir:{" "}
                  {reassign.school_name ?? "biriktirilmagan"}
                </p>
                <select
                  value={reassignSchool}
                  onChange={(e) => setReassignSchool(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Maktabni tanlang...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Diqqat: maslahatchi eski maktab o'quvchilarini boshqa ko'ra olmaydi.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReassign(null)}>
                Bekor qilish
              </Button>
              <Button onClick={doReassign} disabled={!reassignSchool || busyId === reassign?.id}>
                Ko'chirish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
