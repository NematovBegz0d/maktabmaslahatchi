-- ============================================================================
-- O'QUVCHI SELF-WRITE TIRQISHLARINI QULFLASH (2026-06-20) — Bosqich 2
--
-- MUAMMO (audit topilmasi):
--   1. student_profiles: "Students insert/update own student_profile" policy'lari
--      o'quvchiga o'z radar/IQ/kasb/AI natijalarini TO'G'RIDAN-TO'G'RI yozishga
--      ruxsat berardi → o'quvchi o'z portfolio'sini soxtalashtirishi mumkin edi
--      (counselor/admin uni ishonchli deb o'qiydi). Bu jadvalga yagona qonuniy
--      yozuvchi — complete-session (service_role).
--   2. profiles: "Update own profile or admin all" self-update'da USTUN cheklovi
--      yo'q edi → o'quvchi o'z school_id'sini (boshqa maktabga "ko'chish"),
--      passport_series yoki is_active'ini o'zgartira olardi.
--
-- YECHIM:
--   1. student_profiles'dan o'quvchi INSERT/UPDATE policy va grant'ini olib tashlash
--      (SELECT qoladi — o'quvchi o'z profilini ko'rishda davom etadi).
--   2. profiles BEFORE UPDATE trigger: o'z profilini tahrirlayotgan NON-ADMIN uchun
--      school_id / passport_series / is_active ni OLD qiymatga majburan qaytaradi.
--        • Counselor o'quvchi profilini tahrirlasa (auth.uid() != NEW.id) — tegmaydi
--          (uning policy'si school_id'ni allaqachon WITH CHECK bilan qulflaydi).
--        • Admin (has_role admin) — tegmaydi.
--        • Edge funksiya (service_role, auth.uid() NULL) — tegmaydi
--          → create-student/import school_id'ni baribir o'rnatadi.
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 1. student_profiles: o'quvchi yozuvini olib tashlash ────────────────────
DROP POLICY IF EXISTS "Students insert own student_profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students update own student_profile" ON public.student_profiles;
REVOKE INSERT, UPDATE ON public.student_profiles FROM authenticated;

-- ─── 2. profiles: himoyalangan ustunlarni self-update'da qulflovchi trigger ──
CREATE OR REPLACE FUNCTION public.profiles_lock_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = NEW.id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.school_id       := OLD.school_id;
    NEW.passport_series := OLD.passport_series;
    NEW.is_active       := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger funksiyasi — chaqiruvchi rolda EXECUTE shart EMAS (Postgres triggerni
-- tizim chaqiradi). anon/authenticated'dan EXECUTE'ni qaytarib olamiz
-- (Supabase security advisor 0028/0029 bilan izchil — lock_definer_fns kabi).
REVOKE EXECUTE ON FUNCTION public.profiles_lock_protected_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_lock_protected ON public.profiles;
CREATE TRIGGER trg_profiles_lock_protected
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_lock_protected_columns();
