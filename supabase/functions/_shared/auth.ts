// Edge Function'lar uchun umumiy autentifikatsiya/avtorizatsiya yordamchilari:
// chaqiruvchini aniqlash, rolini tekshirish, faoliyat jurnaliga yozish.
import { createClient } from "jsr:@supabase/supabase-js@2";

export type AppRole = "admin" | "counselor" | "student" | "parent";

export interface Caller {
  id: string;
  role: AppRole | null;
  fullName: string | null;
  schoolId: string | null;
}

// Service-role klient — RLS'siz (faqat server ichida ishlatiladi)
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

export type AdminClient = ReturnType<typeof adminClient>;

// Authorization sarlavhasidan chaqiruvchini aniqlaydi va rol/maktabini yuklaydi.
// Xato bo'lsa null qaytaradi — chaqiruvchi funksiya 401 qaytarishi kerak.
export async function getCaller(req: Request, admin: AdminClient): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const anon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error,
  } = await anon.auth.getUser();
  if (error || !user) return null;

  const [{ data: roleRow }, { data: profile }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    admin.from("profiles").select("full_name, school_id").eq("id", user.id).maybeSingle(),
  ]);

  return {
    id: user.id,
    role: (roleRow?.role as AppRole) ?? null,
    fullName: profile?.full_name ?? null,
    schoolId: profile?.school_id ?? null,
  };
}

// Faoliyat jurnaliga yozish. Jurnal xatosi asosiy amalni to'xtatmasligi kerak —
// shuning uchun xato yutiladi (faqat log'ga chiqadi).
export async function logActivity(
  admin: AdminClient,
  entry: {
    actorId: string;
    actorName?: string | null;
    action: string;
    targetId?: string | null;
    targetLabel?: string | null;
    schoolId?: string | null;
    details?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await admin.from("activity_log").insert({
    actor_id: entry.actorId,
    actor_name: entry.actorName ?? null,
    action: entry.action,
    target_id: entry.targetId ?? null,
    target_label: entry.targetLabel ?? null,
    school_id: entry.schoolId ?? null,
    details: entry.details ?? null,
  });
  if (error) console.error("[activity_log] yozib bo'lmadi:", error.message);
}

// O'qilishi oson parol: adashtiruvchi belgilar (0/O, 1/l/I) yo'q
const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
export function generatePassword(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += PASSWORD_CHARS[b % PASSWORD_CHARS.length];
  return out;
}

// Login → tizim email formati (frontend auth.tsx'dagi toStudentEmail bilan bir xil!)
export function toSystemEmail(login: string): string {
  return `${login.toLowerCase().trim()}@edulab.uz`;
}
