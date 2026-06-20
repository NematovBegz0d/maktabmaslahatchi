// O'quvchi profili / hisobotida takrorlanadigan IQ ko'rsatkich yordamchilari.
// my-profile, students.$id (va boshqalar) shu yagona manbadan foydalanadi.

// Radar grafik ranglari (6 ta qobiliyat tartibida)
export const RADAR_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

// Sonli IQ -> qisqa tavsif + Tailwind rang klassi
export function iqLabel(score: number): { text: string; color: string } {
  if (score >= 130) return { text: "A'lo darajali", color: "text-purple-600" };
  if (score >= 115) return { text: "Yuqori", color: "text-blue-600" };
  if (score >= 100) return { text: "O'rtadan yuqori", color: "text-green-600" };
  if (score >= 85) return { text: "O'rtacha", color: "text-yellow-600" };
  return { text: "Rivojlantirilishi kerak", color: "text-red-500" };
}

// ─── Holland (RIASEC) kodi harflari -> ko'rinish (label, tavsif, rang) ───────
// Avval my-profile va students.$id'da takrorlangan edi — endi yagona manba.
export const HOLLAND_INFO: Record<string, { label: string; desc: string; color: string }> = {
  R: {
    label: "Realistik",
    desc: "Amaliy, texnik, jismoniy ish yoqadi",
    color: "bg-orange-100 text-orange-700",
  },
  I: {
    label: "Tadqiqotchi",
    desc: "Tahlil, fan, muammolarni hal qilish",
    color: "bg-blue-100 text-blue-700",
  },
  A: {
    label: "Ijodkor",
    desc: "San'at, ijod, ifoda erkinligi",
    color: "bg-purple-100 text-purple-700",
  },
  S: {
    label: "Ijtimoiy",
    desc: "Odamlar bilan ishlash, yordam berish",
    color: "bg-green-100 text-green-700",
  },
  E: {
    label: "Tadbirkor",
    desc: "Rahbarlik, biznes, ta'sir ko'rsatish",
    color: "bg-red-100 text-red-700",
  },
  C: { label: "Konventsion", desc: "Tartib, tizim, aniqlik", color: "bg-gray-100 text-gray-700" },
};

// ─── Ayzenk temperamentlari -> ko'rinish (emoji, tavsif, kuchli/rivojlanish) ──
export const TEMP_INFO: Record<
  string,
  { emoji: string; desc: string; strong: string; develop: string }
> = {
  Sangvinik: {
    emoji: "😊",
    desc: "Faol, ijtimoiy, xushchaqchaq",
    strong: "Muloqotchanlik, moslashuvchanlik, optimizm",
    develop: "Ishni oxiriga yetkazish, diqqatni jamlash",
  },
  Xolerik: {
    emoji: "⚡",
    desc: "Energik, qizg'in, tashabbuskor",
    strong: "Liderlik, qat'iyatlilik, tez qaror qilish",
    develop: "Sabr-toqat, hissiyotlarni boshqarish",
  },
  Flegmatik: {
    emoji: "🧘",
    desc: "Xotirjam, barqaror, ishonchli",
    strong: "Chidamlilik, diqqatlilik, ishonchlilik",
    develop: "Tashabbuskorlik, o'zgarishlarga moslashish",
  },
  Melanxolik: {
    emoji: "🎨",
    desc: "Sezgir, chuqur fikrlovchi, intiluvchi",
    strong: "Ijodkorlik, tahliliy fikrlash, sezgirlik",
    develop: "O'ziga ishonch, stressni boshqarish",
  },
};
