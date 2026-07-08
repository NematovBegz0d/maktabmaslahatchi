// ═══════════════════════════════════════════════════════════════════════════
// Lokal "AI" xulosa generatori — Claude API'siz.
//
// O'quvchining mavjud ma'lumotlaridan (radar ballari, IQ, Holland kodi,
// temperament, mos kasblar, fan natijalari) shablon-qoidalar bilan Markdown
// tahlil tuzadi. Tuzilma analyze-profile edge funksiyasi so'ragan formatga
// mos, shuning uchun AISummary komponenti uni o'zgarishsiz ko'rsatadi.
//
// Sof va deterministik: bir xil ma'lumot → bir xil matn. Jumla variantlari
// ma'lumotdan olingan seed bilan tanlanadi — har xil o'quvchilarda matn har
// xil jaranglaydi, lekin bitta o'quvchida barqaror qoladi (kesh shart emas).
// ═══════════════════════════════════════════════════════════════════════════
import { HOLLAND_INFO, TEMP_INFO, iqLabel } from "@/lib/profile-display";

export interface LocalAiInput {
  classNumber?: number | null;
  radar?: { skill: string; value: number }[] | null;
  iq?: { type: string; score: number }[] | null;
  hollandCode?: string | null;
  temperament?: string | null;
  topCareers?: { name_uz: string; description?: string | null }[] | null;
  subjects?: { name: string; percent: number }[] | null;
  clubsCount?: number | null;
}

