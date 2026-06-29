// Maslahatchi bildirishnomalari — data-qatlami (UI'dan ajratilgan).
//
// Barcha hisoblash SERVER tomonida (public.counselor_dashboard RPC) bajariladi:
// jadvallarni brauzerga tortish o'rniga bitta so'rovda tayyor raqamlar keladi.
// RPC SECURITY INVOKER — RLS chaqiruvchining O'Z maktabi bilan chegaralaydi.
// (Avval 11 ta to'liq-jadval so'rovi yuborilardi va PostgREST 1000 qator
//  limitida masshtabda noto'g'ri sanardi — endi bartaraf etilgan.)
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { CLUBS_STATIC } from "@/types/clubs";
import { buildCounselorNotifications, type CounselorNotification } from "@/lib/notifications";

// Nizomda majburiy ko'rsatilgan 7 to'garak (CLUBS_STATIC — kanonik nomlar)
const REQUIRED_CLUB_NAMES = CLUBS_STATIC.map((c) => c.name);

// counselor_dashboard() RPC qaytaradigan jamlama (jsonb).
interface CounselorDashboard {
  studentCount: number;
  untestedCount: number;
  clubCount: number;
  emptyClubNames: string[];
  existingClubNames: string[];
  studentsWithoutClub: number;
  pendingTasks: number;
  unreadAnnouncements: number;
  councilMembers: number;
  studentsWithoutPortfolio: number;
  careerUnoriented79: number;
}

export function useCounselorNotifications() {
  const { user, role } = useAuth();
  const enabled = !!user && role === "counselor";

  return useQuery<CounselorNotification[]>({
    queryKey: ["counselor-notifications", user?.id],
    enabled,
    staleTime: 60_000, // header'da har sahifada turadi — 1 daqiqa kesh yetarli
    queryFn: async () => {
      const d = unwrap(await supabase.rpc("counselor_dashboard")) as unknown as CounselorDashboard;

      // Majburiy 7 to'garakdan mavjud bo'lmaganlari (nom bo'yicha, registrga befarq).
      // Bu yagona client-side mantiq — chunki majburiy ro'yxat (CLUBS_STATIC) front'da.
      const existingClubNames = new Set(
        (d.existingClubNames ?? []).map((n) => (n ?? "").trim().toLowerCase()),
      );
      const missingRequiredClubs = REQUIRED_CLUB_NAMES.filter(
        (name) => !existingClubNames.has(name.toLowerCase()),
      );

      return buildCounselorNotifications({
        studentCount: d.studentCount ?? 0,
        untestedCount: d.untestedCount ?? 0,
        clubCount: d.clubCount ?? 0,
        emptyClubNames: d.emptyClubNames ?? [],
        studentsWithoutClub: d.studentsWithoutClub ?? 0,
        pendingTasks: d.pendingTasks ?? 0,
        unreadAnnouncements: d.unreadAnnouncements ?? 0,
        councilMembers: d.councilMembers ?? 0,
        missingRequiredClubs,
        studentsWithoutPortfolio: d.studentsWithoutPortfolio ?? 0,
        careerUnoriented79: d.careerUnoriented79 ?? 0,
      });
    },
  });
}
