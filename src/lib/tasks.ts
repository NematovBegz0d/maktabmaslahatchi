// Vazifalar moduli uchun umumiy yordamchilar (admin va maslahatchi sahifalari)
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Holat → badge ko'rinishi
export function taskStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "submitted":
      return {
        label: "Topshirildi",
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      };
    case "accepted":
      return {
        label: "Qabul qilindi",
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      };
    case "returned":
      return { label: "Qaytarildi", cls: "bg-destructive/10 text-destructive" };
    default:
      return {
        label: "Yangi",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      };
  }
}

// Faoliyat jurnaliga client tomondan yozish. `actor_id`, `actor_name` va
// `school_id` qiymatlari DB trigger (activity_log_stamp_identity) tomonidan
// server tarafida ISHONCHLI manbadan (auth.uid() + profiles) majburan
// to'ldiriladi — client bu maydonlarni soxtalashtira olmaydi. Bu yerda faqat
// `action`, `target_label` va `details` yuboriladi. Xato asosiy oqimni
// to'xtatmaydi (jurnal yozuvi — yordamchi, kritik emas).
export async function logClientActivity(
  actorId: string | undefined,
  action: string,
  targetLabel?: string | null,
  details?: Record<string, Json>,
): Promise<void> {
  if (!actorId) return;
  const { error } = await supabase.from("activity_log").insert({
    actor_id: actorId,
    action,
    target_label: targetLabel ?? null,
    details: details ?? null,
  });
  if (error) console.error("[activity_log]", error.message);
}
