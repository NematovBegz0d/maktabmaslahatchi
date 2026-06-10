import { Card, CardContent } from "@/components/ui/card";
import { BookOpenCheck } from "lucide-react";

export interface SubjectResult {
  test_id: string;
  name: string;
  percent: number;
  grade: number;
  correct: number;
  total: number;
}

// 5 balli baho uchun rang va nom
const GRADE_INFO: Record<number, { label: string; color: string; bar: string }> = {
  5: { label: "A'lo", color: "text-emerald-600", bar: "bg-emerald-500" },
  4: { label: "Yaxshi", color: "text-blue-600", bar: "bg-blue-500" },
  3: { label: "Qoniqarli", color: "text-amber-600", bar: "bg-amber-500" },
  2: { label: "Qoniqarsiz", color: "text-red-500", bar: "bg-red-500" },
};

export function SubjectResults({ items }: { items: SubjectResult[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="mb-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <BookOpenCheck className="h-4 w-4 text-primary" /> Fan bilimlari
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => {
            const g = GRADE_INFO[s.grade] ?? GRADE_INFO[2];
            return (
              <div key={s.test_id} className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${g.color} bg-muted/60`}>
                    {s.grade}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className={`font-semibold ${g.color}`}>{g.label}</span>
                  <span>{s.correct}/{s.total} to'g'ri • {s.percent}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-all ${g.bar}`} style={{ width: `${Math.min(100, s.percent)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
