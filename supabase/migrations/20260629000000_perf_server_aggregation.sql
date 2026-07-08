-- ============================================================================
-- PERFORMANS: SERVER TOMONIDA AGREGATSIYA — (2026-06-29)
--
-- Muammo: "Tahlil" sahifasi va maslahatchi bildirishnomalari butun jadvallarni
-- (test_results, student_profiles, student_directory, ...) brauzerga tortib,
-- agregatsiyani JavaScript'da bajarardi. Bu:
--   1. Sekin — minglab/millionlab qator tarmoq orqali o'tadi;
--   2. NOTO'G'RI — PostgREST sukut bo'yicha 1000 qatorda kesadi, shuning uchun
--      masshtabda statistika faqat birinchi 1000 qatordan hisoblanardi.
--
-- Yechim: hisoblashni SQL tomoniga ko'chiramiz. Brauzerga faqat tayyor raqamlar
-- qaytadi (bitta so'rov).
--
-- Funksiyalar SECURITY INVOKER — RLS chaqiruvchining huquqi bilan ishlaydi:
--   • super admin  → barcha maktablar
--   • maslahatchi  → faqat O'Z maktabi (mavjud RLS siyosatlari orqali)
-- Hech qanday yangi ma'lumot oshkor bo'lmaydi — bazaviy jadvallarning RLS'i
-- har bir so'rovda qo'llanadi.
--
-- Shuningdek school_stats view'i har-maktab korrelyatsion subquery'lardan bitta
-- o'tishli CTE-agregatsiyaga o'tkaziladi (ustun nomlari/tiplari o'zgarmaydi).
--
-- TO'LIQ IDEMPOTENT.
-- ============================================================================

-- ─── 0. Foydali indekslar ───────────────────────────────────────────────────
-- results_30d filtri va sanaviy tahlil uchun
CREATE INDEX IF NOT EXISTS idx_test_results_created_at
  ON public.test_results(created_at);
-- View/RPC'larda rol bo'yicha tez-tez filtrlash (role = 'student'/'counselor')
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON public.user_roles(role);

-- ─── 1. analytics_overview() — "Tahlil" sahifasi uchun jamlama ───────────────
-- Bir so'rovda barcha grafik/karta ma'lumotlarini qaytaradi.
CREATE OR REPLACE FUNCTION public.analytics_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH res AS (
    SELECT tr.holland_code,
           tr.personality_type,
           tr.scaled_scores,
           t.name_uz,
           t.test_type
    FROM public.test_results tr
    LEFT JOIN public.tests t ON t.id = tr.test_id
  ),
  sp AS (
    SELECT profile_completeness, top_careers
    FROM public.student_profiles
  )
  SELECT jsonb_build_object(
    -- KPI kartalar
    'total_students',
      (SELECT count(*) FROM public.student_directory WHERE class_number IS NOT NULL),
    'completed_tests',
      (SELECT count(*) FROM res),
    'active_students',
      (SELECT count(*) FROM sp),
    'avg_completeness',
      (SELECT COALESCE(round(avg(COALESCE(profile_completeness, 0))), 0)::int FROM sp),

    -- Holland yo'nalishlari (RIASEC, faqat value > 0; o'rnatilgan tartibda)
    'holland', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object('short', letter, 'name', label, 'value', cnt)
          ORDER BY ord
        ), '[]'::jsonb)
      FROM (
        SELECT v.letter, v.label, v.ord, count(r.holland_code) AS cnt
        FROM (VALUES
          ('R','Realistik',1),
          ('I','Tadqiqotchi',2),
          ('A','Ijodkor',3),
          ('S','Ijtimoiy',4),
          ('E','Tadbirkor',5),
          ('C','Konventsion',6)
        ) AS v(letter, label, ord)
        LEFT JOIN res r ON upper(left(r.holland_code, 1)) = v.letter
        GROUP BY v.letter, v.label, v.ord
      ) h
      WHERE cnt > 0
    ),

    -- Temperament taqsimoti (null skip)
    'temperament', (
      SELECT COALESCE(
        jsonb_agg(jsonb_build_object('name', personality_type, 'value', cnt)
                  ORDER BY cnt DESC, personality_type),
        '[]'::jsonb)
      FROM (
        SELECT personality_type, count(*) AS cnt
        FROM res
        WHERE personality_type IS NOT NULL
        GROUP BY personality_type
      ) t
    ),

    -- Test mashhurligi (kamayuvchi)
    'test_popularity', (
      SELECT COALESCE(
        jsonb_agg(jsonb_build_object('name', name, 'value', cnt)
                  ORDER BY cnt DESC, name),
        '[]'::jsonb)
      FROM (
        SELECT COALESCE(name_uz, 'Test') AS name, count(*) AS cnt
        FROM res
        GROUP BY COALESCE(name_uz, 'Test')
      ) tp
    ),

    -- Eng ko'p tavsiya etilgan kasblar (top 6)
    'top_careers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', cnt)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(c->>'name_uz', c->>'name') AS name, count(*) AS cnt
        FROM sp,
             LATERAL jsonb_array_elements(
               CASE WHEN jsonb_typeof(sp.top_careers) = 'array'
                    THEN sp.top_careers ELSE '[]'::jsonb END
             ) AS c
        WHERE COALESCE(c->>'name_uz', c->>'name') IS NOT NULL
        GROUP BY COALESCE(c->>'name_uz', c->>'name')
        ORDER BY cnt DESC, name
        LIMIT 6
      ) tc
    ),

    -- Fan testlari statistikasi (test_type = 'subject')
    'subjects', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'name', name,
            'avgPercent', avg_percent,
            'avgGrade', avg_grade,
            'count', cnt,
            'grades', grades
          ) ORDER BY name
        ), '[]'::jsonb)
      FROM (
        SELECT
          COALESCE(name_uz, 'Fan') AS name,
          round(avg(COALESCE((scaled_scores->>'percent')::numeric, 0)))::int AS avg_percent,
          round(avg(COALESCE((scaled_scores->>'grade')::numeric, 0)), 1)::float8 AS avg_grade,
          count(*) AS cnt,
          jsonb_build_object(
            '2', count(*) FILTER (WHERE COALESCE((scaled_scores->>'grade')::int, 2) = 2),
            '3', count(*) FILTER (WHERE COALESCE((scaled_scores->>'grade')::int, 2) = 3),
            '4', count(*) FILTER (WHERE COALESCE((scaled_scores->>'grade')::int, 2) = 4),
            '5', count(*) FILTER (WHERE COALESCE((scaled_scores->>'grade')::int, 2) = 5)
          ) AS grades
        FROM res
        WHERE test_type = 'subject'
        GROUP BY COALESCE(name_uz, 'Fan')
      ) sub
    )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_overview() TO authenticated;

