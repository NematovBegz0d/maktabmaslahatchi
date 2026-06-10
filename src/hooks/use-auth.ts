import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "counselor" | "parent" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
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

  async function fetchRole(_uid: string) {
    try {
      const { data, error } = await supabase.rpc("get_my_role");
      if (error) throw error;
      const r = (data as string | null) ?? "student";
      console.log("[useAuth] role from RPC:", r);
      setRole(r as AppRole);
    } catch (e) {
      console.error("[useAuth] fetchRole error:", e);
      setRole("student");
    } finally {
      setLoading(false);
    }
  }

  return { session, user, role, loading };
}
