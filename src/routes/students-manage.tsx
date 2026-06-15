import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  UserPlus,
  Upload,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Printer,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/students-manage")({
  head: () => ({ meta: [{ title: "O'quvchi qo'shish — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin", "counselor"]}>
      <StudentsManagePage />
    </ProtectedRoute>
  ),
});

// Edge funksiya bitta so'rovda ko'pi bilan 100 ta o'quvchi qabul qiladi
const BATCH_LIMIT = 100;

interface StudentInput {
  full_name: string;
  passport_series: string;
  class_number?: number;
  class_letter?: string;
  gender?: string;
  birth_date?: string;
}

// create-student javobidagi har bir qator
interface RowResult {
  full_name: string;
  login: string;
  password?: string;
  id?: string;
  ok: boolean;
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
            <Link
              to="/students"
              className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> O'quvchilar ro'yxatiga qaytish
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <UserPlus className="h-6 w-6 text-primary" /> O'quvchi qo'shish
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Yangi o'quvchi qo'shing — tizim login va parolni avtomatik yaratadi.
            </p>
          </div>
        </div>

        {/* Parol haqida banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <div className="text-sm">
            <p className="font-semibold text-indigo-700 dark:text-indigo-300">
              Login va parol haqida
            </p>
            <p className="mt-0.5 text-indigo-600 dark:text-indigo-400">
              Har bir o'quvchiga alohida parol yaratiladi va faqat shu yerda BIR MARTA ko'rsatiladi.
              Ro'yxatni chop etib (yoki nusxalab), o'quvchilarga tarqating. Login — guvohnoma
              seriyasi.
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

// ─── Schools dropdown data (faqat admin uchun) ───────────────────────────────
function useSchools(enabled: boolean) {
  return useQuery({
    queryKey: ["schools"],
    enabled,
    queryFn: async () => {
      const data = unwrap(await supabase.from("schools").select("id, name").order("name"));
      return (data ?? []) as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ─── Edge funksiya chaqiruvi (batch) ──────────────────────────────────────────
async function createStudents(payload: {
  school_id?: string;
  students: StudentInput[];
}): Promise<{ results?: RowResult[]; created?: number; failed?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke("create-student", { body: payload });
  if (error) return { error: error.message };
  return data;
}

// O'quvchi qo'shilgach yangilanishi kerak bo'lgan keshlar (5 daq staleTime tufayli majburiy)
function invalidateStudentLists(qc: ReturnType<typeof useQueryClient>) {
  [
    "students-list",
    "admin-students",
    "admin-sp",
    "analytics-students",
    "analytics-profiles",
    "students-for-council",
    "students-for-clubs",
  ].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

// ─── Login/parol natijalarini chop etish ─────────────────────────────────────
function printCredentials(rows: RowResult[]) {
  const created = rows.filter((r) => r.ok && r.password);
  if (!created.length) return;
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) {
    toast.error("Brauzer yangi oynani blokladi — popup'ga ruxsat bering");
    return;
  }
  const trs = created
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td><td>${r.full_name}</td><td>${r.login}</td><td>${r.password}</td></tr>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>Login-parollar</title><style>
    body{font-family:sans-serif;padding:24px}
    h2{margin-bottom:4px} p{color:#555;margin-top:0}
    table{border-collapse:collapse;width:100%;margin-top:16px}
    th,td{border:1px solid #999;padding:6px 10px;text-align:left;font-size:14px}
    th{background:#f0f0f0}
    td:nth-child(3),td:nth-child(4){font-family:monospace}
  </style></head><body>
    <h2>EduLens — o'quvchi login-parollari</h2>
    <p>Chop etilgan sana: ${new Date().toLocaleDateString("uz-UZ")}. Parollar faqat shu ro'yxatda — yo'qotmang!</p>
    <table><thead><tr><th>#</th><th>F.I.Sh</th><th>Login</th><th>Parol</th></tr></thead>
    <tbody>${trs}</tbody></table>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

function copyCredentials(rows: RowResult[]) {
  const created = rows.filter((r) => r.ok && r.password);
  const text = created.map((r) => `${r.full_name}\t${r.login}\t${r.password}`).join("\n");
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Login-parollar nusxalandi"))
    .catch(() => toast.error("Nusxalab bo'lmadi"));
}

// ─── Single student form ──────────────────────────────────────────────────────
function SingleStudentForm() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { data: schools = [] } = useSchools(isAdmin);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RowResult[]>([]);

  const [fullName, setFullName] = useState("");
  const [passport, setPassport] = useState("");
  const [classNum, setClassNum] = useState("");
  const [classLet, setClassLet] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin && !schoolId) {
      toast.error("Maktabni tanlang");
      return;
    }
    setBusy(true);

    const res = await createStudents({
      ...(isAdmin ? { school_id: schoolId } : {}),
      students: [
        {
          full_name: fullName,
          passport_series: passport,
          ...(classNum ? { class_number: parseInt(classNum) } : {}),
          ...(classLet ? { class_letter: classLet } : {}),
          ...(gender ? { gender } : {}),
          ...(birthDate ? { birth_date: birthDate } : {}),
        },
      ],
    });

    setBusy(false);

    const row = res.results?.[0];
    if (res.error || !row) {
      toast.error(res.error ?? "Noma'lum xatolik");
      return;
    }
    // Natijani ro'yxat boshiga qo'shamiz — ketma-ket qo'shganda parollar yig'ilib boradi
    setResults((prev) => [row, ...prev]);
    if (row.ok) {
      toast.success(`${row.full_name} qo'shildi`);
      invalidateStudentLists(qc);
      setFullName("");
      setPassport("");
      // Sinf/maktab tanlovi saqlanadi — bitta sinfni ketma-ket kiritish qulay bo'lsin
      setGender("");
      setBirthDate("");
    } else {
      toast.error(row.error ?? "Xatolik");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yangi o'quvchi ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">
                  To'liq ism <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Karimov Ali Vohidovich"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport">
                  Guvohnoma seriyasi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passport"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  placeholder="ibh1234567"
                  required
                  pattern="[a-zA-Z]{2,3}[0-9]{7}"
                  title="Lotin 2-3 harf + 7 raqam (masalan: ibh1234567)"
                />
                {passport && !passport.includes("@") && (
                  <p className="text-xs text-muted-foreground">
                    Login: <span className="font-mono font-semibold">{passport.toLowerCase()}</span>
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
              {/* Maktab tanlovi faqat super adminga — maslahatchida avtomatik o'z maktabi */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="school">
                    Maktab <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="school"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Tanlanmagan</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
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

            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Qo'shilmoqda...
                </>
              ) : (
                "O'quvchini qo'shish"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && <CredentialsCard results={results} />}
    </div>
  );
}

