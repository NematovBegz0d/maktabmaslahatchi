import { createContext, useContext, type ReactNode } from "react";

// Hozircha ilova FAQAT o'zbek tilida. Ko'p tillilik (ru va h.k.) keyingi versiyada
// qo'shiladi. Avval yarim-tarjima qilingan ru bloki va til-tanlash (locale switcher)
// bor edi — lekin ilovaning ~75% i hardcode o'zbekcha bo'lgani uchun "ru" amalda
// ishlamasdi (soxta ikki tillilik). Halol bo'lishi uchun ru olib tashlandi; t()
// API'si saqlandi — kelajakda til qo'shish oson bo'lsin.
const messages = {
  // Nav
  nav_dashboard: "Boshqaruv",
  nav_tests: "Testlar",
  nav_profile: "Profil",
  nav_students: "O'quvchilar",
  nav_analytics: "Tahlil",
  nav_clubs: "Klublar",
  nav_social: "Ijtimoiy Portfolio",
  nav_council: "O'quvchilar Kengashi",
  nav_signout: "Chiqish",

  // Auth
  auth_login: "Kirish",
  auth_register: "Ro'yxatdan o'tish",
  auth_email: "Email",
  auth_password: "Parol",
  auth_full_name: "To'liq ism",
  auth_role: "Rol",

  // Dashboard
  dashboard_title: "Boshqaruv paneli",
  dashboard_welcome: "Xush kelibsiz",

  // Tests
  tests_title: "Testlar",
  tests_empty: "Testlar topilmadi",
  tests_start: "Testni boshlash",
  tests_continue: "Davom ettirish",
  tests_completed: "Tugallangan",

  // Students
  students_title: "O'quvchilar",
  students_search: "Ism bo'yicha qidirish...",
  students_empty: "O'quvchilar topilmadi",
  students_total: "Jami",
  students_class: "sinf",

  // Analytics
  analytics_title: "Tahlil va statistika",
  analytics_subtitle: "Maktab bo'yicha umumiy ko'rsatkichlar",
  analytics_students: "O'quvchilar",
  analytics_active: "Faol (test yechgan)",
  analytics_completed_tests: "Yechilgan testlar",
  analytics_avg_completeness: "O'rtacha to'liqlik",

  // Profile
  profile_title: "Mening profilim",
  profile_completeness: "Profil to'liqligi",
  profile_careers: "Tavsiya etilgan kasblar",
  profile_ai_summary: "AI tahlili",

  // Clubs
  clubs_title: "Maktab Klublari",
  clubs_subtitle_staff: "Maktab klublarini boshqaring va o'quvchilarni ro'yxatga oling.",
  clubs_subtitle_student:
    "Qiziqishlaringizga mos klubga qo'shiling va iqtidoringizni rivojlantiring.",
  clubs_total: "Jami klublar",
  clubs_total_members: "Jami a'zolar",
  clubs_top: "Eng faol klub",
  clubs_my_count: "A'zo bo'lgan klublarim",
  clubs_manage: "Boshqarish",
  clubs_view: "Ko'rish",
  clubs_details: "Batafsil",
  clubs_member: "A'zo",
  clubs_members_list: "A'zolar ro'yxati",
  clubs_add_member: "Qo'shish",
  clubs_not_found: "Klub topilmadi.",
  clubs_back: "Klublar",
  clubs_member_count: "a'zo",
  clubs_by_class: "Sinf bo'yicha",
  clubs_empty_members: "Hali a'zo yo'q",
  clubs_search_empty: "Topilmadi",
  clubs_search_name: "Ism bo'yicha...",
  clubs_my_title: "Mening Klublarim",
  clubs_my_subtitle: "A'zo bo'lgan klublaringiz va faoliyat yo'nalishlaringiz.",
  clubs_all: "Barcha klublar",
  clubs_my_empty_title: "Hali hech bir klubga a'zo emassiz",
  clubs_my_empty_desc:
    "Maktab maslahatchiingiz sizni klubga qo'shadi. Quyidagi klublar bilan tanishib chiqing.",
  clubs_view_all: "Klublarni ko'rish",
  clubs_member_added: "A'zo muvaffaqiyatli qo'shildi!",
  clubs_member_removed: "A'zo ro'yxatdan chiqarildi.",
  clubs_remove_title: "A'zoni ro'yxatdan chiqarish",
  clubs_other: "Boshqa klublar",
  clubs_not_member: "Hali hech bir klubga a'zo emassiz.",

  // Council
  council_page_title: "O'quvchilar Kengashi",
  council_subtitle: "Yetakchilik, tashabbuskorlik va jamoaviy ishlash maydoni.",
  council_year: "o'quv yili",
  council_add_activity: "Faoliyat",
  council_add_member: "A'zo qo'shish",
  council_empty_title: "Kengash hali shakllanmagan",
  council_empty_admin: "\"A'zo qo'shish\" tugmasi orqali kengash a'zolarini saylang.",
  council_empty_student: "Tez orada o'quvchilar kengashi a'zolari e'lon qilinadi.",
  council_activities_title: "Kengash faoliyati",
  council_act_empty_admin: 'Hali faoliyat qo\'shilmagan. "Faoliyat" tugmasini bosing.',
  council_act_empty_student: "Hali kengash faoliyati e'lon qilinmagan.",
  council_member_removed: "A'zo o'chirildi.",
  council_activity_removed: "Faoliyat o'chirildi.",

  // Social Portfolio
  sp_title: "Ijtimoiy Portfolio",
  sp_subtitle: "Klublar, yutuqlar va maktabdan tashqari ta'limdagi faolligingiz.",
  sp_engagement: "Ijtimoiy faollik darajasi",
  sp_clubs: "Klublar",
  sp_achievements: "Yutuqlar",
  sp_achievements_title: "Yutuqlar va sertifikatlar",
  sp_active_activity: "Faol mashg'ulot",
  sp_extracurricular: "Maktabdan tashqari ta'lim",
  sp_no_clubs: "Hali hech bir klubga a'zo emas.",
  sp_no_ach_admin: "Hali yutuq qo'shilmagan. \"Qo'shish\" tugmasini bosing.",
  sp_no_ach_student: "Hali yutuqlar qo'shilmagan.",
  sp_no_enr_admin: "Hali mashg'ulot qo'shilmagan. \"Qo'shish\" tugmasini bosing.",
  sp_no_enr_student: "Hali maktabdan tashqari ta'limga jalb etilmagan.",
  sp_achievement_removed: "Yutuq o'chirildi.",
  sp_enrollment_removed: "Mashg'ulot o'chirildi.",
  sp_level_basic: "Boshlang'ich",
  sp_level_mid: "O'rtacha",
  sp_level_active: "Faol",
  sp_level_high: "Yuqori faol",

  // General
  loading: "Yuklanmoqda...",
  error: "Xatolik yuz berdi",
  try_again: "Qayta urinish",
  go_home: "Bosh sahifaga",
  save: "Saqlash",
  cancel: "Bekor qilish",
  close: "Yopish",
  back: "Orqaga",
  next: "Keyingi",
  previous: "Oldingi",
  page: "Sahifa",
  add: "Qo'shish",
  delete_error: "O'chirishda xatolik.",
  no_permission: "Sizda bu amalni bajarish uchun ruxsat yo'q.",
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof messages;

interface I18nContextValue {
  t: (key: TranslationKey) => string;
}

function translate(key: TranslationKey): string {
  return messages[key] ?? key;
}

const I18nContext = createContext<I18nContextValue>({ t: translate });

export function I18nProvider({ children }: { children: ReactNode }) {
  // Til o'zgarmaydi (uz-only) — t() to'g'ridan-to'g'ri o'zbekcha qaytaradi.
  return <I18nContext.Provider value={{ t: translate }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
