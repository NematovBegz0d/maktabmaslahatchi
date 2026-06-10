import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  UserPlus, Upload, ChevronLeft, CheckCircle2, XCircle,
  Loader2, Info,
} from "lucide-react";

export const Route = createFileRoute("/students-manage")({
  head: () => ({ meta: [{ title: "O'quvchi qo'shish — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <StudentsManagePage />
    </ProtectedRoute>
  ),
});

interface AddResult {
  full_name: string;
  passport_series: string;
  status: "ok" | "updated" | "error";
  error?: string;
}

// ─── Main page ───────────────────────────────────────────────────────────────
function StudentsManagePage() {
  const [tab, setTab] = useState<"single" | "bulk">("single");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/students" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> O'quvchilar ro'yxatiga qaytish
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <UserPlus className="h-6 w-6 text-primary" /> O'quvchi qo'shish
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Yangi o'quvchi qo'shing — tizim avtomatik ravishda login yaratar.
            </p>
          </div>
        </div>

        {/* Password info banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <div className="text-sm">
            <p className="font-semibold text-indigo-700 dark:text-indigo-300">Umumiy parol haqida</p>
            <p className="mt-0.5 text-indigo-600 dark:text-indigo-400">
              Barcha o'quvchilar uchun bitta umumiy parol ishlatiladi. O'quvchi login sifatida guvohnoma seriyasini kiritadi.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-border bg-muted/30 p-1">
          <button
            onClick={() => setTab("single")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "single"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yakka o'quvchi
          </button>
          <button
            onClick={() => setTab("bulk")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "bulk"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="mr-1.5 inline h-4 w-4" />
            Ommaviy import
          </button>
        </div>

        {tab === "single" ? <SingleStudentForm /> : <BulkImportForm />}
      </main>
    </div>
  );
}

// ─── Schools dropdown data ────────────────────────────────────────────────────
function useSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ─── Call edge function ───────────────────────────────────────────────────────
async function createStudent(payload: {
  passport_series: string;
  full_name: string;
  class_number?: number;
  class_letter?: string;
  school_id?: string;
  gender?: string;
  birth_date?: string;
}): Promise<{ ok?: boolean; updated?: boolean; student_id?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("create-student", { body: payload });
  if (error) return { error: error.message };
  return data;
}

// O'quvchi qo'shilgach yangilanishi kerak bo'lgan keshlar (5 daq staleTime tufayli majburiy)
function invalidateStudentLists(qc: ReturnType<typeof useQueryClient>) {
  ["students-list", "admin-students", "admin-sp", "analytics-students",
   "analytics-profiles", "students-for-council", "students-for-clubs"]
    .forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

// ─── Single student form ──────────────────────────────────────────────────────
function SingleStudentForm() {
  const { data: schools = [] } = useSchools();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AddResult | null>(null);

  const [fullName, setFullName]     = useState("");
  const [passport, setPassport]     = useState("");
  const [classNum, setClassNum]     = useState("");
  const [classLet, setClassLet]     = useState("");
  const [schoolId, setSchoolId]     = useState("");
  const [gender, setGender]         = useState("");
  const [birthDate, setBirthDate]   = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);

    const res = await createStudent({
      passport_series: passport,
      full_name: fullName,
      ...(classNum ? { class_number: parseInt(classNum) } : {}),
      ...(classLet ? { class_letter: classLet } : {}),
      ...(schoolId ? { school_id: schoolId } : {}),
      ...(gender   ? { gender }   : {}),
      ...(birthDate ? { birth_date: birthDate } : {}),
    });

    setBusy(false);

    if (res.error) {
      setResult({ full_name: fullName, passport_series: passport, status: "error", error: res.error });
      toast.error(res.error);
    } else {
      const status = res.updated ? "updated" : "ok";
      setResult({ full_name: fullName, passport_series: passport, status });
      toast.success(res.updated ? `${fullName} yangilandi` : `${fullName} muvaffaqiyatli qo'shildi`);
      invalidateStudentLists(qc); // ro'yxat darhol yangilansin
      // Reset form
      setFullName(""); setPassport(""); setClassNum(""); setClassLet("");
      setSchoolId(""); setGender(""); setBirthDate("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yangi o'quvchi ma'lumotlari</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">To'liq ism <span className="text-destructive">*</span></Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Karimov Ali Vohidovich"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport">Guvohnoma seriyasi <span className="text-destructive">*</span></Label>
              <Input
                id="passport"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                placeholder="ibh1234567"
                required
                pattern="[a-zA-Zа-яА-ЯёЁ]{2,3}[0-9]{7}"
                title="2-3 harf + 7 raqam (masalan: ibh1234567)"
              />
              {passport && !passport.includes("@") && (
                <p className="text-xs text-muted-foreground">
                  Login: <span className="font-mono font-semibold">{passport.toLowerCase()}@edulab.uz</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="class-num">Sinf raqami</Label>
              <Input
                id="class-num"
                type="number"
                min={1}
                max={11}
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                placeholder="9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-let">Sinf harfi</Label>
              <Input
                id="class-let"
                value={classLet}
                onChange={(e) => setClassLet(e.target.value.toUpperCase())}
                placeholder="A"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Jinsi</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Tanlanmagan</option>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {schools.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="school">Maktab</Label>
                <select
                  id="school"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Tanlanmagan</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="birth-date">Tug'ilgan sana</Label>
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          {result && (
            <ResultBadge result={result} />
          )}

          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Qo'shilmoqda...</> : "O'quvchini qo'shish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Bulk import form ─────────────────────────────────────────────────────────
// CSV format: full_name,passport_series,class_number,class_letter
// Example: Karimov Ali,ibh1234567,9,A
function BulkImportForm() {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AddResult[]>([]);

  function parseRows(raw: string) {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const parts = l.split(",").map((p) => p.trim());
        return {
          full_name:      parts[0] ?? "",
          passport_series: parts[1] ?? "",
          class_number:   parts[2] ? parseInt(parts[2]) : undefined,
          class_letter:   parts[3] ?? undefined,
        };
      })
      .filter((r) => r.full_name && r.passport_series);
  }

  const preview = parseRows(csv);

  async function onImport() {
    if (!preview.length) {
      toast.error("Hech qanday satr topilmadi");
      return;
    }
    setBusy(true);
    setResults([]);
    const out: AddResult[] = [];

    for (const row of preview) {
      const res = await createStudent(row);
      if (res.error) {
        out.push({ full_name: row.full_name, passport_series: row.passport_series, status: "error", error: res.error });
      } else {
        out.push({ full_name: row.full_name, passport_series: row.passport_series, status: res.updated ? "updated" : "ok" });
      }
      // Small delay to avoid rate limit
      await new Promise((r) => setTimeout(r, 120));
    }

    setResults(out);
    setBusy(false);
    invalidateStudentLists(qc); // ro'yxat darhol yangilansin
    const ok = out.filter((r) => r.status !== "error").length;
    const err = out.filter((r) => r.status === "error").length;
    if (err === 0) toast.success(`${ok} ta o'quvchi muvaffaqiyatli qo'shildi`);
    else toast.warning(`${ok} ta qo'shildi, ${err} ta xatolik`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV matnini joylashtiring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <p className="font-semibold">Format (vergul bilan ajratilgan):</p>
            <p className="mt-1 font-mono">To'liq ism, guvohnoma_seriyasi, sinf_raqami, sinf_harfi</p>
            <p className="mt-1 font-mono text-foreground/70">Karimov Ali Vohidovich, ibh1234567, 9, A</p>
            <p className="mt-0.5 font-mono text-foreground/70">Rahimova Zulfiya, aab9876543, 10, B</p>
            <p className="mt-1 text-xs"># bilan boshlanadigan satrlar va bo'sh satrlar e'tiborga olinmaydi.</p>
          </div>

          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={10}
            placeholder={"Karimov Ali Vohidovich, ibh1234567, 9, A\nRahimova Zulfiya, aab9876543, 10, B"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={busy}
          />

          {preview.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Jami: <span className="font-semibold text-foreground">{preview.length}</span> ta o'quvchi aniqland
            </p>
          )}

          <Button onClick={onImport} disabled={busy || preview.length === 0} className="w-full sm:w-auto">
            {busy
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Import qilinmoqda ({results.length}/{preview.length})...</>
              : <><Upload className="mr-2 h-4 w-4" /> {preview.length} ta o'quvchini import qilish</>
            }
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <ResultBadge key={i} result={r} />
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {results.filter((r) => r.status === "ok").length} ta yangi
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
                {results.filter((r) => r.status === "updated").length} ta yangilandi
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                {results.filter((r) => r.status === "error").length} ta xatolik
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Result badge component ───────────────────────────────────────────────────
function ResultBadge({ result }: { result: AddResult }) {
  if (result.status === "ok") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {result.full_name}
        </span>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Qo'shildi</Badge>
      </div>
    );
  }
  if (result.status === "updated") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="flex-1 text-sm font-medium text-blue-800 dark:text-blue-300">
          {result.full_name}
        </span>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Yangilandi</Badge>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
      <span className="flex-1 text-sm font-medium text-destructive">{result.full_name}</span>
      <span className="text-xs text-destructive">{result.error}</span>
    </div>
  );
}
