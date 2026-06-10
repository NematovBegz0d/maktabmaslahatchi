// ─── Ijtimoiy Portfolio tiplari ───────────────────────────────────────────────

export type AchievementCategory =
  | "academic"
  | "sport"
  | "art"
  | "science"
  | "social"
  | "other";

export type AchievementLevel =
  | "school"
  | "district"
  | "region"
  | "republic"
  | "international";

export type AchievementResult = "winner" | "prize" | "participant";

export type EnrollmentStatus = "active" | "completed" | "dropped";

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  category: AchievementCategory;
  level: AchievementLevel;
  result: AchievementResult;
  achieved_at: string | null;
  added_by: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  institution_name: string;
  direction: string;
  schedule: string | null;
  status: EnrollmentStatus;
  start_date: string | null;
  added_by: string | null;
  created_at: string;
}

// ─── Ko'rsatuv maplari (UI uchun) ──────────────────────────────────────────────

export const CATEGORY_MAP: Record<
  AchievementCategory,
  { label: string; icon: string; badge: string }
> = {
  academic: {
    label: "Akademik",
    icon: "📖",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  sport: {
    label: "Sport",
    icon: "⚽",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  art: {
    label: "San'at",
    icon: "🎨",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  },
  science: {
    label: "Fan",
    icon: "🔬",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  social: {
    label: "Ijtimoiy",
    icon: "🤝",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  other: {
    label: "Boshqa",
    icon: "🏅",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
};

export const LEVEL_MAP: Record<
  AchievementLevel,
  { label: string; weight: number; badge: string }
> = {
  school: {
    label: "Maktab",
    weight: 1,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  district: {
    label: "Tuman/Shahar",
    weight: 2,
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  region: {
    label: "Viloyat",
    weight: 3,
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  republic: {
    label: "Respublika",
    weight: 4,
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  international: {
    label: "Xalqaro",
    weight: 5,
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

export const RESULT_MAP: Record<
  AchievementResult,
  { label: string; icon: string }
> = {
  winner: { label: "G'olib", icon: "🥇" },
  prize: { label: "Sovrindor", icon: "🏆" },
  participant: { label: "Ishtirokchi", icon: "🎖️" },
};

export const ENROLLMENT_STATUS_MAP: Record<
  EnrollmentStatus,
  { label: string; badge: string }
> = {
  active: {
    label: "Faol",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  completed: {
    label: "Tugatilgan",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  dropped: {
    label: "To'xtatilgan",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

/**
 * Ijtimoiy faollik darajasini hisoblash.
 * Klublar, yutuqlar (daraja og'irligi bilan) va faol mashg'ulotlar asosida.
 */
export function computeEngagement(args: {
  clubsCount: number;
  achievements: Pick<Achievement, "level">[];
  activeEnrollments: number;
}): { score: number; level: string; levelKey: string; color: string } {
  const clubPoints = Math.min(args.clubsCount * 10, 30);
  const achievementPoints = Math.min(
    args.achievements.reduce((sum, a) => sum + (LEVEL_MAP[a.level]?.weight ?? 1) * 4, 0),
    40
  );
  const enrollmentPoints = Math.min(args.activeEnrollments * 10, 30);
  const score = Math.min(clubPoints + achievementPoints + enrollmentPoints, 100);

  let level = "Boshlang'ich";
  let levelKey = "sp_level_basic";
  let color = "text-slate-500";
  if (score >= 80) {
    level = "Yuqori faol";
    levelKey = "sp_level_high";
    color = "text-green-600 dark:text-green-400";
  } else if (score >= 50) {
    level = "Faol";
    levelKey = "sp_level_active";
    color = "text-blue-600 dark:text-blue-400";
  } else if (score >= 25) {
    level = "O'rtacha";
    levelKey = "sp_level_mid";
    color = "text-amber-600 dark:text-amber-400";
  }

  return { score, level, levelKey, color };
}
