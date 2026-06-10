-- ============================================================================
-- Klublar moduli — clubs + club_members jadvallari, RLS va seed data
-- Rollar: admin (to'liq boshqaruv) + student (faqat o'z a'zoligini ko'rish)
-- Idempotent: qayta qo'llansa xato bermaydi.
-- ============================================================================

-- ─── Klublar jadvali ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  focus_area TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🏆',
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubs TO authenticated, anon;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Klublarni hamma ko'ra oladi
DROP POLICY IF EXISTS "Clubs readable by everyone" ON public.clubs;
CREATE POLICY "Clubs readable by everyone" ON public.clubs
  FOR SELECT USING (true);

-- Faqat admin klub yarata/tahrirlay/o'chira oladi
DROP POLICY IF EXISTS "Admins insert clubs" ON public.clubs;
CREATE POLICY "Admins insert clubs" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update clubs" ON public.clubs;
CREATE POLICY "Admins update clubs" ON public.clubs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete clubs" ON public.clubs;
CREATE POLICY "Admins delete clubs" ON public.clubs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── Klub a'zolari jadvali ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE (club_id, student_id)
);
GRANT SELECT, INSERT, DELETE ON public.club_members TO authenticated;
GRANT ALL ON public.club_members TO service_role;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- ── O'qish (SELECT) policylari ──
-- O'quvchi faqat o'z a'zoligini ko'ra oladi
DROP POLICY IF EXISTS "Students read own memberships" ON public.club_members;
CREATE POLICY "Students read own memberships" ON public.club_members
  FOR SELECT USING (auth.uid() = student_id);
-- Admin barcha a'zoliklarni ko'ra oladi
DROP POLICY IF EXISTS "Admins read memberships" ON public.club_members;
CREATE POLICY "Admins read memberships" ON public.club_members
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ── Yozish (INSERT) — faqat admin ──
DROP POLICY IF EXISTS "Admins add members" ON public.club_members;
CREATE POLICY "Admins add members" ON public.club_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── O'chirish (DELETE) — faqat admin ──
DROP POLICY IF EXISTS "Admins remove members" ON public.club_members;
CREATE POLICY "Admins remove members" ON public.club_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tezkor qidiruv uchun indekslar
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_student_id ON public.club_members(student_id);

-- ─── Seed: 7 ta klub (faqat jadval bo'sh bo'lsa — idempotent) ─────────────────
INSERT INTO public.clubs (name, description, focus_area, icon, color)
SELECT * FROM (VALUES
('Turon Teatr', 'Sahna san''ati va notiqlik ko''nikmalarini rivojlantiruvchi klub. O''quvchilar teatr ijrosi, ovoz va nutq texnikasi, sahna harakati asoslarini o''rganadilar.', 'Sahna san''ati, Notiqlik, Ijro mahorati', '🎭', 'purple'),
('Iqtidor Ansambli', 'Musiqa va ijodiy iqtidorni kashf etuvchi klub. Vokal, cholg''u asboblari va musiqiy kompozitsiya asoslari o''rgatiladi.', 'Musiqa, Ijod, Vokal, Cholg''u asboblari', '🎵', 'pink'),
('Jadidlar Izidan', 'Kitobxonlik madaniyati va milliy o''zlikni mustahkamlovchi klub. O''zbek adabiyoti, tarix va jadidchilik harakati g''oyalari o''rganiladi.', 'Kitobxonlik, Milliy o''zlik, O''zbek adabiyoti', '📚', 'amber'),
('Eco-Schools', 'Ekologik madaniyat va tabiatga muhabbatni tarbiyalovchi klub. Atrof-muhitni muhofaza qilish, ekologik loyihalar va ilmiy tadqiqotlar olib boriladi.', 'Ekologiya, Tabiat, Ilmiy tadqiqot', '🌿', 'green'),
('Xorijiy Tillar', 'Chet tili ko''nikmalarini rivojlantiruvchi klub. Ingliz, rus va boshqa xorijiy tillarni qo''shimcha mashg''ulotlar orqali o''rganish.', 'Ingliz tili, Xorijiy tillar, Muloqot ko''nikmasi', '🌍', 'blue'),
('Debat', 'Tanqidiy fikrlash va liderlik ko''nikmalarini rivojlantiruvchi klub. Munozara texnikasi, argumentatsiya va jamoaviy ishlash o''rgatiladi.', 'Tanqidiy fikrlash, Liderlik, Munozara', '🗣️', 'orange'),
('Raqamli Avlod Qizlari', 'Qizlarni IT va innovatsiyaga jalb etuvchi klub. Dasturlash asoslari, raqamli savodxonlik va texnologik loyihalar bilan ishlash ko''nikmalari beriladi.', 'IT, Dasturlash, Innovatsiya, Texnologiya', '💻', 'cyan')
) AS v(name, description, focus_area, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM public.clubs);
