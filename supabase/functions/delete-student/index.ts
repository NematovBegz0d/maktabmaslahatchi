// O'quvchini butunlay o'chirish.
//   admin     — istalgan o'quvchini o'chira oladi
//   counselor — FAQAT o'z maktabidagi o'quvchini o'chira oladi
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getCaller, logActivity } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);
  if (caller.role !== "admin" && caller.role !== "counselor") {
    return jsonResponse({ error: "Forbidden: faqat maslahatchi yoki admin" }, 403);
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON formatda yuborish kerak" }, 400);
  }
  const studentId = body?.student_id;
  if (!studentId) return jsonResponse({ error: "student_id majburiy" }, 400);

  // O'zini o'chirishga yo'l qo'ymaymiz
  if (studentId === caller.id) return jsonResponse({ error: "O'zingizni o'chira olmaysiz" }, 400);

  // Maqsadli foydalanuvchi rolini tekshiramiz — faqat o'quvchini o'chirish mumkin
  const { data: targetRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", studentId)
    .maybeSingle();
  if (targetRole?.role === "admin")
    return jsonResponse({ error: "Adminni o'chirib bo'lmaydi" }, 403);
  if (targetRole?.role === "counselor" && caller.role !== "admin") {
    return jsonResponse({ error: "Maslahatchini faqat super admin o'chira oladi" }, 403);
  }

  // Maktab chegarasi: maslahatchi faqat o'z maktabi o'quvchisini o'chiradi
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("full_name, school_id")
    .eq("id", studentId)
    .maybeSingle();
  if (caller.role === "counselor") {
    if (!caller.schoolId || targetProfile?.school_id !== caller.schoolId) {
      return jsonResponse({ error: "Bu o'quvchi sizning maktabingizga tegishli emas" }, 403);
    }
  }

  // Butunlay o'chirish: auth.users o'chsa barcha bog'liq ma'lumot CASCADE bo'ladi
  const { error: delErr } = await admin.auth.admin.deleteUser(studentId);
  if (delErr) return jsonResponse({ error: delErr.message }, 400);

  await logActivity(admin, {
    actorId: caller.id,
    actorName: caller.fullName,
    action: "student_deleted",
    targetId: studentId,
    targetLabel: targetProfile?.full_name ?? null,
    schoolId: targetProfile?.school_id ?? caller.schoolId,
  });

  return jsonResponse({ ok: true });
});
