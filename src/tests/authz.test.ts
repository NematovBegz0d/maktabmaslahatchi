import { describe, it, expect } from "vitest";
import { canAnalyze, type AuthzCaller } from "../../supabase/functions/_shared/authz";

// Maktab UUID'lari (test)
const SCHOOL_A = "11111111-1111-1111-1111-111111111111";
const SCHOOL_B = "22222222-2222-2222-2222-222222222222";

const admin = (schoolId: string | null = null): AuthzCaller => ({
  id: "admin-1",
  role: "admin",
  schoolId,
});
const counselorA: AuthzCaller = { id: "c-a", role: "counselor", schoolId: SCHOOL_A };
const counselorNoSchool: AuthzCaller = { id: "c-x", role: "counselor", schoolId: null };
const student: AuthzCaller = { id: "s-1", role: "student", schoolId: SCHOOL_A };
const nullRole: AuthzCaller = { id: "u-?", role: null, schoolId: SCHOOL_A };

describe("canAnalyze — AI tahlil avtorizatsiyasi", () => {
  it("o'zi uchun — har doim ruxsat (rol/maktabdan qat'i nazar)", () => {
    expect(canAnalyze(student, SCHOOL_A, true)).toBe(true);
    expect(canAnalyze(nullRole, null, true)).toBe(true);
    expect(canAnalyze(counselorNoSchool, null, true)).toBe(true);
  });

  it("admin — istalgan maktab o'quvchisi uchun ruxsat", () => {
    expect(canAnalyze(admin(), SCHOOL_B, false)).toBe(true);
    expect(canAnalyze(admin(SCHOOL_A), SCHOOL_B, false)).toBe(true);
    expect(canAnalyze(admin(), null, false)).toBe(true);
  });

  it("counselor — FAQAT o'z maktabi o'quvchisi uchun ruxsat", () => {
    expect(canAnalyze(counselorA, SCHOOL_A, false)).toBe(true);
  });

  it("counselor — BOSHQA maktab o'quvchisi uchun RAD (asosiy tirqish)", () => {
    expect(canAnalyze(counselorA, SCHOOL_B, false)).toBe(false);
  });

  it("counselor — maktabsiz (NULL) bo'lsa RAD (fail-closed)", () => {
    expect(canAnalyze(counselorNoSchool, SCHOOL_A, false)).toBe(false);
    expect(canAnalyze(counselorNoSchool, null, false)).toBe(false);
  });

  it("student — boshqa o'quvchi uchun RAD", () => {
    expect(canAnalyze(student, SCHOOL_A, false)).toBe(false);
    expect(canAnalyze(student, SCHOOL_B, false)).toBe(false);
  });

  it("noaniq rol (null) — boshqa o'quvchi uchun RAD", () => {
    expect(canAnalyze(nullRole, SCHOOL_A, false)).toBe(false);
  });
});
