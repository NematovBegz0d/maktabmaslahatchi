// Maslahatchi uchun "bajariladigan ishlar" bildirishnomalari — SOF mantiq.
//
// Bu bildirishnomalar DB'da SAQLANMAYDI: ular maslahatchining joriy ish
// holatidan (o'quvchilar, testlar, to'garaklar, vazifalar) jonli HISOBLANADI.
// Maslahatchi ishni bajarsa — tegishli bildirishnoma o'zi yo'qoladi.
//
// Bu yerda React/Supabase yo'q — toza funksiya, Vitest bilan to'liq qoplangan.

export type NotifSeverity = "action" | "warning" | "info";

// TanStack Router'da mavjud, maslahatchiga ochiq route'lar
export type NotifRoute = "/students" | "/students-manage" | "/clubs" | "/tasks" | "/council";

export interface CounselorNotification {
  /** Barqaror kalit — "o'qildi" holatini kuzatish uchun (signaturedan farqli) */
  id: string;
  /** Qiymat o'zgarganini aniqlash uchun imzo (masalan, son) — o'zgarsa qayta "yangi" bo'ladi */
  signature: string;
  severity: NotifSeverity;
  title: string;
  body: string;
  to: NotifRoute;
}

export interface CounselorNotifInput {
  /** Maktabdagi o'quvchilar soni */
  studentCount: number;
  /** Kamida 1 ta test topshirmagan o'quvchilar soni */
  untestedCount: number;
  /** Maktab to'garaklari soni */
  clubCount: number;
  /** A'zosi yo'q to'garaklar nomlari */
  emptyClubNames: string[];
  /** Hech bir to'garakka yozilmagan o'quvchilar soni */
  studentsWithoutClub: number;
  /** Admindan biriktirilgan, hali topshirilmagan vazifalar ('assigned' | 'returned') */
  pendingTasks: number;
  /** O'qilmagan e'lon/xabarlar soni */
  unreadAnnouncements: number;
  /** O'quvchilar kengashi a'zolari soni (school-scoped) */
  councilMembers: number;
  /** Nizomda majburiy 7 to'garakdan hali ochilmaganlari nomi */
  missingRequiredClubs: string[];
  /** Ijtimoiy portfoliosi bo'sh (yutuq/mashg'ulot yo'q) o'quvchilar soni */
  studentsWithoutPortfolio: number;
  /** Kasb profili (top_careers) shakllanmagan 7-9 sinf o'quvchilari soni */
  careerUnoriented79: number;
}

const SEVERITY_ORDER: Record<NotifSeverity, number> = { action: 0, warning: 1, info: 2 };

function previewNames(names: string[], max = 2): string {
  const head = names.slice(0, max).join(", ");
  return names.length > max ? `${head} +${names.length - max}` : head;
}

/**
 * Maslahatchining joriy holatidan bajariladigan ishlar ro'yxatini quradi.
 * Eng muhimi (action) yuqorida, keyin warning, keyin info.
 * Bir-biriga zid signallar berilmaydi (masalan, o'quvchi yo'q bo'lsa
 * "test topshirmaganlar" ko'rsatilmaydi).
 */
