import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  School,
  Users,
  ScrollText,
  ClipboardList,
  Mail,
  Trophy,
  Newspaper,
  Landmark,
  Inbox,
} from "lucide-react";

// Super admin paneli ichki navigatsiyasi
const TABS = [
  { to: "/admin" as const, icon: LayoutDashboard, label: "Umumiy" },
  { to: "/admin/schools" as const, icon: School, label: "Maktablar" },
  { to: "/admin/counselors" as const, icon: Users, label: "Maslahatchilar" },
  { to: "/admin/tasks" as const, icon: ClipboardList, label: "Vazifalar" },
  { to: "/admin/messages" as const, icon: Mail, label: "Xabarlar" },
  { to: "/admin/rating" as const, icon: Trophy, label: "Reyting" },
  { to: "/admin/news" as const, icon: Newspaper, label: "Yangiliklar" },
  { to: "/admin/center-clubs" as const, icon: Landmark, label: "To'garaklar" },
  { to: "/admin/applications" as const, icon: Inbox, label: "Arizalar" },
  { to: "/admin/activity" as const, icon: ScrollText, label: "Jurnal" },
];

export function AdminTabs() {
  return (
    <nav
      className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1"
      aria-label="Admin bo'limlari"
    >
      {TABS.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/admin" }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{
            className:
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-background text-foreground shadow-sm",
          }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
