import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Faqat 3 ta haqiqiy rol ishlatiladi. DB enum'ida 'parent' qiymati ham bor, lekin
// hech qayerda ishlatilmaydi (uni enum'dan olib tashlash yuqori xavf — qoldirilgan).
export type AppRole = "student" | "counselor" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Rolni yuklashda xatolik — bo'lsa rolni TAXMIN QILMAYMIZ (pastga qarang)
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Oldin mavjud sessionni olish
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchRole(s.user.id);
      } else {
        setLoading(false);
      }
    });

    // Session o'zgarganda (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchRole(s.user.id);
      } else {
        setRole(null);
        setSchoolId(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(uid: string) {
    setError(null);
    try {
      const [{ data, error: roleErr }, { data: profile, error: profErr }] = await Promise.all([
        supabase.rpc("get_my_role"),
        supabase.from("profiles").select("school_id").eq("id", uid).maybeSingle(),
      ]);
      if (roleErr) throw roleErr;
      if (profErr) throw profErr;
      // RPC null qaytarsa — rol yozuvi yo'q (yangi foydalanuvchi) → student.
      // Bu legitim holat (xato emas), shuning uchun default beriladi.
      setRole(((data as string | null) ?? "student") as AppRole);
      setSchoolId(profile?.school_id ?? null);
    } catch (e) {
      // MUHIM: xatoda rolni "student" deb TAXMIN QILMAYMIZ — aks holda vaqtinchalik
      // tarmoq uzilishida admin/maslahatchi o'quvchi ko'rinishiga tushib qolardi.
      // O'rniga xatoni belgilaymiz; ProtectedRoute qayta urinish taklif qiladi.
      console.error("[useAuth] fetchRole error:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
      setRole(null);
      setSchoolId(null);
    } finally {
      setLoading(false);
    }
  }

  // Rol xatosidan keyin qayta urinish (ProtectedRoute tugmasi chaqiradi)
  function retry() {
    if (user) {
      setLoading(true);
      fetchRole(user.id);
    }
  }

  // isStaff — maktab kontentini boshqaradigan rollar (maslahatchi va super admin)
  const isStaff = role === "admin" || role === "counselor";

  return { session, user, role, schoolId, isStaff, loading, error, retry };
}
