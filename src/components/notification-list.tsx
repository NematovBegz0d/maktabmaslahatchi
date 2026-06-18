// Bildirishnomalar ro'yxati — qo'ng'iroq paneli va dashboard kartasida qayta ishlatiladi.
import { Link } from "@tanstack/react-router";
import type { CounselorNotification, NotifSeverity } from "@/lib/notifications";
import {
  UserPlus,
  Users,
  Trophy,
  UsersRound,
  ClipboardList,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  ListTodo,
  Landmark,
  Activity,
  Compass,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

// Har bir bildirishnoma turiga ikonka
const ICONS: Record<string, LucideIcon> = {
  "students-empty": UserPlus,
  "students-untested": Users,
  "career-79": Compass,
  "clubs-empty": Trophy,
  "clubs-no-members": UsersRound,
  "clubs-missing-required": ListChecks,
  "students-no-club": UsersRound,
  "council-empty": Landmark,
  "portfolio-empty": Activity,
  "tasks-pending": ClipboardList,
  "announcements-unread": Megaphone,
};

// Muhimlik darajasiga ranglar
const SEVERITY: Record<NotifSeverity, { icon: string; chip: string }> = {
  action: { icon: "text-destructive", chip: "bg-destructive/10" },
  warning: { icon: "text-amber-600", chip: "bg-amber-500/10" },
  info: { icon: "text-primary", chip: "bg-primary/10" },
};

export function NotificationList({
  items,
  onItemClick,
}: {
  items: CounselorNotification[];
  onItemClick?: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">Hammasi joyida!</p>
        <p className="text-xs text-muted-foreground">Hozircha bajariladigan ish yo'q. 🎉</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((n) => {
        const Icon = ICONS[n.id] ?? ListTodo;
        const sev = SEVERITY[n.severity];
        return (
          <li key={n.id}>
            <Link
              to={n.to}
              onClick={onItemClick}
              className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sev.chip}`}
              >
                <Icon className={`h-4 w-4 ${sev.icon}`} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </div>
              <ArrowRight
                className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