// Jumla boshini kichik harfga tushirish (gap o'rtasiga qo'shilganda)
function lc(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Ma'lumotdan barqaror seed — variantlar tanlovi uchun (Math.random EMAS)
function seedFrom(input: LocalAiInput): number {
  const key =
    (input.hollandCode ?? "") +
    (input.temperament ?? "") +
    (input.radar ?? []).map((r) => `${r.skill}${r.value}`).join("");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(variants: T[], seed: number, salt: number): T {
  return variants[(seed + salt) % variants.length];
}

// Holland harfi → umumiy yo'nalish tavsiyasi (top_careers bo'lmaganda zaxira)
const HOLLAND_DIRECTIONS: Record<string, string> = {
  R: "Muhandislik, texnika va amaliy kasblar",
  I: "Aniq fanlar, IT va ilmiy-tadqiqot yo'nalishlari",
  A: "Dizayn, san'at va ijodiy yo'nalishlar",
  S: "Pedagogika, psixologiya va tibbiyot yo'nalishlari",
  E: "Menejment, biznes va huquq yo'nalishlari",
  C: "Moliya, buxgalteriya va axborot tizimlari",
};

/**
 * O'quvchi ma'lumotidan Markdown formatida psixologik xulosa tuzadi.
 * Tahlil qilinadigan ma'lumot umuman bo'lmasa null qaytaradi
 * (UI bo'sh holat ko'rsatishi uchun).
 */
export function buildLocalAiSummary(input: LocalAiInput): string | null {
  const radar = input.radar ?? [];
  const iq = input.iq ?? [];
  const subjects = input.subjects ?? [];
  const careers = input.topCareers ?? [];
  const holland = (input.hollandCode ?? "").trim().toUpperCase();
  const temp = input.temperament ? TEMP_INFO[input.temperament] : undefined;

  const hasData = radar.length > 0 || iq.length > 0 || subjects.length > 0 || !!holland || !!temp;
  if (!hasData) return null;

  const seed = seedFrom(input);
  const sorted = [...radar].sort((a, b) => b.value - a.value);
  const strengths = sorted.filter((r) => r.value >= 55).slice(0, 3);
  const weaknesses = [...sorted]
    .reverse()
    .filter((r) => r.value < 60)
    .slice(0, 2);
  const bestSubject = [...subjects].sort((a, b) => b.percent - a.percent)[0];
  const weakSubject = [...subjects].sort((a, b) => a.percent - b.percent)[0];
  const hollandLetters = holland
    .split("")
    .filter((ch) => HOLLAND_INFO[ch])
    .slice(0, 3);

  const out: string[] = [];

  // ── Kuchli tomonlar ─────────────────────────────────────────────────────
  out.push("## Kuchli tomonlar");
  const strongPhrases = [
    "natijasi bilan yaqqol ajralib turadi",
    "— eng kuchli tomonlaringizdan biri",
    "ko'rsatkichi o'rtachadan sezilarli yuqori",
  ];
  strengths.forEach((s, i) => {
    out.push(`- **${s.skill}** (${s.value}/100) ${pick(strongPhrases, seed, i)}`);
  });
  if (bestSubject && bestSubject.percent >= 70) {
    out.push(
      `- **${bestSubject.name}** fanidan ${bestSubject.percent}% natija — fan bo'yicha tayyorgarligingiz mustahkam`,
    );
  }
  if (temp) {
    out.push(`- Temperamentga xos kuchli jihatlar: ${lc(temp.strong)}`);
  }
  if (out.length === 1) {
    out.push(
      "- Dastlabki natijalar shakllanmoqda — har bir yakunlangan test kuchli tomonlaringizni aniqroq ko'rsatadi",
    );
  }

  // ── Rivojlantirish sohalari ────────────────────────────────────────────
  out.push("", "## Rivojlantirish sohalari");
  const devPhrases = [
    "muntazam mashqlar bilan sezilarli oshirish mumkin",
    "maqsadli shug'ullanish orqali tez rivojlanadigan soha",
  ];
  weaknesses.forEach((w, i) => {
    out.push(`- **${w.skill}** (${w.value}/100) — ${pick(devPhrases, seed, i + 3)}`);
  });
  if (temp) {
    out.push(`- ${temp.develop} ustida ishlash uzoq muddatda katta samara beradi`);
  }
  if (weakSubject && weakSubject.percent < 50) {
    out.push(
      `- **${weakSubject.name}** fani (${weakSubject.percent}%) — qo'shimcha mashg'ulotlar bilan mustahkamlash tavsiya etiladi`,
    );
  }
  if (out[out.length - 1] === "## Rivojlantirish sohalari") {
    out.push(
      "- Ko'rsatkichlar muvozanatli — hozirgi sur'atni saqlab, bilimni chuqurlashtirishga e'tibor qarating",
    );
  }

  // ── Shaxsiyat tavsifi ──────────────────────────────────────────────────
  out.push("", "## Shaxsiyat tavsifi");
  if (hollandLetters.length > 0) {
    const parts = hollandLetters
      .map((ch) => `**${HOLLAND_INFO[ch].label}** (${lc(HOLLAND_INFO[ch].desc)})`)
      .join(", ");
    const hollandClosers = [
      "Bu kombinatsiya sizga ham mustaqil, ham jamoaviy muhitda o'zingizni ko'rsatish imkonini beradi.",
      "Bunday profil egalariga qiziqishlariga mos faoliyatda tez o'sish xosdir.",
    ];
    out.push(
      `Holland (RIASEC) profilingiz — **${holland}**: ${parts} yo'nalishlari sizda ustunlik qiladi. ${pick(hollandClosers, seed, 7)}`,
    );
  } else if (sorted[0]) {
    out.push(
      `Natijalaringizda **${sorted[0].skill}** yo'nalishi ustunlik qiladi — bu sohaga tabiiy moyilligingiz bor.`,
    );
  }
  const p2: string[] = [];
  if (input.temperament && temp) {
    p2.push(`Temperament tipingiz — **${input.temperament}** ${temp.emoji}: ${lc(temp.desc)}.`);
  }
  if (iq.length > 0) {
    const avg = Math.round(iq.reduce((s, x) => s + x.score, 0) / iq.length);
    p2.push(
      `Kognitiv ko'rsatkichlaringiz o'rtacha ${avg} ball — "${iqLabel(avg).text}" darajasiga to'g'ri keladi.`,
    );
  }
  if (p2.length > 0) out.push("", p2.join(" "));

  // ── Tavsiya etilgan yo'nalishlar ───────────────────────────────────────
  out.push("", "## Tavsiya etilgan yo'nalishlar");
  if (careers.length > 0) {
    const careerReasons = [
      "test natijalaringizdagi profil bu kasb talablariga yaqin",
      "qiziqishlaringiz va qobiliyat ko'rsatkichlaringiz shu yo'nalishga mos keladi",
      "kuchli tomonlaringiz aynan shu sohada ko'proq ochiladi",
    ];
    careers.slice(0, 3).forEach((c, i) => {
      const reason =
        c.description?.split(". ")[0]?.slice(0, 140) || pick(careerReasons, seed, i + 11);
      out.push(`- **${c.name_uz}** — ${lc(reason)}`);
    });
  } else if (hollandLetters.length > 0) {
    hollandLetters.slice(0, 2).forEach((ch) => {
      out.push(
        `- **${HOLLAND_DIRECTIONS[ch]}** — ${HOLLAND_INFO[ch].label.toLowerCase()} tipdagi profilingizga mos`,
      );
    });
  } else {
    out.push(
      "- Aniq yo'nalish tavsiyasi uchun kasb testlarini yakunlang — profil to'lgach ro'yxat shakllanadi",
    );
  }

  // ── 6 oylik rivojlanish rejasi ─────────────────────────────────────────
  out.push("", "## 6 oylik rivojlanish rejasi");
  const plan: string[] = [];
  const weakest = weaknesses[0] ?? sorted[sorted.length - 1];
  if (weakest) {
    plan.push(
      `**1–2-oy:** ${weakest.skill} ko'nikmasini rivojlantirish — haftasiga 2–3 marta maqsadli mashq (kitob, onlayn kurs yoki amaliy topshiriqlar)`,
    );
  }
  if (careers[0]) {
    plan.push(
      `**2–3-oy:** "${careers[0].name_uz}" kasbi bilan yaqindan tanishish — soha mutaxassisi bilan suhbat yoki kirish darajasidagi kurs`,
    );
  }
  plan.push(
    (input.clubsCount ?? 0) > 0
      ? "**3–4-oy:** to'garak faoliyatida faol qatnashib, natijalarni (tanlov, musobaqa) portfolioga qo'shib borish"
      : "**3–4-oy:** qiziqishingizga mos to'garak yoki klubga yozilish — amaliy tajriba nazariy bilimni mustahkamlaydi",
  );
  if (bestSubject && bestSubject.percent >= 70) {
    plan.push(
      `**4–5-oy:** ${bestSubject.name} fanini olimpiada darajasiga ko'tarish — kuchli fanni chuqurlashtirish eng samarali investitsiya`,
    );
  } else if (weakSubject && weakSubject.percent < 50) {
    plan.push(
      `**4–5-oy:** ${weakSubject.name} fanidan qo'shimcha mashg'ulotlar — asosiy mavzulardagi bo'shliqlarni yopish`,
    );
  }
  plan.push(
    "**6-oy:** testlarni qayta topshirib natijalarni solishtirish — radar ko'rsatkichlari dinamikasi rivojlanishning eng yaxshi o'lchovi",
  );
  plan.forEach((p, i) => out.push(`${i + 1}. ${p}`));

  return out.join("\n");
}
