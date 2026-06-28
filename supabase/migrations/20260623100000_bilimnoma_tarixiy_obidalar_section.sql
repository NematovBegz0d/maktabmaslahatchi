-- ============================================================================
-- BILIMNOMA — yangi bo'lim: "tarixiy_obidalar" (2026-06-23)
--
--   `section` CHECK domeniga 'tarixiy_obidalar' qiymatini qo'shadi (kategoriya
--   va yozuvlar jadvallarida). Boshqa hech narsa o'zgarmaydi.
--   Kod tarafi: src/lib/bilimnoma.ts -> SECTIONS (kind: "place").
--   IDEMPOTENT: DROP IF EXISTS + ADD.
-- ============================================================================

ALTER TABLE public.bilimnoma_categories DROP CONSTRAINT IF EXISTS bilimnoma_categories_section_check;
ALTER TABLE public.bilimnoma_categories ADD CONSTRAINT bilimnoma_categories_section_check
  CHECK (section IN ('kasblar', 'prezident_iqtidorli', 'prezident_maktablari', 'oliy_talim', 'tarixiy_obidalar'));

ALTER TABLE public.bilimnoma_entries DROP CONSTRAINT IF EXISTS bilimnoma_entries_section_check;
ALTER TABLE public.bilimnoma_entries ADD CONSTRAINT bilimnoma_entries_section_check
  CHECK (section IN ('kasblar', 'prezident_iqtidorli', 'prezident_maktablari', 'oliy_talim', 'tarixiy_obidalar'));
