import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "counselor" | "parent" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(uid: string) {
    try {
      const [{ data, error }, { data: profile }] = await Promise.all([
        supabase.rpc("get_my_role"),
        supabase.from("profiles").select("school_id").eq("id", uid).maybeSingle(),
      ]);
      if (error) throw error;
      const r = (data as string | null) ?? "student";
      console.log("[useAuth] role from RPC:", r);
      setRole(r as AppRole);
      setSchoolId(profile?.school_id ?? null);
    } catch (e) {
      console.error("[useAuth] fetchRole error:", e);
      setRole("student");
    } finally {
      setLoading(false);
    }
  }

  // isStaff — maktab kontentini boshqaradigan rollar (maslahatchi va super admin)
  const isStaff = role === "admin" || role === "counselor";

  return { session, user, role, schoolId, isStaff, loading };
}
