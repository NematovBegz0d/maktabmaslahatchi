import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";

// ─── O'quvchi profili tiplari (my-profile sahifasi ishlatadi) ───────────────
export interface RadarItem {
  skill: string;
  value: number;
}
export interface IqItem {
  type: string;
  score: number;
}
export interface TopCareer {
  id: string;
  name_uz: string;
  description: string | null;
  required_skills: string[];
  salary_range: string | null;
  universities?: { name: string; city?: string }[];
}
export interface ResultRow {
  id: string;
  test_id: string;
  holland_code: string | null;
  personality_type: string | null;
  raw_scores: Record<string, number> | null;
  scaled_scores: Record<string, number> | null;
  created_at: string;
  tests: { name_uz: string | null; category?: string | null; test_type?: string | null } | null;
}
export interface ClubMembership {
  id: string;
  joined_at: string;
  clubs: { id: string; name: string; icon: string; color: string } | null;
}
export interface AllTest {
  id: string;
  name_uz: string | null;
  category?: string | null;
}
export type SchoolRef = { name?: string; region?: string } | null;

// O'quvchi profilining barcha ma'lumotlarini (profil, yig'ma profil, natijalar,
// klublar, testlar) bitta joydan yuklaydi. UI'dan ajratilgan data-qatlam.
export function useMyProfileData(userId: string | undefined) {
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile-full", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("profiles")
          .select("*, schools(name, region)")
          .eq("id", userId!)
          .maybeSingle(),
      ),
  });

  const { data: sp, isLoading: spLoading } = useQuery({
    queryKey: ["student-profile", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("student_profiles")
          .select("radar_scores, iq_scores, top_careers, profile_completeness, ai_summary")
          .eq("student_id", userId!)
          .maybeSingle(),
      ),
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["my-results-full", userId],
    enabled: !!userId,
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("test_results")
          .select(
            "id, test_id, holland_code, personality_type, raw_scores, scaled_scores, created_at, tests(name_uz, category, test_type)",
          )
          .eq("student_id", userId!)
          .order("created_at", { ascending: false }),
      );
      return (data ?? []) as ResultRow[];
    },
  });

  // Distinct key: my-clubs sahifasi ["my-clubs-detail", uid] dan foydalanadi
  const { data: myClubs } = useQuery({
    queryKey: ["my-clubs-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("club_members")
          .select("id, joined_at, clubs(*)")
          .eq("student_id", userId!)
          .order("joined_at", { ascending: false }),
      );
      return (data ?? []) as ClubMembership[];
    },
  });

  const { data: allTests } = useQuery({
    queryKey: ["all-tests"],
    queryFn: async () => {
      const data = unwrap(
        await supabase.from("tests").select("id, name_uz, category").eq("is_active", true),
      );
      return (data ?? []) as AllTest[];
    },
  });

  return {
    profile,
    sp,
    results,
    myClubs,
    allTests,
    loading: profileLoading || spLoading || resultsLoading,
    isError,
    refetch,
  };
}
