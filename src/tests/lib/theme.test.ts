import { describe, it, expect, beforeEach, vi } from "vitest";

// Minimal localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// matchMedia mock (no dark preference by default)
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: query.includes("dark") ? false : true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

describe("Theme persistence", () => {
  beforeEach(() => localStorageMock.clear());

  it("stores chosen theme in localStorage", () => {
    localStorage.setItem("edulens-theme", "dark");
    expect(localStorage.getItem("edulens-theme")).toBe("dark");
  });

  it("returns null when no theme is stored", () => {
    expect(localStorage.getItem("edulens-theme")).toBeNull();
  });

  it("overwrites stored theme", () => {
    localStorage.setItem("edulens-theme", "dark");
    localStorage.setItem("edulens-theme", "light");
    expect(localStorage.getItem("edulens-theme")).toBe("light");
  });
});
