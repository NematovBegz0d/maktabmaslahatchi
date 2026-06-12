// school_stats view bilan ishlash — admin paneli sahifalari uchun umumiy
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolStat {
  id: string;
  name: string | null;
  region: string | null;
  district: string | null;
  expected_students: number | null;
  student_count: number | null;
  tested_students: number | null;
  results_30d: number | null;
  last_activity: string | null;
  counselor_id: string | null;
  counselor_name: string | null;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

// Holat belgisi: 🟢 7 kun ichida faollik, 🟡 30 kun ichida, 🔴 undan eski/yo'q
export function schoolStatus(s: SchoolStat): { emoji: string; label: string; rank: number } {
  if (!s.counselor_id) return { emoji: "⚪", label: "Maslahatchi yo'q", rank: 0 };
  if (!s.last_activity) return { emoji: "🔴", label: "Harakatsiz", rank: 1 };
  const age = Date.now() - new Date(s.last_activity).getTime();
  if (age <= 7 * DAY_MS) return { emoji: "🟢", label: "Faol", rank: 3 };
  if (age <= 30 * DAY_MS) return { emoji: "🟡", label: "Sust", rank: 2 };
  return { emoji: "🔴", label: "Harakatsiz", rank: 1 };
}

export function useSchoolStats() {
  return useQuery({
    queryKey: ["school-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_stats").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as SchoolStat[];
    },
  });
}
