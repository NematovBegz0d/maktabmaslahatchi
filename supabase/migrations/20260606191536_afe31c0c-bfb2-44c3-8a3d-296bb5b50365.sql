
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('student', 'counselor', 'parent', 'admin');

CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schools TO authenticated, anon;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools readable by everyone" ON public.schools FOR SELECT USING (true);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school_id UUID REFERENCES public.schools(id),
  class_number INT,
  class_letter TEXT,
  parent_id UUID REFERENCES auth.users(id),
  birth_date DATE,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Profiles RLS
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Counselors read student profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'counselor'));
CREATE POLICY "Parents read child profiles" ON public.profiles FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile + default student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tests
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz TEXT NOT NULL,
  description TEXT,
  category TEXT,
  test_type TEXT,
  question_count INT NOT NULL DEFAULT 0,
  duration_minutes INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tests TO authenticated, anon;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tests readable by everyone" ON public.tests FOR SELECT USING (true);

-- Questions (without correct_answer)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text_uz TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  subscale TEXT
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions readable by authenticated" ON public.questions FOR SELECT TO authenticated USING (true);

-- Separate protected table for correct answers (no SELECT for authenticated)
CREATE TABLE public.question_answer_keys (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_answer JSONB NOT NULL
);
GRANT ALL ON public.question_answer_keys TO service_role;
ALTER TABLE public.question_answer_keys ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated => no access. Only service_role bypasses.

-- Sessions
CREATE TABLE public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.test_sessions TO authenticated;
GRANT ALL ON public.test_sessions TO service_role;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own sessions" ON public.test_sessions FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Counselors view sessions" ON public.test_sessions FOR SELECT USING (public.has_role(auth.uid(), 'counselor'));
CREATE POLICY "Admins view sessions" ON public.test_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Answers
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);
GRANT SELECT, INSERT, UPDATE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own answers" ON public.answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.test_sessions s WHERE s.id = session_id AND s.student_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_sessions s WHERE s.id = session_id AND s.student_id = auth.uid()));

-- Results
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  raw_scores JSONB,
  scaled_scores JSONB,
  personality_type TEXT,
  holland_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.test_results TO authenticated;
GRANT ALL ON public.test_results TO service_role;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own results" ON public.test_results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Counselors read results" ON public.test_results FOR SELECT USING (public.has_role(auth.uid(), 'counselor'));
CREATE POLICY "Admins read results" ON public.test_results FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents read child results" ON public.test_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.parent_id = auth.uid())
);

-- Student profiles (aggregated)
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  radar_scores JSONB,
  iq_scores JSONB,
  top_careers JSONB,
  top_universities JSONB,
  ai_summary TEXT,
  profile_completeness INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own student_profile" ON public.student_profiles FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students update own student_profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students insert own student_profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Counselors read student_profiles" ON public.student_profiles FOR SELECT USING (public.has_role(auth.uid(), 'counselor'));
CREATE POLICY "Admins read student_profiles" ON public.student_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents read child student_profile" ON public.student_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.parent_id = auth.uid())
);

-- Careers
CREATE TABLE public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz TEXT NOT NULL,
  description TEXT,
  holland_codes TEXT[],
  required_skills TEXT[],
  salary_range TEXT,
  universities JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.careers TO authenticated, anon;
GRANT ALL ON public.careers TO service_role;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Careers readable by everyone" ON public.careers FOR SELECT USING (true);

