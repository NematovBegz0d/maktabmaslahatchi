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
