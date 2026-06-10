-- ============================================================================
-- club_members / council_members → profiles(id) FK (PostgREST embed uchun)
-- student_id auth.users ga ishora qiladi; sahifalar `profiles(...)` embed qiladi
-- (a'zolar ro'yxatida ism ko'rsatish uchun). profiles.id = auth.users.id bo'lgani
-- uchun qo'shimcha FK qo'shamiz — shunda PostgREST munosabatni topadi.
-- Idempotent.
-- ============================================================================
ALTER TABLE public.club_members
  DROP CONSTRAINT IF EXISTS club_members_student_id_profiles_fkey,
  ADD CONSTRAINT club_members_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.council_members
  DROP CONSTRAINT IF EXISTS council_members_student_id_profiles_fkey,
  ADD CONSTRAINT council_members_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
