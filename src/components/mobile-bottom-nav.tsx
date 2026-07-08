// Mobil pastki navigatsiya paneli — telefonда eng muhim 4-5 bo'limga bir tegishda
// kirish (native ilovalardek). Faqat mobil (md:hidden); to'liq ro'yxat header'dagi
// hamburger menyuda qoladi. Rolga qarab havolalar to'plami o'zgaradi.
//
// Kontent panel ostida qolib ketmasligi uchun mount bo'lganda <body>ga
// `has-mobile-nav` klassi qo'shiladi (styles.css mobilda pastki padding beradi),
// unmount'da olib tashlanadi — shu sababli test sahifasi kabi panel ko'rsatilmagan
// joylarda ortiqcha bo'sh joy paydo bo'lmaydi.
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  ClipboardList,
  Trophy,
  Activity,
  User as UserIcon,
  Users,
  TrendingUp,
  Shield,
  Landmark,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: NavTo;
  icon: LucideIcon;
  label: string;
  exact: boolean;
}

// Faqat haqiqiy (mavjud) route'lar — Link'ning qat'iy tipiga mos.
type NavTo =
  | "/dashboard"
  | "/my-tests"
  | "/my-clubs"
  | "/social-portfolio"
  | "/my-profile"
  | "/students"
  | "/clubs"
  | "/tasks"
  | "/analytics"
  | "/admin"
  | "/admin/tasks"
  | "/admin/center-clubs"
  | "/admin/rating"
  | "/admin/news";

// O'quvchi / ota-ona uchun
const STUDENT: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Asosiy", exact: false },
  { to: "/my-tests", icon: ClipboardList, label: "Testlar", exact: false },
  { to: "/my-clubs", icon: Trophy, label: "Klublar", exact: false },
  { to: "/social-portfolio", icon: Activity, label: "Portfel", exact: false },
  { to: "/my-profile", icon: UserIcon, label: "Profil", exact: false },
];

// Maslahatchi uchun
const COUNSELOR: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Asosiy", exact: false },
  { to: "/students", icon: Users, label: "O'quvchilar", exact: false },
  { to: "/clubs", icon: Trophy, label: "Klublar", exact: false },
  { to: "/tasks", icon: ClipboardList, label: "Vazifalar", exact: false },
  { to: "/analytics", icon: TrendingUp, label: "Tahlil", exact: false },
];

// Super admin uchun
const ADMIN: NavItem[] = [
  { to: "/admin", icon: Shield, label: "Boshqaruv", exact: true },
  { to: "/admin/tasks", icon: ClipboardList, label: "Vazifalar", exact: false },
  { to: "/admin/center-clubs", icon: Landmark, label: "To'garaklar", exact: false },
  { to: "/admin/rating", icon: Trophy, label: "Reyting", exact: false },
  { to: "/admin/news", icon: Newspaper, label: "Yangiliklar", exact: false },
];

const ITEM =
  "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors";
const ITEM_ACTIVE =
  "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-primary";

export function MobileBottomNav() {
  const { role } = useAuth();

  const items: NavItem[] =
    role === "admin" ? ADMIN : role === "counselor" ? COUNSELOR : role ? STUDENT : [];

  // Panel mavjud bo'lgandagina kontentга pastki bo'shliq beramiz (mobil).
  const hasNav = items.length > 0;
  useEffect(() => {
    if (!hasNav) return;
    document.body.classList.add("has-mobile-nav");
    return () => document.body.classList.remove("has-mobile-nav");
  }, [hasNav]);

  if (!hasNav) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobil asosiy navigatsiya"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ to, icon: Icon, label, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className={ITEM}
            activeProps={{ className: ITEM_ACTIVE }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="w-full truncate text-center">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
