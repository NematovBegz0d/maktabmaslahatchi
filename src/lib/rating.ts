// Maslahatchi reytingini hisoblash — 100 ballik tizim:
//   Baza qamrovi  (kiritilgan/kutilgan o'quvchilar)      — 30 ball
//   Test qamrovi  (kamida 1 test topshirganlar ulushi)   — 30 ball
//   Faollik       (oxirgi amal: 7 kun=20, 30 kun=10)     — 20 ball
//   Vazifalar     (qabul qilingan/biriktirilgan)         — 20 ball
//                 (vazifa berilmagan bo'lsa — to'liq 20, jazolamaymiz)
import { schoolStatus, type SchoolStat } from "@/lib/school-stats";

export interface RatingParts {
  coverage: number;
  tested: number;
  activity: number;
  tasks: number;
}

export interface CounselorRating {
  counselorId: string;
  counselorName: string;
  schoolName: string;
  score: number;
  parts: RatingParts;
  statusEmoji: string;
}

export interface TaskStats {
  assigned: number;
  accepted: number;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
}

export function computeRating(s: SchoolStat, taskStats?: TaskStats): CounselorRating | null {
  if (!s.counselor_id) return null;

  const students = s.student_count ?? 0;
  const coveragePct = s.expected_students ? pct(students, s.expected_students) : 0;
  const testedPct = pct(s.tested_students ?? 0, students);
  const st = schoolStatus(s);
  const activityScore = st.rank >= 3 ? 20 : st.rank === 2 ? 10 : 0;
  const taskPct =
    taskStats && taskStats.assigned > 0 ? pct(taskStats.accepted, taskStats.assigned) : 100;

  const parts: RatingParts = {
    coverage: Math.round(coveragePct * 0.3),
    tested: Math.round(testedPct * 0.3),
    activity: activityScore,
    tasks: Math.round(taskPct * 0.2),
  };

  return {
    counselorId: s.counselor_id,
    counselorName: s.counselor_name ?? "Noma'lum",
    schoolName: s.name ?? "—",
    score: parts.coverage + parts.tested + parts.activity + parts.tasks,
    parts,
    statusEmoji: st.emoji,
  };
}

// Reyting o'rni uchun medal belgilari
export function rankEmoji(index: number): string {
  return ["🥇", "🥈", "🥉"][index] ?? `${index + 1}.`;
}
