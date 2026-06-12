// Maslahatchini boshqarish — FAQAT super admin.
// Body: { counselor_id, action: "reset_password" | "reassign" | "set_active", ... }
//   reset_password — yangi parol generatsiya qilinadi va javobda qaytariladi
//   reassign       — boshqa maktabga ko'chirish (school_id majburiy)
//   set_active     — bloklash/ochish (active: boolean majburiy)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, generatePassword, getCaller, logActivity } from "../_shared/auth.ts";

interface Body {
  counselor_id?: string;
  action?: "reset_password" | "reassign" | "set_active";
  school_id?: string;
  active?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);
  if (caller.role !== "admin") {
    return jsonResponse({ error: "Forbidden: faqat super admin" }, 403);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON formatda yuborish kerak" }, 400);
  }

  const counselorId = body.counselor_id;
  if (!counselorId) return jsonResponse({ error: "counselor_id majburiy" }, 400);

  // Maqsad haqiqatan maslahatchi ekanini tekshiramiz
  const { data: targetRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", counselorId)
    .maybeSingle();
  if (targetRole?.role !== "counselor") {
    return jsonResponse({ error: "Bu foydalanuvchi maslahatchi emas" }, 400);
  }
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("full_name, school_id")
    .eq("id", counselorId)
    .maybeSingle();

  switch (body.action) {
    case "reset_password": {
      const password = generatePassword(8);
      const { error } = await admin.auth.admin.updateUserById(counselorId, { password });
      if (error) return jsonResponse({ error: error.message }, 400);
      await logActivity(admin, {
        actorId: caller.id,
        actorName: caller.fullName,
        action: "counselor_password_reset",
        targetId: counselorId,
        targetLabel: targetProfile?.full_name ?? null,
        schoolId: targetProfile?.school_id ?? null,
      });
      return jsonResponse({ ok: true, password });
    }

    case "reassign": {
      if (!body.school_id) return jsonResponse({ error: "school_id majburiy" }, 400);
      const { data: school } = await admin
        .from("schools")
        .select("id, name")
        .eq("id", body.school_id)
        .maybeSingle();
      if (!school) return jsonResponse({ error: "Maktab topilmadi" }, 404);
      const { error } = await admin
        .from("profiles")
        .update({ school_id: body.school_id })
        .eq("id", counselorId);
      if (error) return jsonResponse({ error: error.message }, 400);
      await logActivity(admin, {
        actorId: caller.id,
        actorName: caller.fullName,
        action: "counselor_reassigned",
        targetId: counselorId,
        targetLabel: targetProfile?.full_name ?? null,
        schoolId: body.school_id,
        details: { school_name: school.name, from_school_id: targetProfile?.school_id ?? null },
      });
      return jsonResponse({ ok: true });
    }

    case "set_active": {
      if (typeof body.active !== "boolean") {
        return jsonResponse({ error: "active (true/false) majburiy" }, 400);
      }
      // Bloklash: auth darajasida ban (login qilolmaydi) + profil bayrog'i
      const { error: banErr } = await admin.auth.admin.updateUserById(counselorId, {
        ban_duration: body.active ? "none" : "876600h", // ~100 yil
      });
      if (banErr) return jsonResponse({ error: banErr.message }, 400);
      const { error: profErr } = await admin
        .from("profiles")
        .update({ is_active: body.active })
        .eq("id", counselorId);
      if (profErr) return jsonResponse({ error: profErr.message }, 400);
      await logActivity(admin, {
        actorId: caller.id,
        actorName: caller.fullName,
        action: body.active ? "counselor_unblocked" : "counselor_blocked",
        targetId: counselorId,
        targetLabel: targetProfile?.full_name ?? null,
        schoolId: targetProfile?.school_id ?? null,
      });
      return jsonResponse({ ok: true });
    }

    default:
      return jsonResponse({ error: "action noto'g'ri" }, 400);
  }
});
