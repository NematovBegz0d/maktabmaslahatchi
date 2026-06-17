import { describe, it, expect } from "vitest";
import { cn, unwrap } from "@/lib/utils";

describe("cn (classnames utility)", () => {
  it("merges simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("drops falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts — last one wins", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("handles conditional objects", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("handles an empty call", () => {
    expect(cn()).toBe("");
  });
});

describe("unwrap (Supabase javob ochuvchi)", () => {
  it("xato bo'lmasa data'ni qaytaradi", () => {
    expect(unwrap({ data: [1, 2, 3], error: null })).toEqual([1, 2, 3]);
  });

  it("data null bo'lsa ham qaytaradi (xato yo'q)", () => {
    expect(unwrap({ data: null, error: null })).toBeNull();
  });

  it("xato bo'lsa throw qiladi (jim yutmaydi)", () => {
    expect(() => unwrap({ data: null, error: { message: "RLS rad etdi" } })).toThrow(
      "RLS rad etdi",
    );
  });

  it("throw qilingan xato Error tipida", () => {
    try {
      unwrap({ data: null, error: { message: "tarmoq xatosi" } });
      expect.unreachable("throw bo'lishi kerak edi");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
