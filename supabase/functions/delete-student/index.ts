import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const admin = createClient(supabaseUrl, serviceKey);
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Chaqiruvchini aniqlash
  const { data: { user }, error: authErr } = await caller.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  // Faqat admin
  const { data: callerRole } = await admin
    .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (callerRole?.role !== "admin") return json({ error: "Forbidden: faqat admin" }, 403);

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ error: "JSON formatda yuborish kerak" }, 400); }
  const studentId = body?.student_id;
  if (!studentId) return json({ error: "student_id majburiy" }, 400);

  // O'zini o'chirishga yo'l qo'ymaymiz
  if (studentId === user.id) return json({ error: "O'zingizni o'chira olmaysiz" }, 400);

  // Maqsadli foydalanuvchi admin bo'lsa — bloklaymiz
  const { data: targetRole } = await admin
    .from("user_roles").select("role").eq("user_id", studentId).maybeSingle();
  if (targetRole?.role === "admin") return json({ error: "Adminni o'chirib bo'lmaydi" }, 403);

  // Butunlay o'chirish: auth.users o'chsa barcha bog'liq ma'lumot CASCADE bo'ladi
  const { error: delErr } = await admin.auth.admin.deleteUser(studentId);
  if (delErr) return json({ error: delErr.message }, 400);

  return json({ ok: true });
});