-- Seed: tests
INSERT INTO public.tests (name_uz, description, category, test_type, question_count, duration_minutes) VALUES
('Holland (RIASEC)', 'Kasbiy qiziqishlaringizni aniqlash testi', 'qiziqish', 'holland', 60, 20),
('Ayzenk shaxsiyat testi', 'Ekstroversiya va neyrotizmni o''lchaydi', 'shaxsiyat', 'eysenck', 57, 25),
('Big Five', 'Beshta asosiy shaxsiyat omilini aniqlaydi', 'shaxsiyat', 'big5', 50, 20),
('Raven IQ', 'Vizual mantiqiy fikrlash testi', 'intellekt', 'raven', 36, 40),
('Matematik IQ', 'Sonli va mantiqiy qobiliyat', 'intellekt', 'math_iq', 30, 30),
('Hissiy intellekt (EQ)', 'Hissiyotlarni boshqarish qobiliyati', 'eq', 'eq', 40, 20),
('Diqqat (Schulte)', 'Diqqat to''planganligi va tezligi', 'diqqat', 'schulte', 5, 10),
('Liderlik testi', 'Liderlik sifatlarini aniqlaydi', 'liderlik', 'leadership', 25, 15);

-- Seed: sample Holland questions (10)
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'holland' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', '[{"value":1,"label":"Yoqadi"},{"value":0,"label":"Yoqmaydi"}]'::jsonb, s
FROM t, (VALUES
  (1, 'Mexanik jihozlarni ta''mirlashni yoqtirasizmi?', 'R'),
  (2, 'Yangi narsalarni kashf qilish sizga qiziqarlimi?', 'I'),
  (3, 'Rasm chizish yoki musiqa yaratish yoqadimi?', 'A'),
  (4, 'Boshqalarga yordam berish sizga zavq beradimi?', 'S'),
  (5, 'Guruhga rahbarlik qilishni xohlaysizmi?', 'E'),
  (6, 'Hujjatlar bilan tartibli ishlashni yoqtirasizmi?', 'C'),
  (7, 'Tabiatda ishlash sizga yoqadimi?', 'R'),
  (8, 'Ilmiy maqolalar o''qishni yoqtirasizmi?', 'I'),
  (9, 'Teatr yoki kino yaratishni xohlaysizmi?', 'A'),
  (10, 'O''qituvchi bo''lishni o''ylab ko''rdingizmi?', 'S')
) AS v(n, q, s);

-- Seed: sample Eysenck questions (10)
WITH t AS (SELECT id FROM public.tests WHERE test_type = 'eysenck' LIMIT 1)
INSERT INTO public.questions (test_id, question_number, question_text_uz, question_type, options, subscale)
SELECT t.id, n, q, 'single', '[{"value":1,"label":"Ha"},{"value":0,"label":"Yo''q"}]'::jsonb, s
FROM t, (VALUES
  (1, 'Yangi tanishlar orttirishni yoqtirasizmi?', 'E'),
  (2, 'Ko''pincha tashvishlanasizmi?', 'N'),
  (3, 'Yolg''iz qolishni afzal ko''rasizmi?', 'E'),
  (4, 'Kichik narsalardan ham xafa bo''lasizmi?', 'N'),
  (5, 'Partiyalarda hayotning markazida bo''lishni yoqtirasizmi?', 'E'),
  (6, 'Tunda uxlay olmay qiynalasizmi?', 'N'),
  (7, 'Shoshilinch qarorlar qabul qila olasizmi?', 'E'),
  (8, 'Kayfiyatingiz tez o''zgaradimi?', 'N'),
  (9, 'Begona odamlar bilan tez til topishasizmi?', 'E'),
  (10, 'Ko''pincha o''zingizni aybdor his qilasizmi?', 'N')
) AS v(n, q, s);

-- Update question_count
UPDATE public.tests SET question_count = (SELECT COUNT(*) FROM public.questions WHERE test_id = tests.id) WHERE test_type IN ('holland','eysenck');

