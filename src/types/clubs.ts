// ─── Klub turlari ─────────────────────────────────────────────────────────────

export type ClubColor =
  | "purple"
  | "pink"
  | "amber"
  | "green"
  | "blue"
  | "orange"
  | "cyan";

export interface Club {
  id: string;
  name: string;
  description: string;
  focus_area: string;
  icon: string;
  color: ClubColor;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  student_id: string;
  joined_at: string;
  added_by: string | null;
  notes: string | null;
}

/** Embedded student ma'lumoti (Supabase `profiles(...)` embed natijasi) */
export interface ClubMemberProfile {
  id: string;
  full_name: string | null;
  class_number: number | null;
  class_letter: string | null;
}

/** Klub a'zosi + embed qilingan student profili (clubs.$id sahifasi) */
export interface ClubMemberWithProfile {
  id: string;
  student_id: string;
  joined_at: string;
  notes: string | null;
  profiles: ClubMemberProfile | null;
}

/** A'zolik + embed qilingan klub (my-clubs / my-profile sahifasi) */
export interface MembershipWithClub {
  id: string;
  joined_at: string;
  notes: string | null;
  clubs: Club | null;
}

// ─── 7 ta statik klub ma'lumotlari ────────────────────────────────────────────

export const CLUBS_STATIC: Omit<Club, "id" | "created_at">[] = [
  {
    name: "Turon Teatr",
    description:
      "Sahna san'ati va notiqlik ko'nikmalarini rivojlantiruvchi klub. O'quvchilar teatr ijrosi, ovoz va nutq texnikasi, sahna harakati asoslarini o'rganadilar.",
    focus_area: "Sahna san'ati, Notiqlik, Ijro mahorati",
    icon: "🎭",
    color: "purple",
  },
  {
    name: "Iqtidor Ansambli",
    description:
      "Musiqa va ijodiy iqtidorni kashf etuvchi klub. Vokal, cholg'u asboblari va musiqiy kompozitsiya asoslari o'rgatiladi.",
    focus_area: "Musiqa, Ijod, Vokal, Cholg'u asboblari",
    icon: "🎵",
    color: "pink",
  },
  {
    name: "Jadidlar Izidan",
    description:
      "Kitobxonlik madaniyati va milliy o'zlikni mustahkamlovchi klub. O'zbek adabiyoti, tarix va jadidchilik harakati g'oyalari o'rganiladi.",
    focus_area: "Kitobxonlik, Milliy o'zlik, O'zbek adabiyoti",
    icon: "📚",
    color: "amber",
  },
  {
    name: "Eco-Schools",
    description:
      "Ekologik madaniyat va tabiatga muhabbatni tarbiyalovchi klub. Atrof-muhitni muhofaza qilish, ekologik loyihalar va ilmiy tadqiqotlar olib boriladi.",
    focus_area: "Ekologiya, Tabiat, Ilmiy tadqiqot",
    icon: "🌿",
    color: "green",
  },
  {
    name: "Xorijiy Tillar",
    description:
      "Chet tili ko'nikmalarini rivojlantiruvchi klub. Ingliz, rus va boshqa xorijiy tillarni qo'shimcha mashg'ulotlar orqali o'rganish.",
    focus_area: "Ingliz tili, Xorijiy tillar, Muloqot ko'nikmasi",
    icon: "🌍",
    color: "blue",
  },
  {
    name: "Debat",
    description:
      "Tanqidiy fikrlash va liderlik ko'nikmalarini rivojlantiruvchi klub. Munozara texnikasi, argumentatsiya va jamoaviy ishlash o'rgatiladi.",
    focus_area: "Tanqidiy fikrlash, Liderlik, Munozara",
    icon: "🗣️",
    color: "orange",
  },
  {
    name: "Raqamli Avlod Qizlari",
    description:
      "Qizlarni IT va innovatsiyaga jalb etuvchi klub. Dasturlash asoslari, raqamli savodxonlik va texnologik loyihalar bilan ishlash ko'nikmalari beriladi.",
    focus_area: "IT, Dasturlash, Innovatsiya, Texnologiya",
    icon: "💻",
    color: "cyan",
  },
];

// ─── Rang sozlamalari (Tailwind v4 uchun) ──────────────────────────────────────

export const CLUB_COLOR_MAP: Record<
  ClubColor,
  { bg: string; text: string; border: string; badge: string; soft: string }
> = {
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    soft: "bg-purple-50 dark:bg-purple-950/30",
  },
  pink: {
    bg: "bg-pink-500",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    soft: "bg-pink-50 dark:bg-pink-950/30",
  },
  amber: {
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    soft: "bg-amber-50 dark:bg-amber-950/30",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    soft: "bg-green-50 dark:bg-green-950/30",
  },
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    soft: "bg-blue-50 dark:bg-blue-950/30",
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    soft: "bg-orange-50 dark:bg-orange-950/30",
  },
  cyan: {
    bg: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    soft: "bg-cyan-50 dark:bg-cyan-950/30",
  },
};
