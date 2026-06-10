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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Trash2, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, ListChecks, X,
} from "lucide-react";

export const Route = createFileRoute("/tests-manage")({
  head: () => ({ meta: [{ title: "Testlarni boshqarish — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["admin"]}>
      <TestsManage />
    </ProtectedRoute>
  ),
});

// Ma'lum test turlari — scoring algoritmi shularga bog'liq
const TEST_TYPES: { value: string; label: string }[] = [
  { value: "generic", label: "Umumiy (ball yig'indisi) — yangi testlar uchun tavsiya" },
  { value: "subject", label: "Fan testi (foiz + 1-5 baho, to'g'ri javob kerak)" },
  { value: "eysenck", label: "Ayzenk (temperament: E/N/L subscale)" },
  { value: "holland", label: "Holland RIASEC (R/I/A/S/E/C subscale)" },
  { value: "big5", label: "Big Five (O/C/E/A/N subscale)" },
  { value: "eq", label: "Hissiy intellekt (EQ)" },
  { value: "leadership", label: "Liderlik" },
  { value: "math_iq", label: "Matematik IQ (to'g'ri javob kaliti kerak)" },
  { value: "raven", label: "Raven IQ (to'g'ri javob kaliti kerak)" },
];

// To'g'ri javob kaliti kerak bo'lgan turlar (bilim testlari)
const KNOWLEDGE_TYPES = new Set(["subject", "math_iq", "raven"]);

interface TestRow {
  id: string;
  name_uz: string;
  description: string | null;
  category: string | null;
  test_type: string;
  question_count: number | null;
  duration_minutes: number | null;
  is_active: boolean;
}

function TestsManage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: tests, isLoading } = useQuery({
    queryKey: ["manage-tests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tests")
        .select("id, name_uz, description, category, test_type, question_count, duration_minutes, is_active")
        .order("name_uz");
      return (data ?? []) as TestRow[];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["manage-tests"] });
    // O'quvchiga ko'rinadigan test ro'yxatlari ham yangilansin (5 daq staleTime)
    qc.invalidateQueries({ queryKey: ["all-tests"] });
    qc.invalidateQueries({ queryKey: ["tests-active"] });
  }

  async function toggleActive(t: TestRow) {
    setBusyId(t.id);
    const { error } = await supabase.from("tests").update({ is_active: !t.is_active }).eq("id", t.id);
    setBusyId(null);
    if (error) { console.error("[tests-manage]", error); toast.error("Amalni bajarishda xatolik yuz berdi"); return; }
    toast.success(t.is_active ? "Test nofaol qilindi" : "Test faollashtirildi");
    invalidate();
  }

  async function deleteTest(t: TestRow) {
    if (!confirm(`"${t.name_uz}" testini va uning barcha savollarini o'chirishni tasdiqlaysizmi?`)) return;
    setBusyId(t.id);
    // Avval savollarni o'chiramiz (FK xavfsizligi uchun)
    await supabase.from("questions").delete().eq("test_id", t.id);
    const { error } = await supabase.from("tests").delete().eq("id", t.id);
    setBusyId(null);
    if (error) { console.error("[tests-manage]", error); toast.error("Amalni bajarishda xatolik yuz berdi"); return; }
    toast.success("Test o'chirildi");
    invalidate();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <ClipboardList className="h-6 w-6 text-primary" /> Testlarni boshqarish
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Yangi test yarating, savollar qo'shing va testlarni faollashtiring.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowNew((v) => !v)}>
            {showNew ? <><X className="mr-1.5 h-4 w-4" /> Bekor qilish</> : <><Plus className="mr-1.5 h-4 w-4" /> Yangi test</>}
          </Button>
        </div>

        {showNew && <NewTestForm onDone={() => { setShowNew(false); invalidate(); }} />}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : (tests ?? []).length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Hali test yo'q. "Yangi test" tugmasi orqali qo'shing.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(tests ?? []).map((t) => (
              <Card key={t.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{t.name_uz}</p>
                        {t.is_active
                          ? <Badge className="bg-success/10 text-success">Faol</Badge>
                          : <Badge variant="secondary" className="bg-muted text-muted-foreground">Nofaol</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{t.test_type}</span> • {t.question_count ?? 0} ta savol
                        {t.duration_minutes ? ` • ${t.duration_minutes} daq` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      >
                        {expanded === t.id ? <ChevronDown className="mr-1 h-3.5 w-3.5" /> : <ChevronRight className="mr-1 h-3.5 w-3.5" />}
                        <ListChecks className="mr-1 h-3.5 w-3.5" /> Savollar
                      </Button>
                      <Button
                        variant="outline" size="sm" disabled={busyId === t.id}
                        onClick={() => toggleActive(t)}
                        title={t.is_active ? "Nofaol qilish" : "Faollashtirish"}
                      >
                        {t.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="outline" size="sm" disabled={busyId === t.id}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteTest(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {expanded === t.id && <QuestionEditor testId={t.id} testType={t.test_type} onChanged={invalidate} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/dashboard" className="text-primary hover:underline">← Boshqaruv paneliga qaytish</Link>
        </p>
      </main>
    </div>
  );
}

// ─── Yangi test formasi ────────────────────────────────────────────────────
function NewTestForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("generic");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Test nomi majburiy"); return; }
    setBusy(true);
    const { error } = await supabase.from("tests").insert({
      name_uz: name.trim(),
      test_type: type,
      is_active: true,
      question_count: 0,
      ...(desc.trim() ? { description: desc.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(duration ? { duration_minutes: parseInt(duration) } : {}),
    });
    setBusy(false);
    if (error) { console.error("[tests-manage]", error); toast.error("Amalni bajarishda xatolik yuz berdi"); return; }
    toast.success(`"${name}" testi yaratildi. Endi savollar qo'shing.`);
    onDone();
  }

  return (
    <Card className="mb-5 border-primary/30">
      <CardHeader><CardTitle className="text-base">Yangi test</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Test nomi <span className="text-destructive">*</span></Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Motivatsiya testi" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-type">Test turi (scoring)</Label>
              <select
                id="t-type" value={type} onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TEST_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Tavsif</Label>
            <Input id="t-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Test nima o'lchaydi" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-cat">Kategoriya</Label>
              <Input id="t-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Psixologik / Intellektual" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-dur">Davomiyligi (daqiqa)</Label>
              <Input id="t-dur" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="15" />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yaratilmoqda...</> : "Testni yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Savollar muharriri ────────────────────────────────────────────────────
interface QuestionRow {
  id: string;
  question_number: number;
  question_text_uz: string;
  subscale: string | null;
  options: { value: number; label: string }[];
}

// Variant shablonlari
const OPTION_TEMPLATES: Record<string, { value: number; label: string }[]> = {
  "Ha / Yo'q": [{ value: 1, label: "Ha" }, { value: 0, label: "Yo'q" }],
  "5 balli (1-5)": [
    { value: 1, label: "Mutlaqo yo'q" }, { value: 2, label: "Yo'q" },
    { value: 3, label: "O'rtacha" }, { value: 4, label: "Ha" }, { value: 5, label: "To'liq ha" },
  ],
  "To'g'ri / Noto'g'ri": [{ value: 1, label: "To'g'ri" }, { value: 0, label: "Noto'g'ri" }],
};

function QuestionEditor({ testId, testType, onChanged }: { testId: string; testType: string; onChanged: () => void }) {
  const qc = useQueryClient();
  const isKnowledge = KNOWLEDGE_TYPES.has(testType);
  const [text, setText] = useState("");
  const [subscale, setSubscale] = useState("");
  const [opts, setOpts] = useState<{ value: number; label: string }[]>(OPTION_TEMPLATES["Ha / Yo'q"]);
  // Bilim testlari uchun: 4 variant matni (A-D) + to'g'ri javob indeksi
  const [optLabels, setOptLabels] = useState<string[]>(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["manage-questions", testId],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions")
        .select("id, question_number, question_text_uz, subscale, options")
        .eq("test_id", testId)
        .order("question_number");
      return (data ?? []) as unknown as QuestionRow[];
    },
  });

  // Bilim testlari uchun to'g'ri javob kalitlari (admin o'qiy oladi)
  const qIds = (questions ?? []).map((q) => q.id);
  const { data: keyMap } = useQuery({
    queryKey: ["manage-keys", testId, qIds.length],
    enabled: isKnowledge && qIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("question_answer_keys")
        .select("question_id, correct_answer")
        .in("question_id", qIds);
      const map: Record<string, number> = {};
      (data ?? []).forEach((k) => {
        const v = (k.correct_answer as { v?: number })?.v;
        if (typeof v === "number") map[k.question_id] = v;
      });
      return map;
    },
  });

  async function syncCount(n: number) {
    await supabase.from("tests").update({ question_count: n }).eq("id", testId);
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ["manage-questions", testId] });
    qc.invalidateQueries({ queryKey: ["manage-keys", testId] });
    onChanged();
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { toast.error("Savol matni majburiy"); return; }
    const nextNum = (questions ?? []).reduce((m, q) => Math.max(m, q.question_number), 0) + 1;

    // Variantlarni tayyorlash
    let builtOpts: { value: number; label: string }[];
    let correctValue = -1;
    if (isKnowledge) {
      const filled = optLabels.map((l, i) => ({ label: l.trim(), origIdx: i })).filter((o) => o.label);
      if (filled.length < 2) { toast.error("Kamida 2 ta variant matni kerak"); return; }
      const cNew = filled.findIndex((o) => o.origIdx === correctIdx);
      if (cNew < 0) { toast.error("To'g'ri javobni belgilang (matni bo'sh bo'lmasin)"); return; }
      builtOpts = filled.map((o, newIdx) => ({ value: newIdx, label: o.label }));
      correctValue = cNew;
    } else {
      if (opts.length < 2) { toast.error("Kamida 2 ta variant kerak"); return; }
      builtOpts = opts;
    }

    setBusy(true);
    const { data: newQ, error } = await supabase.from("questions").insert({
      test_id: testId,
      question_number: nextNum,
      question_text_uz: text.trim(),
      question_type: "single_choice",
      options: builtOpts,
      ...(subscale.trim() ? { subscale: subscale.trim().toUpperCase() } : {}),
    }).select("id").single();

    // Bilim testi -> to'g'ri javob kalitini yozamiz
    if (!error && newQ && isKnowledge) {
      const { error: keyErr } = await supabase.from("question_answer_keys")
        .insert({ question_id: newQ.id, correct_answer: { v: correctValue } });
      if (keyErr) console.error("[answer-key]", keyErr);
    }
    if (!error) await syncCount((questions ?? []).length + 1);
    setBusy(false);
    if (error) { console.error("[tests-manage]", error); toast.error("Amalni bajarishda xatolik yuz berdi"); return; }
    toast.success(`${nextNum}-savol qo'shildi`);
    setText(""); setSubscale(""); setOptLabels(["", "", "", ""]); setCorrectIdx(0);
    refresh();
  }

  async function removeQuestion(id: string) {
    setDelId(id);
    // question_answer_keys CASCADE bilan o'chadi
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (!error) await syncCount(Math.max(0, (questions ?? []).length - 1));
    setDelId(null);
    if (error) { console.error("[tests-manage]", error); toast.error("Amalni bajarishda xatolik yuz berdi"); return; }
    toast.success("Savol o'chirildi");
    refresh();
  }

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      {/* Mavjud savollar */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (questions ?? []).length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Hali savol yo'q. Quyida birinchi savolni qo'shing.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {(questions ?? []).map((q) => (
            <div key={q.id} className="flex items-start gap-2 rounded-lg bg-background px-3 py-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{q.question_number}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{q.question_text_uz}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.subscale ? `[${q.subscale}] ` : ""}
                  {isKnowledge
                    ? (q.options ?? []).map((o) => o.label).join(" · ")
                    : (q.options ?? []).map((o) => `${o.label}=${o.value}`).join(", ")}
                </p>
                {isKnowledge && (
                  <p className="mt-0.5 text-xs font-medium text-emerald-600">
                    ✓ To'g'ri: {(q.options ?? []).find((o) => o.value === keyMap?.[q.id])?.label ?? "— (belgilanmagan)"}
                  </p>
                )}
              </div>
              <Button
                variant="ghost" size="icon" disabled={delId === q.id}
                className="h-7 w-7 shrink-0 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeQuestion(q.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Yangi savol formasi */}
      <form onSubmit={addQuestion} className="space-y-3 border-t border-border/50 pt-4">
        <div className="space-y-2">
          <Label htmlFor={`q-text-${testId}`} className="text-xs">Savol matni <span className="text-destructive">*</span></Label>
          <Input id={`q-text-${testId}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Savolni kiriting" />
        </div>
        {isKnowledge ? (
          /* Bilim testi: variant matnlari + to'g'ri javobni belgilash */
          <div className="space-y-2">
            <Label className="text-xs">Variantlar — to'g'risini belgilang (radio)</Label>
            {["A", "B", "C", "D"].map((letter, i) => (
              <div key={letter} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${testId}`}
                  checked={correctIdx === i}
                  onChange={() => setCorrectIdx(i)}
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  aria-label={`${letter} to'g'ri javob`}
                />
                <span className="w-4 text-xs font-bold text-muted-foreground">{letter}</span>
                <Input
                  value={optLabels[i]}
                  onChange={(e) => setOptLabels((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                  placeholder={`${letter} varianti`}
                  className="h-9"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Belgilangan to'g'ri javob: <span className="font-semibold text-emerald-600">{["A", "B", "C", "D"][correctIdx]}</span>
              {optLabels[correctIdx]?.trim() ? ` — ${optLabels[correctIdx].trim()}` : ""}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Variantlar shabloni</Label>
                <select
                  value={JSON.stringify(opts)}
                  onChange={(e) => setOpts(JSON.parse(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(OPTION_TEMPLATES).map(([k, v]) => (
                    <option key={k} value={JSON.stringify(v)}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`q-sub-${testId}`} className="text-xs">Subscale (ixtiyoriy)</Label>
                <Input id={`q-sub-${testId}`} value={subscale} onChange={(e) => setSubscale(e.target.value)} placeholder="E / N / R / I ..." maxLength={4} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tanlangan variantlar: {opts.map((o) => `${o.label}=${o.value}`).join(", ")}
            </p>
          </>
        )}
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Qo'shilmoqda...</> : <><Plus className="mr-1.5 h-3.5 w-3.5" /> Savol qo'shish</>}
        </Button>
      </form>
    </div>
  );
}