// ─── Bulk import form ─────────────────────────────────────────────────────────
// CSV format: full_name,passport_series,class_number,class_letter
// Example: Karimov Ali,ibh1234567,9,A
function BulkImportForm() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { data: schools = [] } = useSchools(isAdmin);
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);

  function parseRows(raw: string): StudentInput[] {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const parts = l.split(",").map((p) => p.trim());
        return {
          full_name: parts[0] ?? "",
          passport_series: parts[1] ?? "",
          class_number: parts[2] ? parseInt(parts[2]) : undefined,
          class_letter: parts[3] || undefined,
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
    if (isAdmin && !schoolId) {
      toast.error("Maktabni tanlang");
      return;
    }
    setBusy(true);
    setResults([]);
    setProgress(0);
    const out: RowResult[] = [];

    // 100 talik bo'laklarda yuboramiz (edge funksiya limiti)
    for (let i = 0; i < preview.length; i += BATCH_LIMIT) {
      const chunk = preview.slice(i, i + BATCH_LIMIT);
      const res = await createStudents({
        ...(isAdmin ? { school_id: schoolId } : {}),
        students: chunk,
      });
      if (res.error) {
        // Butun bo'lak muvaffaqiyatsiz — har qatorga xato yozamiz
        out.push(
          ...chunk.map((c) => ({
            full_name: c.full_name,
            login: c.passport_series,
            ok: false,
            error: res.error,
          })),
        );
      } else {
        out.push(...(res.results ?? []));
      }
      setProgress(Math.min(preview.length, i + chunk.length));
      setResults([...out]);
    }

    setBusy(false);
    invalidateStudentLists(qc);
    const ok = out.filter((r) => r.ok).length;
    const err = out.length - ok;
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
            <p className="mt-1 font-mono">
              To'liq ism, guvohnoma_seriyasi, sinf_raqami, sinf_harfi
            </p>
            <p className="mt-1 font-mono text-foreground/70">
              Karimov Ali Vohidovich, ibh1234567, 9, A
            </p>
            <p className="mt-0.5 font-mono text-foreground/70">
              Rahimova Zulfiya, aab9876543, 10, B
            </p>
            <p className="mt-1 text-xs">
              # bilan boshlanadigan satrlar va bo'sh satrlar e'tiborga olinmaydi. Excel'dan: kerakli
              ustunlarni belgilab nusxalang va shu yerga joylashtiring (TAB ham vergul kabi qabul
              qilinmaydi — vergulga almashtiring).
            </p>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="bulk-school">
                Maktab <span className="text-destructive">*</span>
              </Label>
              <select
                id="bulk-school"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Tanlanmagan</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={10}
            placeholder={
              "Karimov Ali Vohidovich, ibh1234567, 9, A\nRahimova Zulfiya, aab9876543, 10, B"
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={busy}
          />

          {preview.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Jami: <span className="font-semibold text-foreground">{preview.length}</span> ta
              o'quvchi aniqlandi
            </p>
          )}

          <Button
            onClick={onImport}
            disabled={busy || preview.length === 0}
            className="w-full sm:w-auto"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Import qilinmoqda ({progress}/
                {preview.length})...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> {preview.length} ta o'quvchini import qilish
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && <CredentialsCard results={results} />}
    </div>
  );
}

// ─── Natijalar: login-parol jadvali + chop etish/nusxalash ───────────────────
function CredentialsCard({ results }: { results: RowResult[] }) {
  const created = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Natijalar — login va parollar</CardTitle>
        {created.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copyCredentials(results)}>
              <Copy className="mr-1.5 h-4 w-4" /> Nusxalash
            </Button>
            <Button size="sm" onClick={() => printCredentials(results)}>
              <Printer className="mr-1.5 h-4 w-4" /> Chop etish
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {created.length > 0 && (
          <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Parollar faqat shu yerda ko'rsatiladi — sahifani yopishdan oldin chop eting yoki
            nusxalang.
          </p>
        )}
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">F.I.Sh</th>
                <th className="px-3 py-2 font-medium">Login</th>
                <th className="px-3 py-2 font-medium">Parol</th>
                <th className="px-3 py-2 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{r.full_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.login}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.ok ? r.password : "—"}</td>
                  <td className="px-3 py-2">
                    {r.ok ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Qo'shildi
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-destructive"
                        title={r.error}
                      >
                        <XCircle className="h-3.5 w-3.5" /> {r.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {failed.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {created.length} ta qo'shildi, {failed.length} ta xatolik.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
