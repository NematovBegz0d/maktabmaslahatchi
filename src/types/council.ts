// ─── O'quvchilar Kengashi tiplari ─────────────────────────────────────────────

export type CouncilPosition = "chairman" | "deputy" | "secretary" | "member";

export interface CouncilMember {
  id: string;
  student_id: string;
  position: CouncilPosition;
  sector: string;
  term: string;
  elected_at: string | null;
  notes: string | null;
  added_by: string | null;
  created_at: string;
}

/** Kengash a'zosi + embed qilingan student profili */
export interface CouncilMemberWithProfile extends CouncilMember {
  profiles: {
    id: string;
    full_name: string | null;
    class_number: number | null;
    class_letter: string | null;
  } | null;
}

export interface CouncilActivity {
  id: string;
  title: string;
  description: string | null;
  activity_date: string | null;
  added_by: string | null;
  created_at: string;
}

// ─── Lavozim maplari (UI uchun) ────────────────────────────────────────────────

export const POSITION_MAP: Record<
  CouncilPosition,
  { label: string; icon: string; rank: number; badge: string; ring: string }
> = {
  chairman: {
    label: "Rais",
    icon: "👑",
    rank: 1,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ring: "ring-amber-400",
  },
  deputy: {
    label: "O'rinbosar",
    icon: "⭐",
    rank: 2,
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    ring: "ring-indigo-400",
  },
  secretary: {
    label: "Kotib",
    icon: "📝",
    rank: 3,
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    ring: "ring-cyan-400",
  },
  member: {
    label: "A'zo",
    icon: "🎓",
    rank: 4,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    ring: "ring-slate-300",
  },
};

export const POSITION_ORDER: CouncilPosition[] = [
  "chairman",
  "deputy",
  "secretary",
  "member",
];
