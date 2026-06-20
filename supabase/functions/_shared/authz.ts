// ===================================================================
// EduLens — Edge funksiyalar uchun sof avtorizatsiya qarorlari
// DB I/O YO'Q — faqat qaror mantig'i, shuning uchun vitest bilan to'liq
// test qilinadi (xuddi complete.ts kabi). Chaqiruvchi funksiya kerakli
// ma'lumotni (caller roli/maktabi, target maktabi) yuklab beradi.
// ===================================================================

export type AuthzRole = "admin" | "counselor" | "student" | null;

export interface AuthzCaller {
  id: string;
  role: AuthzRole;
  schoolId: string | null;
}

// AI tahlil (analyze-profile) chaqirishga ruxsatmi?
//   • o'zi uchun           → har doim ha
//   • admin (super admin)  → istalgan o'quvchi uchun ha (global)
//   • counselor            → FAQAT o'z maktabi o'quvchisi uchun
//   • student / noaniq rol → boshqa o'quvchi uchun yo'q
// MUHIM: counselor maktabsiz (schoolId NULL) bo'lsa — yo'q (fail-closed),
// va target maktabsiz bo'lsa ham mos kelmaydi.
export function canAnalyze(
  caller: AuthzCaller,
  targetSchoolId: string | null,
  targetIsSelf: boolean,
): boolean {
  if (targetIsSelf) return true;
  if (caller.role === "admin") return true;
  if (caller.role === "counselor") {
    return caller.schoolId != null && caller.schoolId === targetSchoolId;
  }
  return false;
}
