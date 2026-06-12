// O'quvchi akkaunt(lar)ini yaratish — maslahatchi (o'z maktabiga) yoki super admin.
// Bittalab ham, ko'plab (Excel import) ham ishlaydi.
//
// Body: {
//   school_id?: string,          // faqat admin uchun; maslahatchida e'tiborga olinmaydi
//   students: [{
//     full_name: string,
//     passport_series: string,   // login sifatida ishlatiladi (masalan: ibh1234567)
//     class_number?: number, class_letter?: string,
//     gender?: string, birth_date?: string,
//     password?: string,         // berilmasa generatsiya qilinadi
//   }]
// }
// Javob: har bir qator uchun natija (login/parol yoki xato) — chop etish uchun.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  adminClient,
  generatePassword,
  getCaller,
  logActivity,
  toSystemEmail,
} from "../_shared/auth.ts";

const MAX_BATCH = 100;

interface StudentInput {
  full_name?: string;
  passport_series?: string;
  class_number?: number;
  class_letter?: string;
  gender?: string;
  birth_date?: string;
  password?: string;
}

interface RowResult {
  full_name: string;
  login: string;
  password?: string;
  id?: string;
  ok: boolean;
  error?: string;
}

// Lotin 2-3 harf + 7 raqam (auth.tsx'dagi isPassportSeries bilan uyg'un,
// lekin faqat lotin — email lokal qismi ASCII bo'lishi shart)
function isValidPassport(val: string): boolean {
  return /^[a-z]{2,3}\d{7}$/i.test(val.trim());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);
  if (caller.role !== "admin" && caller.role !== "counselor") {
    return jsonResponse({ error: "Forbidden: faqat maslahatchi yoki admin" }, 403);
  }

  let body: { school_id?: string; students?: StudentInput[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON formatda yuborish kerak" }, 400);
  }

  // Maktabni aniqlash: maslahatchi — faqat o'z maktabi; admin — body'dan
  const schoolId = caller.role === "counselor" ? caller.schoolId : body.school_id;
  if (!schoolId) {
    return jsonResponse(
      {
        error:
          caller.role === "counselor"
            ? "Profilingizga maktab biriktirilmagan — super adminga murojaat qiling"
            : "school_id majburiy",
      },
      400,
    );
  }

  const students = body.students;
  if (!Array.isArray(students) || students.length === 0) {
    return jsonResponse({ error: "students bo'sh bo'lmagan massiv bo'lishi kerak" }, 400);
  }
  if (students.length > MAX_BATCH) {
    return jsonResponse({ error: `Bir so'rovda ko'pi bilan ${MAX_BATCH} o'quvchi` }, 400);
  }

  const results: RowResult[] = [];

  for (const s of students) {
    const fullName = s.full_name?.trim() ?? "";
    const passport = s.passport_series?.trim().toLowerCase() ?? "";
    const row: RowResult = { full_name: fullName, login: passport, ok: false };
    results.push(row);

    if (!fullName) {
      row.error = "full_name majburiy";
      continue;
    }
    if (!isValidPassport(passport)) {
      row.error = "Guvohnoma seriyasi noto'g'ri (lotin 2-3 harf + 7 raqam, masalan: ibh1234567)";
      continue;
    }

    // Takrorlanishni oldindan tekshirish (aniq xabar uchun)
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .ilike("passport_series", passport)
      .maybeSingle();
    if (existing) {
      row.error = "Bu guvohnoma seriyasi allaqachon ro'yxatda bor";
      continue;
    }

    const password = s.password?.trim() || generatePassword(8);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: toSystemEmail(passport),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "Akkaunt yaratib bo'lmadi";
      row.error = /already|registered|exists/i.test(msg)
        ? "Bu guvohnoma seriyasi allaqachon ro'yxatda bor"
        : msg;
      continue;
    }

    const { error: profErr } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        school_id: schoolId,
        passport_series: passport,
        class_number: s.class_number ?? null,
        class_letter: s.class_letter?.trim() || null,
        gender: s.gender ?? null,
        birth_date: s.birth_date ?? null,
      })
      .eq("id", created.user.id);
    if (profErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      row.error = `Profil to'ldirilmadi: ${profErr.message}`;
      continue;
    }

    row.ok = true;
    row.id = created.user.id;
    row.password = password;
  }

  const createdCount = results.filter((r) => r.ok).length;
  if (createdCount > 0) {
    await logActivity(admin, {
      actorId: caller.id,
      actorName: caller.fullName,
      action: createdCount === 1 ? "student_created" : "students_imported",
      targetLabel: createdCount === 1 ? results.find((r) => r.ok)?.full_name : null,
      schoolId,
      details: { created: createdCount, failed: results.length - createdCount },
    });
  }

  return jsonResponse({
    ok: createdCount > 0,
    created: createdCount,
    failed: results.length - createdCount,
    results,
  });
});
