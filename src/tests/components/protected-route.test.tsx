import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";

// ─── Mocklar ─────────────────────────────────────────────────────────────────
// vi.hoisted — mock factory'dan oldin tayyor bo'lishi uchun (hoisting muammosi)
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, ...p }: any) => <a {...p}>{children}</a>,
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
type AuthState = ReturnType<typeof useAuth>;
function auth(partial: Partial<AuthState>): AuthState {
  return {
    session: null,
    user: null,
    role: null,
    schoolId: null,
    isStaff: false,
    loading: false,
    error: null,
    retry: vi.fn(),
    ...partial,
  } as AuthState;
}

const fakeUser = { id: "u1" } as AuthState["user"];

beforeEach(() => {
  navigateMock.mockClear();
  mockedUseAuth.mockReset();
});

describe("ProtectedRoute", () => {
  it("yuklanayotganda bolani ko'rsatmaydi (spinner)", () => {
    mockedUseAuth.mockReturnValue(auth({ loading: true }));
    render(
      <ProtectedRoute>
        <p>MAXFIY</p>
      </ProtectedRoute>,
    );
    expect(screen.queryByText("MAXFIY")).not.toBeInTheDocument();
  });

  it("user yo'q bo'lsa /auth'ga yo'naltiradi", () => {
    mockedUseAuth.mockReturnValue(auth({ loading: false, user: null }));
    render(
      <ProtectedRoute>
        <p>MAXFIY</p>
      </ProtectedRoute>,
    );
    expect(navigateMock).toHaveBeenCalledWith({ to: "/auth" });
  });

  it("rol xatosida 'student'ga tushmasdan qayta urinish ko'rsatadi", async () => {
    const retry = vi.fn();
    mockedUseAuth.mockReturnValue(
      auth({ user: fakeUser, role: null, error: new Error("tarmoq"), retry }),
    );
    render(
      <ProtectedRoute>
        <p>MAXFIY</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText(/Ma'lumotni yuklab bo'lmadi/i)).toBeInTheDocument();
    expect(screen.queryByText("MAXFIY")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Qayta urinish/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("rol yetarli emas bo'lsa 'Ruxsat yo'q'", () => {
    mockedUseAuth.mockReturnValue(auth({ user: fakeUser, role: "student" }));
    render(
      <ProtectedRoute requiredRoles={["admin"]}>
        <p>MAXFIY</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText(/Ruxsat yo'q/i)).toBeInTheDocument();
    expect(screen.queryByText("MAXFIY")).not.toBeInTheDocument();
  });

  it("rol mos kelsa bolani ko'rsatadi", () => {
    mockedUseAuth.mockReturnValue(auth({ user: fakeUser, role: "admin" }));
    render(
      <ProtectedRoute requiredRoles={["admin"]}>
        <p>MAXFIY</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText("MAXFIY")).toBeInTheDocument();
  });
});
