import { describe, it, expect } from "vitest";
import { buildLocalAiSummary, type LocalAiInput } from "@/lib/local-ai-summary";

// To'liq profil — barcha bo'limlar to'ldirilishi kerak bo'lgan namuna
const fullInput: LocalAiInput = {
  classNumber: 9,
  radar: [
    { skill: "Mantiqiy fikrlash", value: 82 },
    { skill: "Ijodkorlik", value: 74 },
    { skill: "Muloqot", value: 61 },
    { skill: "Diqqat", value: 48 },
  ],
  iq: [
    { type: "verbal", score: 112 },
    { type: "mantiqiy", score: 108 },
  ],
  hollandCode: "RIA",
  temperament: "Sangvinik",
  topCareers: [
    { name_uz: "Dasturchi", description: "Dasturiy ta'minot yaratadi. Tizimlar quradi." },
    { name_uz: "Muhandis", description: null },
  ],
  subjects: [
    { name: "Matematika", percent: 85 },
    { name: "Ona tili", percent: 42 },
  ],
  clubsCount: 1,
};

// Matnni "## Sarlavha" bo'limlariga ajratish (bo'lim ichini tekshirish uchun)
function section(text: string, title: string): string {
  const m = text.split(/^## /m).find((s) => s.startsWith(title));
  expect(m, `"${title}" bo'limi topilmadi`).toBeDefined();
  return m!;
}

describe("buildLocalAiSummary", () => {
  it("ma'lumot umuman bo'lmasa null qaytaradi", () => {
    expect(buildLocalAiSummary({})).toBeNull();
    expect(buildLocalAiSummary({ radar: [], iq: [], subjects: [], topCareers: [] })).toBeNull();
  });

  it("deterministik: bir xil ma'lumot → bir xil matn", () => {
    expect(buildLocalAiSummary(fullInput)).toBe(buildLocalAiSummary(fullInput));
  });

  it("barcha 5 bo'lim sarlavhasi mavjud (analyze-profile tuzilmasi)", () => {
    const text = buildLocalAiSummary(fullInput)!;
    for (const h of [
      "## Kuchli tomonlar",
      "## Rivojlantirish sohalari",
      "## Shaxsiyat tavsifi",
      "## Tavsiya etilgan yo'nalishlar",
      "## 6 oylik rivojlanish rejasi",
    ]) {
      expect(text).toContain(h);
    }
  });

  it("kuchli radar ko'nikmalar Kuchli tomonlarda, zaifi Rivojlantirishda", () => {
    const text = buildLocalAiSummary(fullInput)!;
    expect(section(text, "Kuchli tomonlar")).toContain("Mantiqiy fikrlash");
    expect(section(text, "Kuchli tomonlar")).toContain("82/100");
    expect(section(text, "Rivojlantirish sohalari")).toContain("Diqqat");
    expect(section(text, "Rivojlantirish sohalari")).toContain("48/100");
  });

  it("fan natijalari hisobga olinadi (kuchli va zaif fan)", () => {
    const text = buildLocalAiSummary(fullInput)!;
    expect(section(text, "Kuchli tomonlar")).toContain("Matematika");
    expect(section(text, "Rivojlantirish sohalari")).toContain("Ona tili");
  });

  it("Holland kodi va temperament shaxsiyat tavsifida ochiladi", () => {
    const text = buildLocalAiSummary(fullInput)!;
    const s = section(text, "Shaxsiyat tavsifi");
    expect(s).toContain("RIA");
    expect(s).toContain("Realistik");
    expect(s).toContain("Sangvinik");
    // IQ o'rtachasi: (112+108)/2 = 110
    expect(s).toContain("110 ball");
  });

  it("mos kasblar tavsiya bo'limiga kiradi", () => {
    const text = buildLocalAiSummary(fullInput)!;
    const s = section(text, "Tavsiya etilgan yo'nalishlar");
    expect(s).toContain("Dasturchi");
    expect(s).toContain("Muhandis");
  });

  it("6 oylik reja raqamlangan va kasb/zaif ko'nikmani qamraydi", () => {
    const text = buildLocalAiSummary(fullInput)!;
    const s = section(text, "6 oylik rivojlanish rejasi");
    expect(s).toMatch(/^1\. /m);
    expect(s).toContain("Diqqat");
    expect(s).toContain("Dasturchi");
  });

  it("kasblar bo'lmasa Holland harfidan zaxira yo'nalish beradi", () => {
    const text = buildLocalAiSummary({ hollandCode: "RS", topCareers: [] })!;
    expect(section(text, "Tavsiya etilgan yo'nalishlar")).toContain(
      "Muhandislik, texnika va amaliy kasblar",
    );
  });

  it("minimal ma'lumot (faqat radar) bilan ham ishlaydi", () => {
    const text = buildLocalAiSummary({ radar: [{ skill: "Muloqot", value: 70 }] });
    expect(text).not.toBeNull();
    expect(text).toContain("## Kuchli tomonlar");
    expect(text).toContain("Muloqot");
  });

  it("noma'lum Holland harflari va temperament matnni buzmaydi", () => {
    const text = buildLocalAiSummary({
      radar: [{ skill: "Diqqat", value: 65 }],
      hollandCode: "XYZ",
      temperament: "Nomavjud",
    });
    expect(text).not.toBeNull();
    expect(text).not.toContain("undefined");
  });
});
