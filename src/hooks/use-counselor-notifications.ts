// Maslahatchi bildirishnomalari — data-qatlami (UI'dan ajratilgan).
//
// Hammasi maslahatchining O'Z maktabi doirasida (RLS himoyasi ostida) o'qiladi:
//   student_directory, test_results, clubs, club_members  → in_my_school / school_id
//   task_assignments, messages, message_reads             → o'ziniki + e'lonlar
// Hech qanday yangi jadval/edge funksiya kerak emas — toza derived feed.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { CLUBS_STATIC } from "@/types/clubs";
import { buildCounselorNotifications, type CounselorNotification } from "@/lib/notifications";

// Nizomda majburiy ko'rsatilgan 7 to'garak (CLUBS_STATIC — kanonik nomlar)
const REQUIRED_CLUB_NAMES = CLUBS_STATIC.map((c) => c.name);
const CAREER_GRADES = [7, 8, 9];

export function useCounselorNotifications() {
  const { user, role } = useAuth();
  const enabled = !!user && role === "counselor";

  return useQuery<CounselorNotification[]>({
    queryKey: ["counselor-notifications", user?.id],
    enabled,
    staleTime: 60_000, // header'da har sahifada turadi — 1 daqiqa kesh yetarli
    queryFn: async () => {
      const [
        students,
        results,
        clubs,
        members,
        assignments,
        messages,
        reads,
        council,
        profiles,
        enrollments,
        achievements,
      ] = await Promise.all([
        supabase.from("student_directory").select("id, class_number"),
        supabase.from("test_results").select("student_id"),
        supabase.from("clubs").select("id, name"),
        supabase.from("club_members").select("student_id, club_id"),
        supabase.from("task_assignments").select("status").eq("counselor_id", user!.id),
        supabase.from("messages").select("id"),
        supabase.from("message_reads").select("message_id").eq("user_id", user!.id),
        supabase.from("council_members").select("id"),
        supabase.from("student_profiles").select("student_id, top_careers"),
        supabase.from("extracurricular_enrollments").select("student_id"),
        supabase.from("student_achievements").select("student_id"),
      ]);

      const studentRows = (unwrap(students) ?? []) as { id: string; class_number: number | null }[];
      const studentIds = studentRows.map((s) => s.id);
      const testedSet = new Set((unwrap(results) ?? []).map((r) => r.student_id as string));
      const clubRows = (unwrap(clubs) ?? []) as { id: string; name: string }[];
      const memberRows = (unwrap(members) ?? []) as { student_id: string; club_id: string }[];
      const assignRows = (unwrap(assignments) ?? []) as { status: string }[];
      const msgRows = (unwrap(messages) ?? []) as { id: string }[];
      const readSet = new Set((unwrap(reads) ?? []).map((r) => r.message_id as string));
      const councilRows = (unwrap(council) ?? []) as { id: string }[];
      const profileRows = (unwrap(profiles) ?? []) as {
        student_id: string;
        top_careers: unknown;
      }[];
      const enrollRows = (unwrap(enrollments) ?? []) as { student_id: string }[];
      const achieveRows = (unwrap(achievements) ?? []) as { student_id: string }[];

      const clubsWithMembers = new Set(memberRows.map((m) => m.club_id));
      const studentsInClub = new Set(memberRows.map((m) => m.student_id));

      // Majburiy 7 to'garakdan mavjud bo'lmaganlari (nom bo'yicha, registrga befarq)
      const existingClubNames = new Set(clubRows.map((c) => (c.name ?? "").trim().toLowerCase()));
      const missingRequiredClubs = REQUIRED_CLUB_NAMES.filter(
        (name) => !existingClubNames.has(name.toLowerCase()),
      );

      // Ijtimoiy portfolio: yutug'i yoki maktabdan tashqari mashg'uloti bor o'quvchilar
      const portfolioStudents = new Set([
        ...enrollRows.map((e) => e.student_id),
        ...achieveRows.map((a) => a.student_id),
      ]);

      // Kasb profili shakllangan (top_careers bo'sh emas) o'quvchilar
      const careerProfiled = new Set(
        profileRows
          .filter((p) => Array.isArray(p.top_careers) && p.top_careers.length > 0)
          .map((p) => p.student_id),
      );

      return buildCounselorNotifications({
        studentCount: studentIds.length,
        untestedCount: studentIds.filter((id) => !testedSet.has(id)).length,
        clubCount: clubRows.length,
        emptyClubNames: clubRows.filter((c) => !clubsWithMembers.has(c.id)).map((c) => c.name),
        studentsWithoutClub: studentIds.filter((id) => !studentsInClub.has(id)).length,
        pendingTasks: assignRows.filter((a) => a.status === "assigned" || a.status === "returned")
          .length,
        unreadAnnouncements: msgRows.filter((m) => !readSet.has(m.id)).length,
        councilMembers: councilRows.length,
        missingRequiredClubs,
        studentsWithoutPortfolio: studentIds.filter((id) => !portfolioStudents.has(id)).length,
        careerUnoriented79: studentRows.filter(
          (s) =>
            s.class_number != null &&
            CAREER_GRADES.includes(s.class_number) &&
            !careerProfiled.has(s.id),
        ).length,
      });
    },
  });
}
