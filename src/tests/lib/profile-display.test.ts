import { describe, it, expect } from "vitest";
import { iqLabel, RADAR_COLORS } from "@/lib/profile-display";

describe("iqLabel (sifat darajasi chegaralari)", () => {
  it("130+ → A'lo darajali", () => {
    expect(iqLabel(130).text).toBe("A'lo darajali");
    expect(iqLabel(145).text).toBe("A'lo darajali");
  });
  it("115-129 → Yuqori", () => {
    expect(iqLabel(115).text).toBe("Yuqori");
    expect(iqLabel(129).text).toBe("Yuqori");
  });
  it("100-114 → O'rtadan yuqori", () => {
    expect(iqLabel(100).text).toBe("O'rtadan yuqori");
    expect(iqLabel(114).text).toBe("O'rtadan yuqori");
  });
  it("85-99 → O'rtacha", () => {
    expect(iqLabel(85).text).toBe("O'rtacha");
    expect(iqLabel(99).text).toBe("O'rtacha");
  });
  it("<85 → Rivojlantirilishi kerak", () => {
    expect(iqLabel(84).text).toBe("Rivojlantirilishi kerak");
    expect(iqLabel(70).text).toBe("Rivojlantirilishi kerak");
  });
  it("har darajada Tailwind rang klassi bor", () => {
    [70, 90, 105, 120, 135].forEach((s) => expect(iqLabel(s).color).toMatch(/^text-/));
  });
});

describe("RADAR_COLORS", () => {
  it("6 ta qobiliyat uchun 6 ta rang", () => {
    expect(RADAR_COLORS).toHaveLength(6);
  });
  it("hammasi hex rang", () => {
    RADAR_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/));
  });
});
