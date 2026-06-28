// Bilimnoma moduli — bo'limlar (section) yagona manbasi.
// Bu ro'yxat kod tomonda QAT'IY: 4 ta asosiy bo'lim. Ularning ichidagi
// kategoriya va yozuvlar (entries) Supabase'da saqlanadi va admin panelidan
// boshqariladi. DB'dagi `section` ustuni shu yerdagi `key` bilan bir xil
// bo'lishi shart (migratsiyadagi CHECK domeni ham shu qiymatlarni qabul qiladi).

import {
  Briefcase,
  Sparkles,
  School,
  GraduationCap,
  Brain,
  BookOpen,
  Rocket,
  HeartPulse,
  Wheat,
  Landmark,
  Hourglass,
  Palette,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Bot,
  Code,
  PenTool,
  Drone,
  Stethoscope,
  HardHat,
  PlugZap,
  ChefHat,
  Truck,
  Sprout,
  Beef,
  Scissors,
  Armchair,
  Croissant,
  Amphora,
  Gem,
  Hammer,
  Building2,
  Brush,
  Shirt,
  Phone,
  Keyboard,
  Film,
  Lightbulb,
  Watch,
  Newspaper,
  Smartphone,
  Clapperboard,
  Camera,
  ScrollText,
  Star,
  MapPin,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type BilimnomaSectionKey =
  | "kasblar"
  | "prezident_iqtidorli"
  | "prezident_maktablari"
  | "oliy_talim"
  | "tarixiy_obidalar";

// Bo'lim turi — detal/admin maydonlari shunga qarab moslashadi.
//   career — kasblar (ko'nikma, fanlar, talab, "senga mosmi" test)
//   place  — tarixiy obidalar/muzeylar (tarix, manzil, tashrif, faktlar)
export type SectionKind = "career" | "place";

export interface SectionMeta {
  /** DB'dagi `section` qiymati (underscore bilan) */
  key: BilimnomaSectionKey;
  /** URL bo'lagi (chiziqcha bilan): /bilimnoma/<slug> */
  slug: string;
  title: string;
  /** Hub kartochkasidagi qisqa izoh */
  short: string;
  icon: LucideIcon;
  kind: SectionKind;
  /** Tailwind aksent sinflari (kartochka foni + matn) */
  accentBg: string;
  accentText: string;
  /** Bo'lim kartochka chetidagi gradient (hub) */
  gradient: string;
  /** Bu bo'lim kategoriyalarga bo'linadimi (Kasblar — ha) */
  usesCategories: boolean;
}

export const SECTIONS: SectionMeta[] = [
  {
    key: "kasblar",
    slug: "kasblar",
    title: "Kasblar",
    short: "Yo'qolayotgan, yangi va an'anaviy kasblar — kelajak mehnat bozori.",
    icon: Briefcase,
    kind: "career",
    accentBg: "bg-violet-100",
    accentText: "text-violet-700",
    gradient: "from-violet-500 to-fuchsia-500",
    usesCategories: true,
  },
  {
    key: "prezident_iqtidorli",
    slug: "prezident-iqtidorli",
    title: "Prezident iqtidorli farzandlari",
    short: "Iqtidorli yoshlar uchun Prezident tomonidan yaratilgan imkoniyatlar.",
    icon: Sparkles,
    kind: "career",
    accentBg: "bg-amber-100",
    accentText: "text-amber-700",
    gradient: "from-amber-500 to-orange-500",
    usesCategories: false,
  },
  {
    key: "prezident_maktablari",
    slug: "prezident-maktablari",
    title: "Prezident maktablari",
    short: "Prezident maktablari haqida: qabul, yo'nalishlar va shartlar.",
    icon: School,
    kind: "career",
    accentBg: "bg-emerald-100",
    accentText: "text-emerald-700",
    gradient: "from-emerald-500 to-teal-500",
    usesCategories: false,
  },
  {
    key: "oliy_talim",
    slug: "oliy-talim",
    title: "Oliy ta'lim haqida",
    short: "Universitetlar, grantlar va oliy ta'limga kirish bo'yicha qo'llanma.",
    icon: GraduationCap,
    kind: "career",
    accentBg: "bg-sky-100",
    accentText: "text-sky-700",
    gradient: "from-sky-500 to-indigo-500",
    usesCategories: false,
  },
  {
    key: "tarixiy_obidalar",
    slug: "tarixiy-obidalar",
    title: "Tarixiy obidalar va muzeylar",
    short: "Buxoro va atrofidagi tarixiy obidalar, muzeylar — ekskursiya qo'llanmasi.",
    icon: Landmark,
    kind: "place",
    accentBg: "bg-rose-100",
    accentText: "text-rose-700",
    gradient: "from-rose-500 to-orange-500",
    usesCategories: true,
  },
];

export function sectionBySlug(slug: string | undefined): SectionMeta | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function sectionByKey(key: string | undefined): SectionMeta | undefined {
  return SECTIONS.find((s) => s.key === key);
}

// DB qator tiplari — public sahifalar va admin uchun qulay qisqartmalar.
export type BilimnomaCategory = Database["public"]["Tables"]["bilimnoma_categories"]["Row"];
export type BilimnomaEntry = Database["public"]["Tables"]["bilimnoma_entries"]["Row"];

// ─── Talab darajasi (demand) — rangli belgi ────────────────────────────────
export type Demand = "growing" | "stable" | "declining";

export const DEMAND_META: Record<Demand, { label: string; badge: string; dot: string }> = {
  growing: {
    label: "Talab o'smoqda",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  stable: {
    label: "Barqaror talab",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
  },
  declining: {
    label: "Talab kamaymoqda",
    badge: "bg-slate-200 text-slate-600",
    dot: "bg-slate-400",
  },
};

export function demandMeta(demand: string | null): (typeof DEMAND_META)[Demand] | null {
  if (demand && demand in DEMAND_META) return DEMAND_META[demand as Demand];
  return null;
}

// ─── Structured details (jsonb) — yozuvning chuqur ma'lumotlari ────────────
export interface EntryDetails {
  what?: string; // nima bilan shug'ullanadi
  skills?: string; // kerakli ko'nikmalar
  subjects?: string; // maktabda muhim fanlar
  study?: string; // qayerda o'qiladi
  fun_fact?: string; // qiziqarli fakt
  extra_label?: string; // maxsus blok sarlavhasi (masalan "Nega yo'qolyapti?")
  extra?: string; // maxsus blok matni
  // ── Chuqurroq kontent (jsonb — migratsiyasiz) ──
  pros?: string[]; // afzalliklari
  cons?: string[]; // kamchiliklari
  day_in_life?: string[]; // bir kunlik hayot (bosqichlar)
  resources?: { label: string; url: string }[]; // foydali resurslar / havolalar (joy: manbalar)
  related?: string[]; // bog'liq kasblar/joylar (sarlavhalari)
  quiz?: string[]; // "senga mosmi?" mini-test gaplari (faqat kasb)
  video_url?: string; // YouTube havolasi (admin qo'shadi)
  gallery?: string[]; // qo'shimcha rasmlar (admin)
  // ── Joy (tarixiy obida/muzey) maydonlari ──
  history?: string; // tarixi (qachon, kim qurgan)
  significance?: string; // ahamiyati / nimasi bilan mashhur
  location?: string; // manzil
  map_url?: string; // Google Maps havolasi
  visit?: string; // tashrif: ish vaqti, chipta, qanday borish
  counselor_tip?: string; // maslahatchi uchun ekskursiya maslahati
  facts?: string[]; // qiziqarli faktlar (bir nechta)
}

// YouTube havolasidan xavfsiz embed URL (youtube-nocookie). Tanimasa null.
export function youtubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  // youtu.be/<id>, watch?v=<id>, /embed/<id>, /shorts/<id>
  const m = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (!m) return null;
  return `https://www.youtube-nocookie.com/embed/${m[1]}`;
}

export interface DetailField {
  key: keyof EntryDetails;
  label: string;
  icon: LucideIcon;
}

// Kasb (career) detal info-tile'lari
export const DETAIL_FIELDS: DetailField[] = [
  { key: "what", label: "Nima bilan shug'ullanadi?", icon: Briefcase },
  { key: "skills", label: "Kerakli ko'nikmalar", icon: Brain },
  { key: "subjects", label: "Maktabda muhim fanlar", icon: BookOpen },
  { key: "study", label: "Qayerda o'qiladi?", icon: GraduationCap },
  { key: "fun_fact", label: "Qiziqarli fakt", icon: Sparkles },
];

// Joy (place) detal info-tile'lari
export const PLACE_FIELDS: DetailField[] = [
  { key: "history", label: "Tarixi", icon: ScrollText },
  { key: "significance", label: "Ahamiyati", icon: Star },
  { key: "location", label: "Manzil", icon: MapPin },
  { key: "visit", label: "Tashrif ma'lumoti", icon: Clock },
];

export function detailFields(kind: SectionKind): DetailField[] {
  return kind === "place" ? PLACE_FIELDS : DETAIL_FIELDS;
}

// ─── Kategoriya ranglar palitrasi (professional, emojisiz) ──────────────────
// Har bir kategoriya tartibi bo'yicha bitta tema oladi (rang + lucide ikon).
export interface CategoryTheme {
  icon: LucideIcon;
  medallion: string; // ikon konteyneri
  bar: string; // yuqori gradient chiziq
  hoverText: string; // sarlavha hover rangi
  chipActive: string; // faol chip
  chipText: string; // faol bo'lmagan chip nuqtasi
  link: string; // "Batafsil" matn rangi
  hero: string; // detal hero gradienti
  soft: string; // yumshoq fon (hero medallion)
}

export const CATEGORY_THEMES: CategoryTheme[] = [
  {
    icon: Rocket,
    medallion: "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100",
    bar: "from-violet-500 to-fuchsia-500",
    hoverText: "group-hover:text-violet-700",
    chipActive: "bg-violet-600 text-white shadow-sm shadow-violet-200",
    chipText: "bg-violet-500",
    link: "text-violet-600",
    hero: "from-violet-600 to-fuchsia-600",
    soft: "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100",
  },
  {
    icon: HeartPulse,
    medallion: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
    bar: "from-emerald-500 to-teal-500",
    hoverText: "group-hover:text-emerald-700",
    chipActive: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
    chipText: "bg-emerald-500",
    link: "text-emerald-600",
    hero: "from-emerald-600 to-teal-600",
    soft: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
  },
  {
    icon: Wheat,
    medallion: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
    bar: "from-amber-500 to-orange-500",
    hoverText: "group-hover:text-amber-700",
    chipActive: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    chipText: "bg-amber-500",
    link: "text-amber-600",
    hero: "from-amber-500 to-orange-500",
    soft: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
  },
  {
    icon: Landmark,
    medallion: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100",
    bar: "from-rose-500 to-pink-500",
    hoverText: "group-hover:text-rose-700",
    chipActive: "bg-rose-600 text-white shadow-sm shadow-rose-200",
    chipText: "bg-rose-500",
    link: "text-rose-600",
    hero: "from-rose-600 to-pink-600",
    soft: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100",
  },
  {
    icon: Hourglass,
    medallion: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
    bar: "from-slate-400 to-slate-500",
    hoverText: "group-hover:text-slate-700",
    chipActive: "bg-slate-700 text-white shadow-sm shadow-slate-200",
    chipText: "bg-slate-400",
    link: "text-slate-600",
    hero: "from-slate-600 to-slate-700",
    soft: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
  },
  {
    icon: Palette,
    medallion: "bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100",
    bar: "from-sky-500 to-indigo-500",
    hoverText: "group-hover:text-sky-700",
    chipActive: "bg-sky-600 text-white shadow-sm shadow-sky-200",
    chipText: "bg-sky-500",
    link: "text-sky-600",
    hero: "from-sky-600 to-indigo-600",
    soft: "bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100",
  },
];

export function categoryTheme(index: number): CategoryTheme {
  const n = CATEGORY_THEMES.length;
  return CATEGORY_THEMES[((index % n) + n) % n];
}

// ─── Kasb → professional lucide ikon (emoji o'rniga) ───────────────────────
export const PROFESSION_ICONS: Record<string, LucideIcon> = {
  "Sun'iy intellekt muhandisi": BrainCircuit,
  "Ma'lumotlar tahlilchisi (Data Scientist)": TrendingUp,
  "Kiberxavfsizlik mutaxassisi": ShieldCheck,
  "Robototexnika muhandisi": Bot,
  "Dasturchi (dasturiy ta'minot muhandisi)": Code,
  "UX/UI dizayner": PenTool,
  "Dron operatori": Drone,
  Shifokor: Stethoscope,
  Hamshira: HeartPulse,
  "O'qituvchi": GraduationCap,
  "Quruvchi-muhandis": HardHat,
  Elektrik: PlugZap,
  Oshpaz: ChefHat,
  "Haydovchi (logistika)": Truck,
  "Fermer (dehqon)": Sprout,
  Chorvador: Beef,
  Tikuvchi: Scissors,
  "Duradgor (mebelchi)": Armchair,
  Novvoy: Croissant,
  "Kulol (kulolchilik)": Amphora,
  "Zardo'z (zardo'zlik)": Gem,
  "Misgar (misgarlik)": Hammer,
  "Ganchkor (ganch o'ymakorligi)": Building2,
  "Naqqosh (naqqoshlik)": Brush,
  "Atlas to'quvchi (ipakchilik)": Shirt,
  "Telefon kommutatori operatori": Phone,
  "Mashinkachi (yozuv mashinkasi)": Keyboard,
  Kinomexanik: Film,
  "Fonarchi (ko'cha chiroqchisi)": Lightbulb,
  "Soatsoz va radiousta": Watch,
  Jurnalist: Newspaper,
  "Kontent-kreator (SMM mutaxassisi)": Smartphone,
  "Grafik dizayner": Palette,
  "Animator (3D rassom)": Clapperboard,
  Fotograf: Camera,
};

export function entryIcon(title: string, fallback: LucideIcon): LucideIcon {
  return PROFESSION_ICONS[title] ?? fallback;
}