-- Seed careers (15)
INSERT INTO public.careers (name_uz, description, holland_codes, required_skills, salary_range, universities) VALUES
('Dasturchi (Software Engineer)', 'Dasturiy ta''minot yaratuvchi muhandis', ARRAY['I','R'], ARRAY['Mantiqiy fikrlash','Matematika','Ingliz tili'], '8-30 mln so''m', '[{"name":"TATU","city":"Toshkent"},{"name":"Inha University","city":"Toshkent"}]'::jsonb),
('Vrach', 'Tibbiyot xodimi, kasalliklarni davolaydi', ARRAY['I','S'], ARRAY['Biologiya','Kimyo','Empatiya'], '5-20 mln so''m', '[{"name":"TTA","city":"Toshkent"}]'::jsonb),
('Dizayner', 'Vizual va UX dizayn yaratuvchi', ARRAY['A','I'], ARRAY['Ijodkorlik','Vizual idrok'], '6-18 mln so''m', '[{"name":"NamDU","city":"Namangan"}]'::jsonb),
('O''qituvchi', 'O''quvchilarga bilim beruvchi', ARRAY['S','C'], ARRAY['Sabr','Muloqot'], '3-8 mln so''m', '[{"name":"TDPU","city":"Toshkent"}]'::jsonb),
('Iqtisodchi', 'Iqtisodiy tahlil va prognoz', ARRAY['C','E'], ARRAY['Matematika','Tahlil'], '6-15 mln so''m', '[{"name":"TDIU","city":"Toshkent"}]'::jsonb),
('Yurist', 'Huquqiy maslahat va himoya', ARRAY['E','S'], ARRAY['Notiqlik','Mantiq'], '5-20 mln so''m', '[{"name":"TDYU","city":"Toshkent"}]'::jsonb),
('Muhandis-quruvchi', 'Bino va inshootlar loyihalashtirish', ARRAY['R','I'], ARRAY['Matematika','Fizika'], '7-15 mln so''m', '[{"name":"TIQXMMI","city":"Toshkent"}]'::jsonb),
('Psixolog', 'Insonlarning ruhiy holatiga yordam', ARRAY['S','I'], ARRAY['Empatiya','Tinglash'], '4-12 mln so''m', '[{"name":"TDPU","city":"Toshkent"}]'::jsonb),
('Marketolog', 'Mahsulot reklamasi va sotuvi', ARRAY['E','A'], ARRAY['Ijodkorlik','Tahlil'], '6-15 mln so''m', '[{"name":"WIUT","city":"Toshkent"}]'::jsonb),
('Jurnalist', 'Yangiliklar va maqolalar yozuvchi', ARRAY['A','S'], ARRAY['Yozish','Tahlil'], '4-10 mln so''m', '[{"name":"O''zMU","city":"Toshkent"}]'::jsonb),
('Agronom', 'Qishloq xo''jaligi mutaxassisi', ARRAY['R','I'], ARRAY['Biologiya','Tabiat'], '4-10 mln so''m', '[{"name":"TDAU","city":"Toshkent"}]'::jsonb),
('Buxgalter', 'Moliyaviy hisob-kitob', ARRAY['C'], ARRAY['Aniqlik','Matematika'], '5-12 mln so''m', '[{"name":"TDIU","city":"Toshkent"}]'::jsonb),
('Tarjimon', 'Tillarni tarjima qiluvchi', ARRAY['A','S'], ARRAY['Tillar','Yozish'], '4-12 mln so''m', '[{"name":"O''zDJTU","city":"Toshkent"}]'::jsonb),
('Tadbirkor', 'O''z biznesini boshqaruvchi', ARRAY['E','C'], ARRAY['Liderlik','Risk'], '10+ mln so''m', '[{"name":"WIUT","city":"Toshkent"}]'::jsonb),
('Data Analyst', 'Ma''lumotlar tahlilchisi', ARRAY['I','C'], ARRAY['Statistika','SQL'], '8-20 mln so''m', '[{"name":"TATU","city":"Toshkent"}]'::jsonb);

-- Seed schools
INSERT INTO public.schools (name, region, district) VALUES
('1-umumta''lim maktabi', 'Toshkent', 'Yunusobod'),
('45-IDUM', 'Toshkent', 'Mirzo Ulug''bek'),
('Prezident maktabi', 'Toshkent', 'Yashnobod');
