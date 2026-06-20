import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";

// students.$id sahifasi uchun data-qatlam (UI'dan ajratilgan) — use-my-profile uslubida.
export interface DetailResult {
  id: string;
  test_id: string;
  holland_code: string | null;
  personality_type: string | null;
  raw_scores: Record<string, number> | null;
  scaled_scores: Record<string, number> | null;
  created_at: string;
  tests: { name_uz: string | null; category?: string | null; test_type?: string | null } | null;
}
export interface DetailTest {
  id: string;
  name_uz: string | null;
}

export function useStudentDetail(id: string) {
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["student-detail-profile", id],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("profiles")
          .select("*, schools(name, region, district)")
          .eq("id", id)
          .maybeSingle(),
      ),
  });

  const { data: sp } = useQuery({
    queryKey: ["student-detail-sp", id],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("student_profiles")
          .select("radar_scores, iq_scores, top_careers, profile_completeness, ai_summary")
          .eq("student_id", id)
          .maybeSingle(),
      ),
  });

  const { data: results } = useQuery({
    queryKey: ["student-detail-results", id],
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("test_results")
          .select(
            "id, test_id, holland_code, personality_type, raw_scores, scaled_scores, created_at, tests(name_uz, category, test_type)",
          )
          .eq("student_id", id)
          .order("created_at", { ascending: false }),
      );
      return (data ?? []) as DetailResult[];
    },
  });

  const { data: allTests } = useQuery({
    queryKey: ["all-tests"],
    queryFn: async () => {
      const data = unwrap(await supabase.from("tests").select("id, name_uz").eq("is_active", true));
      return (data ?? []) as DetailTest[];
    },
  });

  return { profile, sp, results, allTests, isLoading, isError, refetch };
}