-- ─── 2. counselor_dashboard() — maslahatchi bildirishnomalari uchun jamlama ──
-- buildCounselorNotifications() uchun kerakli raqamlarni bitta so'rovda qaytaradi.
-- RLS tufayli avtomatik ravishda faqat chaqiruvchi maslahatchining maktabi.
CREATE OR REPLACE FUNCTION public.counselor_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH s AS (
    SELECT id, class_number FROM public.student_directory
  ),
  cl AS (
    SELECT id, name FROM public.clubs
  ),
  mem AS (
    SELECT DISTINCT student_id, club_id FROM public.club_members
  )
  SELECT jsonb_build_object(
    'studentCount',
      (SELECT count(*) FROM s),

    'untestedCount',
      (SELECT count(*) FROM s
        WHERE NOT EXISTS (
          SELECT 1 FROM public.test_results tr WHERE tr.student_id = s.id
        )),

    'clubCount',
      (SELECT count(*) FROM cl),

    'emptyClubNames',
      (SELECT COALESCE(jsonb_agg(name), '[]'::jsonb)
         FROM cl
        WHERE NOT EXISTS (SELECT 1 FROM mem WHERE mem.club_id = cl.id)),

    'existingClubNames',
      (SELECT COALESCE(jsonb_agg(name), '[]'::jsonb) FROM cl),

    'studentsWithoutClub',
      (SELECT count(*) FROM s
        WHERE NOT EXISTS (SELECT 1 FROM mem WHERE mem.student_id = s.id)),

    'pendingTasks',
      (SELECT count(*) FROM public.task_assignments
        WHERE counselor_id = (select auth.uid())
          AND status IN ('assigned', 'returned')),

    'unreadAnnouncements',
      (SELECT count(*) FROM public.messages m
        WHERE NOT EXISTS (
          SELECT 1 FROM public.message_reads mr
           WHERE mr.message_id = m.id AND mr.user_id = (select auth.uid())
        )),

    'councilMembers',
      (SELECT count(*) FROM public.council_members),

    'studentsWithoutPortfolio',
      (SELECT count(*) FROM s
        WHERE NOT EXISTS (
                SELECT 1 FROM public.extracurricular_enrollments e WHERE e.student_id = s.id)
          AND NOT EXISTS (
                SELECT 1 FROM public.student_achievements a WHERE a.student_id = s.id)),

    'careerUnoriented79',
      (SELECT count(*) FROM s
        WHERE s.class_number IN (7, 8, 9)
          AND NOT EXISTS (
            SELECT 1 FROM public.student_profiles p
             WHERE p.student_id = s.id
               AND jsonb_typeof(p.top_careers) = 'array'
               AND jsonb_array_length(p.top_careers) > 0
          ))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.counselor_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.counselor_dashboard() TO authenticated;

-- ─── 3. school_stats — korrelyatsion subquery'lardan bitta o'tishli CTE'ga ───
-- Ustun nomlari/tartibi/tiplari AVVALGIDEK (CREATE OR REPLACE talabi).
-- Avval: har maktab uchun 6 ta korrelyatsion subquery (N×6 skan).
-- Endi:  har metrika bir marta school_id bo'yicha GROUP BY qilinadi, so'ng
--        maktablarga LEFT JOIN — masshtabda sezilarli tezroq.
-- security_invoker saqlanadi → RLS avvalgidek qo'llanadi.
CREATE OR REPLACE VIEW public.school_stats
WITH (security_invoker = true) AS
WITH student_counts AS (
  SELECT p.school_id, count(*) AS student_count
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
  WHERE p.is_active
  GROUP BY p.school_id
),
tested AS (
  SELECT p.school_id,
         count(DISTINCT tr.student_id) AS tested_students,
         count(*) FILTER (WHERE tr.created_at > now() - interval '30 days') AS results_30d
  FROM public.test_results tr
  JOIN public.profiles p ON p.id = tr.student_id
  GROUP BY p.school_id
),
last_act AS (
  SELECT school_id, max(created_at) AS last_activity
  FROM public.activity_log
  GROUP BY school_id
),
counselors AS (
  SELECT DISTINCT ON (p.school_id)
         p.school_id, p.id AS counselor_id, p.full_name AS counselor_name
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'counselor'
  ORDER BY p.school_id, p.created_at
)
SELECT
  s.id,
  s.name,
  s.region,
  s.district,
  s.expected_students,
  COALESCE(sc.student_count, 0)   AS student_count,
  COALESCE(t.tested_students, 0)  AS tested_students,
  COALESCE(t.results_30d, 0)      AS results_30d,
  la.last_activity,
  c.counselor_id,
  c.counselor_name
FROM public.schools s
LEFT JOIN student_counts sc ON sc.school_id = s.id
LEFT JOIN tested t          ON t.school_id  = s.id
LEFT JOIN last_act la       ON la.school_id = s.id
LEFT JOIN counselors c      ON c.school_id  = s.id;

GRANT SELECT ON public.school_stats TO authenticated;
