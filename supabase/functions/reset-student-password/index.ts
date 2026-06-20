// O'quvchi parolini tiklash — yangi parol generatsiya qilib (yoki berilganini qo'yib)
// javobda BIR MARTA qaytaradi (offline tarqatish uchun).
//   admin     — istalgan o'quvchining parolini tiklaydi
//   counselor — FAQAT o'z maktabidagi o'quvchining
// Sabab: o'quvchi emaili soxta @edulab.uz domenida — Supabase'ning standart
// "parolni unutdim" oqimi ishlamaydi, shuning uchun tiklash faqat shu funksiya orqali.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  adminClient,
  generatePassword,
  getCaller,
  logActivity,
  withinRateLimit,
} from "../_shared/auth.ts";

interface Body {
  student_id?: string;
  password?: string; // ixtiyoriy — berilmasa generatsiya qilinadi
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);
  if (caller.role !== "admin" && caller.role !== "counselor") {
    return jsonResponse({ error: "Forbidden: faqat maslahatchi yoki admin" }, 403);
  }

  // Rate-limit: soatiga 60 ta parol tiklash
  if (!(await withinRateLimit(admin, caller.id, "student_password_reset", 60))) {
    return jsonResponse(
      { error: "Juda ko'p so'rov. Bir soatdan so'ng qayta urinib ko'ring." },
      429,
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON formatda yuborish kerak" }, 400);
  }

  const studentId = body.student_id;
  if (!studentId) return jsonResponse({ error: "student_id majburiy" }, 400);

  // Maqsadli foydalanuvchi rolini tekshiramiz — faqat o'quvchining parolini tiklash mumkin
  // (maslahatchi/admin parolini bu funksiya orqali tiklab bo'lmaydi — manage-counselor bor)
  const { data: targetRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", studentId)
    .maybeSingle();
  if (targetRole?.role !== "student") {
    return jsonResponse({ error: "Faqat o'quvchining parolini tiklash mumkin" }, 403);
  }

  // Maktab chegarasi: maslahatchi faqat o'z maktabi o'quvchisiniki
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("full_name, school_id, passport_series")
    .eq("id", studentId)
    .maybeSingle();
  if (!targetProfile) return jsonResponse({ error: "O'quvchi topilmadi" }, 404);
  if (caller.role === "counselor") {
    if (!caller.schoolId || targetProfile.school_id !== caller.schoolId) {
      return jsonResponse({ error: "Bu o'quvchi sizning maktabingizga tegishli emas" }, 403);
    }
  }

  // Ixtiyoriy maxsus parol; bo'lmasa generatsiya. Supabase minimal uzunligi — 6.
  const password = body.password?.trim() || generatePassword(8);
  if (password.length < 6) {
    return jsonResponse({ error: "Parol kamida 6 belgidan iborat bo'lsin" }, 400);
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(studentId, { password });
  if (updErr) return jsonResponse({ error: updErr.message }, 400);

  await logActivity(admin, {
    actorId: caller.id,
    actorName: caller.fullName,
    action: "student_password_reset",
    targetId: studentId,
    targetLabel: targetProfile.full_name ?? null,
    schoolId: targetProfile.school_id ?? caller.schoolId,
  });

  return jsonResponse({
    ok: true,
    student: {
      id: studentId,
      full_name: targetProfile.full_name ?? null,
      login: targetProfile.passport_series ?? null,
      password, // bir martalik ko'rsatish uchun — maslahatchi o'quvchiga beradi
    },
  });
});