export function buildCounselorNotifications(i: CounselorNotifInput): CounselorNotification[] {
  const out: CounselorNotification[] = [];

  // ── O'quvchilar / test holati ──
  if (i.studentCount === 0) {
    out.push({
      id: "students-empty",
      signature: "students:0",
      severity: "action",
      title: "O'quvchilarni kiriting",
      body: "Maktabingizda hali bironta o'quvchi yo'q. Avval o'quvchilarni qo'shing.",
      to: "/students-manage",
    });
  } else if (i.untestedCount > 0) {
    out.push({
      id: "students-untested",
      signature: `untested:${i.untestedCount}`,
      severity: "warning",
      title: `${i.untestedCount} o'quvchi test topshirmagan`,
      body: "Bu o'quvchilar hali bironta psixologik test yechmagan — ularni testga yo'naltiring.",
      to: "/students",
    });
  }

  // ── Kasbga yo'naltirish: "Mening kelajakdagi kasbim" (7-9 sinf) ──
  if (i.studentCount > 0 && i.careerUnoriented79 > 0) {
    out.push({
      id: "career-79",
      signature: `career79:${i.careerUnoriented79}`,
      severity: "warning",
      title: `${i.careerUnoriented79} ta 7-9 sinf o'quvchisi kasbga yo'naltirilmagan`,
      body: '"Mening kelajakdagi kasbim" — bu o\'quvchilarning kasb profili shakllanmagan.',
      to: "/students",
    });
  }

  // ── To'garak holati ──
  if (i.clubCount === 0) {
    out.push({
      id: "clubs-empty",
      signature: "clubs:0",
      severity: "action",
      title: "To'garak tashkil qiling",
      body: "Maktabingizda hali to'garak ochilmagan. Birinchi to'garakni yarating.",
      to: "/clubs",
    });
  } else {
    if (i.emptyClubNames.length > 0) {
      out.push({
        id: "clubs-no-members",
        signature: `emptyclubs:${i.emptyClubNames.length}`,
        severity: "warning",
        title: `${i.emptyClubNames.length} to'garakda a'zo yo'q`,
        body: `${previewNames(i.emptyClubNames)} — bu to'garaklarga o'quvchilarni yozing.`,
        to: "/clubs",
      });
    }
    // Nizomda nomma-nom ko'rsatilgan majburiy to'garaklar
    if (i.missingRequiredClubs.length > 0) {
      out.push({
        id: "clubs-missing-required",
        signature: `reqclubs:${i.missingRequiredClubs.length}`,
        severity: "warning",
        title: `Majburiy to'garaklardan ${i.missingRequiredClubs.length} tasi ochilmagan`,
        body: `${previewNames(i.missingRequiredClubs)} — nizomda ko'rsatilgan to'garaklarni oching.`,
        to: "/clubs",
      });
    }
    // "O'quvchilarni to'garakka yozish" — foydalanuvchining asl maqsadi.
    // (Maslahatchi to'garaklarga arizalar oqimini ko'rmaydi; bu — RLS'ga mos,
    //  haqiqiy va amaliy muqobil signal.)
    if (i.studentCount > 0 && i.studentsWithoutClub > 0) {
      out.push({
        id: "students-no-club",
        signature: `noclub:${i.studentsWithoutClub}`,
        severity: "info",
        title: `${i.studentsWithoutClub} o'quvchi to'garakka yozilmagan`,
        body: "Hech bir to'garakka a'zo bo'lmagan o'quvchilarni to'garaklarga jalb qiling.",
        to: "/clubs",
      });
    }
  }

  // ── O'quvchilar kengashi ──
  if (i.councilMembers === 0) {
    out.push({
      id: "council-empty",
      signature: "council:0",
      severity: "action",
      title: "O'quvchilar kengashi tuzilmagan",
      body: "Kengash saylovini o'tkazib, a'zolarni kiriting.",
      to: "/council",
    });
  }

  // ── Ijtimoiy portfolio (maktabdan tashqari ta'lim + yutuqlar) ──
  if (i.studentCount > 0 && i.studentsWithoutPortfolio > 0) {
    out.push({
      id: "portfolio-empty",
      signature: `portfolio:${i.studentsWithoutPortfolio}`,
      severity: "info",
      title: `${i.studentsWithoutPortfolio} o'quvchining ijtimoiy portfoliosi bo'sh`,
      body: "Maktabdan tashqari ta'lim va yutuqlarini kiriting (o'quvchi profili orqali).",
      to: "/students",
    });
  }

  // ── Admin vazifalari / e'lonlari ──
  if (i.pendingTasks > 0) {
    out.push({
      id: "tasks-pending",
      signature: `tasks:${i.pendingTasks}`,
      severity: "action",
      title: `${i.pendingTasks} ta bajarilmagan vazifa`,
      body: "Administratordan biriktirilgan vazifalarni bajarib, topshiring.",
      to: "/tasks",
    });
  }
  if (i.unreadAnnouncements > 0) {
    out.push({
      id: "announcements-unread",
      signature: `ann:${i.unreadAnnouncements}`,
      severity: "info",
      title: `${i.unreadAnnouncements} ta o'qilmagan e'lon`,
      body: "Administratordan kelgan yangi e'lonlarni o'qing.",
      to: "/tasks",
    });
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ── "Ko'rilgan" holatini kuzatish (DB'siz, localStorage uchun sof yordamchilar) ──
// id → signature xaritasi: qaysi bildirishnoma qaysi qiymatda ko'rilgani.
export type SeenMap = Record<string, string>;

/** Hali ko'rilmagan (yangi yoki qiymati o'zgargan) bildirishnomalar soni. */
export function countUnseen(items: CounselorNotification[], seen: SeenMap): number {
  return items.filter((n) => seen[n.id] !== n.signature).length;
}

/** Joriy bildirishnomalardan "ko'rilgan" xaritasini quradi (id → signature). */
export function seenSnapshot(items: CounselorNotification[]): SeenMap {
  return Object.fromEntries(items.map((n) => [n.id, n.signature]));
}
