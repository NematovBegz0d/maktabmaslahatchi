import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationList } from "@/components/notification-list";
import type { CounselorNotification } from "@/lib/notifications";

// TanStack Link → oddiy <a> (href = to)
vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, ...p }: any) => (
    <a href={to} {...p}>
      {children}
    </a>
  ),
}));

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

describe("NotificationList", () => {
  it("bo'sh ro'yxatda 'Hammasi joyida!' ko'rsatadi", () => {
    render(<NotificationList items={[]} />);
    expect(screen.getByText("Hammasi joyida!")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("har bildirishnoma uchun sarlavha, matn va havola chiqaradi", () => {
    render(<NotificationList items={items} />);
    expect(screen.getByText("O'quvchilarni kiriting")).toBeInTheDocument();
    expect(screen.getByText("2 ta bajarilmagan vazifa")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/students-manage");
    expect(links[1]).toHaveAttribute("href", "/tasks");
  });

  it("element bosilganda onItemClick chaqiriladi", async () => {
    const onItemClick = vi.fn();
    render(<NotificationList items={items} onItemClick={onItemClick} />);
    await userEvent.click(screen.getByText("O'quvchilarni kiriting"));
    expect(onItemClick).toHaveBeenCalledOnce();
  });
});
