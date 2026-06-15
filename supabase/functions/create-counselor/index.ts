// Maslahatchi akkauntini yaratish — FAQAT super admin.
// Body: { full_name, school_id, login? | email?, password? }
//   - email berilsa o'sha ishlatiladi; bo'lmasa login → login@edulab.uz
//   - password berilmasa avtomatik generatsiya qilinadi va javobda qaytariladi
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  adminClient,
  generatePassword,
  getCaller,
  logActivity,
  toSystemEmail,
  withinRateLimit,
} from "../_shared/auth.ts";

interface Body {
  full_name?: string;
  school_id?: string;
  login?: string;
  email?: string;
  password?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);
  if (caller.role !== "admin") {
    return jsonResponse({ error: "Forbidden: faqat super admin" }, 403);
  }

  // Rate-limit: soatiga 30 ta maslahatchi yaratish
  if (!(await withinRateLimit(admin, caller.id, "counselor_created", 30))) {
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

  const fullName = body.full_name?.trim();
  const schoolId = body.school_id;
  if (!fullName) return jsonResponse({ error: "full_name majburiy" }, 400);
  if (!schoolId) return jsonResponse({ error: "school_id majburiy" }, 400);

  // Maktab mavjudligini tekshiramiz
  const { data: school } = await admin
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .maybeSingle();
  if (!school) return jsonResponse({ error: "Maktab topilmadi" }, 404);

  // Login/email aniqlash
  let email: string;
  if (body.email?.includes("@")) {
    email = body.email.toLowerCase().trim();
  } else if (body.login?.trim()) {
    if (!/^[a-z0-9._-]{3,40}$/i.test(body.login.trim())) {
      return jsonResponse(
        { error: "Login faqat lotin harf, raqam va . _ - belgilaridan iborat bo'lsin (3-40)" },
        400,
      );
    }
    email = toSystemEmail(body.login);
  } else {
    return jsonResponse({ error: "email yoki login berilishi kerak" }, 400);
  }

  const password = body.password?.trim() || generatePassword(8);

  // Akkaunt yaratish — handle_new_user trigger profil + rol yozadi
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "counselor" },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Akkaunt yaratib bo'lmadi";
    const dup = /already|registered|exists/i.test(msg);
    return jsonResponse(
      { error: dup ? "Bu login/email allaqachon ro'yxatdan o'tgan" : msg },
      dup ? 409 : 400,
    );
  }

  // Profilni maktabga biriktirish
  const { error: profErr } = await admin
    .from("profiles")
    .update({ school_id: schoolId, full_name: fullName })
    .eq("id", created.user.id);
  if (profErr) {
    // Profil bog'lanmasa akkaunt yarim-tayyor qoladi — orqaga qaytaramiz
    await admin.auth.admin.deleteUser(created.user.id);
    return jsonResponse({ error: `Profilni biriktirib bo'lmadi: ${profErr.message}` }, 500);
  }

  await logActivity(admin, {
    actorId: caller.id,
    actorName: caller.fullName,
    action: "counselor_created",
    targetId: created.user.id,
    targetLabel: fullName,
    schoolId,
    details: { school_name: school.name, login: email },
  });

  return jsonResponse({
    ok: true,
    counselor: {
      id: created.user.id,
      full_name: fullName,
      login: email,
      password, // bir martalik ko'rsatish uchun — admin maslahatchiga beradi
      school_id: schoolId,
      school_name: school.name,
    },
  });
});
