import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificationBell } from "@/components/notification-bell";
import { useCounselorNotifications } from "@/hooks/use-counselor-notifications";
import { useAuth } from "@/hooks/use-auth";
import { seenSnapshot, type CounselorNotification } from "@/lib/notifications";

// Router Link → <a> (NotificationList ichida ishlatiladi)
vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, ...p }: any) => (
    <a href={to} {...p}>
      {children}
    </a>
  ),
}));
// Data-qatlami va auth mock — real supabase/env kerak emas
vi.mock("@/hooks/use-counselor-notifications", () => ({ useCounselorNotifications: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const mockNotifs = vi.mocked(useCounselorNotifications);
const mockAuth = vi.mocked(useAuth);

const items: CounselorNotification[] = [
  {
    id: "students-empty",
    signature: "students:0",
    severity: "action",
    title: "O'quvchilarni kiriting",
    body: "Hali o'quvchi yo'q.",
    to: "/students-manage",
  },
  {
    id: "tasks-pending",
    signature: "tasks:2",
    severity: "action",
    title: "2 ta bajarilmagan vazifa",
    body: "Vazifalarni topshiring.",
    to: "/tasks",
  },
];

function setData(data: CounselorNotification[]) {
  mockNotifs.mockReturnValue({ data } as unknown as ReturnType<typeof useCounselorNotifications>);
}

beforeEach(() => {
  localStorage.clear();
  mockAuth.mockReturnValue({ user: { id: "u1" } } as unknown as ReturnType<typeof useAuth>);
  setData(items);
});

describe("NotificationBell — o'qilmagan badge", () => {
  it("localStorage bo'sh bo'lsa — badge bildirishnomalar sonini ko'rsatadi", () => {
    render(<NotificationBell />);
    expect(screen.getByRole("button", { name: /2 ta yangi/i })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hammasi avval ko'rilgan bo'lsa — badge yo'q", () => {
    localStorage.setItem("edulens:notif-seen:u1", JSON.stringify(seenSnapshot(items)));
    render(<NotificationBell />);
    expect(screen.getByRole("button", { name: "Bildirishnomalar" })).toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("bironta bildirishnoma yo'q bo'lsa — badge yo'q", () => {
    setData([]);
    render(<NotificationBell />);
    expect(screen.getByRole("button", { name: "Bildirishnomalar" })).toBeInTheDocument();
  });

  it("9 dan ko'p o'qilmagan — '9+' ko'rsatadi", () => {
    const many = Array.from({ length: 12 }, (_, n) => ({
      ...items[0],
      id: `n-${n}`,
      signature: `s-${n}`,
    }));
    setData(many);
    render(<NotificationBell />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
