import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/hooks/use-auth";

// Router Link → <a> (activeProps/activeOptions DOM'ga tushmasligi uchun ajratiladi)
vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, activeProps, activeOptions, ...p }: any) => {
    void activeProps;
    void activeOptions;
    return (
      <a href={to} {...p}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const mockAuth = vi.mocked(useAuth);
function setRole(role: string | null) {
  mockAuth.mockReturnValue({ role } as unknown as ReturnType<typeof useAuth>);
}

beforeEach(() => {
  document.body.className = "";
});

describe("MobileBottomNav — rolga qarab havolalar", () => {
  it("o'quvchi roli — 5 ta asosiy havola (Asosiy/Testlar/Profil)", () => {
    setRole("student");
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /Asosiy/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /Testlar/ })).toHaveAttribute("href", "/my-tests");
    expect(screen.getByRole("link", { name: /Profil/ })).toHaveAttribute("href", "/my-profile");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("maslahatchi roli — O'quvchilar va Tahlil havolalari", () => {
    setRole("counselor");
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /O'quvchilar/ })).toHaveAttribute("href", "/students");
    expect(screen.getByRole("link", { name: /Tahlil/ })).toHaveAttribute("href", "/analytics");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("admin roli — Boshqaruv havolasi", () => {
    setRole("admin");
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /Boshqaruv/ })).toHaveAttribute("href", "/admin");
  });

  it("rol noma'lum (null) — panel ko'rsatilmaydi va body padding qo'shilmaydi", () => {
    setRole(null);
    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
    expect(document.body.classList.contains("has-mobile-nav")).toBe(false);
  });

  it("panel mavjud bo'lsa — body'ga has-mobile-nav klassi qo'shiladi", () => {
    setRole("student");
    render(<MobileBottomNav />);
    expect(document.body.classList.contains("has-mobile-nav")).toBe(true);
  });
});
