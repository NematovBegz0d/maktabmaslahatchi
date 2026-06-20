#!/usr/bin/env node
// ============================================================================
// EduLens — Schema-sync qo'riqchisi (CI guard, dependency'siz, DB'siz)
//
// Maqsad: migratsiyalar bilan src/integrations/supabase/types.ts DRIFT'ini
// erta ushlash — ya'ni migratsiya yangi jadval/view qo'shgan-u, lekin types.ts
// qayta generatsiya qilinmagan holatni. (Audit topilmasi: "types drift xavfi".)
//
// Tekshiruvlar (HARD — xato bo'lsa exit 1):
//   1. Migratsiya nomlari: <14 raqamli timestamp>_<nom>.sql, qat'iy o'suvchi+unikal.
//   2. Har migratsiyada $$ dollar-quote balansi juft.
//   3. Coverage: har bir `CREATE TABLE/VIEW public.X` types.ts'ning public
//      sxemasida kalit sifatida mavjud bo'lishi shart.
//
// Ishlatish: node scripts/check-schema-sync.mjs   (yoki: npm run check:schema)
// ============================================================================
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIG_DIR = join(ROOT, "supabase/migrations");
const TYPES = join(ROOT, "src/integrations/supabase/types.ts");

const errors = [];

// ─── 1. Migratsiya fayllari: nom + timestamp + $$ balans ────────────────────
const files = readdirSync(MIG_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();
let prevTs = "";
for (const f of files) {
  const m = f.match(/^(\d{14})_.+\.sql$/);
  if (!m) {
    errors.push(`Noto'g'ri migratsiya nomi: ${f} (format: <14 raqam>_<nom>.sql)`);
    continue;
  }
  const ts = m[1];
  if (ts <= prevTs) {
    errors.push(`Timestamp tartibi/unikalligi buzilgan: ${f} (oldingi: ${prevTs})`);
  }
  prevTs = ts;
  const sql = readFileSync(join(MIG_DIR, f), "utf8");
  if ((sql.match(/\$\$/g) || []).length % 2 !== 0) {
    errors.push(`$$ balansi buzilgan (toq son): ${f}`);
  }
}

// ─── 2. Migratsiyalardagi CREATE TABLE / VIEW public.* ──────────────────────
const allSql = files.map((f) => readFileSync(join(MIG_DIR, f), "utf8")).join("\n");
const createdTables = new Set();
const createdViews = new Set();
for (const m of allSql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/gi)) {
  createdTables.add(m[1]);
}
for (const m of allSql.matchAll(/create\s+(?:or\s+replace\s+)?view\s+public\.(\w+)/gi)) {
  createdViews.add(m[1]);
}

// ─── 3. types.ts public sxemasidagi 6-probel kalitlar (Tables/Views/...) ────
const types = readFileSync(TYPES, "utf8");
const pubIdx = types.indexOf("\n  public: {");
if (pubIdx < 0) errors.push("types.ts'da `public:` bloki topilmadi");
const pubBlock = pubIdx >= 0 ? types.slice(pubIdx) : "";
const typesKeys = new Set();
for (const m of pubBlock.matchAll(/^ {6}(\w+): \{/gm)) typesKeys.add(m[1]);

// ─── 4. Coverage ────────────────────────────────────────────────────────────
for (const t of [...createdTables].sort()) {
  if (!typesKeys.has(t)) {
    errors.push(`DRIFT: '${t}' jadvali migratsiyada bor, lekin types.ts'da YO'Q → npm run gen:types`);
  }
}
for (const v of [...createdViews].sort()) {
  if (!typesKeys.has(v)) {
    errors.push(`DRIFT: '${v}' view migratsiyada bor, lekin types.ts'da YO'Q → npm run gen:types`);
  }
}

// ─── Natija ─────────────────────────────────────────────────────────────────
console.log(
  `Migratsiyalar: ${files.length} | jadval: ${createdTables.size} | view: ${createdViews.size} | types.ts public kalitlari: ${typesKeys.size}`,
);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} ta muammo topildi.`);
  process.exit(1);
}
console.log("✓ Schema-sync: migratsiyalar va types.ts mos.");
