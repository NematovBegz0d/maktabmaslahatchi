import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  User as UserIcon,
  Users,
  TrendingUp,
  Moon,
  Sun,
  Menu,
  Trophy,
  Activity,
  Landmark,
  Shield,
  Newspaper,
} from "lucide-react";

const NAV_LINK =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";
const NAV_LINK_ACTIVE =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-accent text-foreground";

export function AppHeader() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  // Rol hali yuklanmaganda (null) rolga bog'liq havolalarni ko'rsatmaymiz —
  // aks holda o'quvchi havolalari bir lahza "flash" qilib keyin yo'qoladi.
  const roleKnown = role !== null;
  const isAdmin = role === "admin";
  const isCounselor = role === "counselor";
  const isStaff = isAdmin || isCounselor;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  // Nav havolalari ro'yxati — rol bo'yicha
  const navLinks = [
    // Super admin: asosiy bo'limlar to'g'ridan-to'g'ri navbarda
    // (qolganlari — Maktablar, Xabarlar, Jurnal — /admin ichidagi tablarda)
    {
      to: "/admin" as const,
      icon: Shield,
      label: "Boshqaruv",
      show: roleKnown && isAdmin,
      exact: true,
    },
    {
      to: "/admin/counselors" as const,
      icon: Users,
      label: "Maslahatchilar",
      show: roleKnown && isAdmin,
    },
    {
      to: "/admin/tasks" as const,
      icon: ClipboardList,
      label: "Vazifalar",
      show: roleKnown && isAdmin,
    },
    {
      to: "/admin/news" as const,
      icon: Newspaper,
      label: "Yangiliklar",
      show: roleKnown && isAdmin,
    },
    {
      to: "/admin/center-clubs" as const,
      icon: Landmark,
      label: "To'garaklar",
      show: roleKnown && isAdmin,
    },
    {
      to: "/admin/rating" as const,
      icon: Trophy,
      label: "Reyting",
      show: roleKnown && isAdmin,
    },
    {
      to: "/dashboard" as const,
      icon: LayoutDashboard,
      label: t("nav_dashboard"),
      show: !roleKnown || !isAdmin,
    },
    // O'quvchi (faqat rol aniqlangach)
    {
      to: "/my-tests" as const,
      icon: ClipboardList,
      label: t("nav_tests"),
      show: roleKnown && !isStaff,
    },
    { to: "/my-clubs" as const, icon: Trophy, label: t("nav_clubs"), show: roleKnown && !isStaff },
    {
      to: "/social-portfolio" as const,
      icon: Activity,
      label: t("nav_social"),
      show: roleKnown && !isStaff,
    },
    {
      to: "/council" as const,
      icon: Landmark,
      label: t("nav_council"),
      show: roleKnown && !isStaff,
    },
    {
      to: "/my-profile" as const,
      icon: UserIcon,
      label: t("nav_profile"),
      show: roleKnown && !isStaff,
    },
    // Maslahatchi: maktab ichki ishlari (super admin bularga aralashmaydi —
    // uning ishi /admin paneli: nazorat, to'garaklar, yangiliklar)
    {
      to: "/students" as const,
      icon: Users,
      label: t("nav_students"),
      show: roleKnown && isCounselor,
    },
    { to: "/clubs" as const, icon: Trophy, label: t("nav_clubs"), show: roleKnown && isCounselor },
    // Maslahatchi: admindan kelgan vazifalar va xabarlar
    {
      to: "/tasks" as const,
      icon: ClipboardList,
      label: "Vazifalar",
      show: roleKnown && isCounselor,
    },
    {
      to: "/council" as const,
      icon: Landmark,
      label: t("nav_council"),
      show: roleKnown && isCounselor,
    },
    {
      to: "/analytics" as const,
      icon: TrendingUp,
      label: t("nav_analytics"),
      show: roleKnown && isCounselor,
    },
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/dashboard" aria-label="EduLens — bosh sahifa">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Asosiy navigatsiya">
          {navLinks.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: exact ?? false }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeProps={{
                className: "rounded-lg px-3 py-2 text-sm font-medium bg-accent text-foreground",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* O'ng taraf: bildirishnoma (maslahatchi), til, mavzu, chiqish */}
        <div className="flex items-center gap-1">
          {roleKnown && isCounselor && <NotificationBell />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "uz" ? "ru" : "uz")}
            aria-label={locale === "uz" ? "Rus tiliga o'tish" : "O'zbek tiliga o'tish"}
            className="text-xs font-semibold"
          >
            {locale === "uz" ? "RU" : "UZ"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark" ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            aria-label={t("nav_signout")}
            className="hidden md:inline-flex"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("nav_signout")}
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" aria-label="Menyuni ochish">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
              <div className="flex h-16 items-center border-b px-4">
                <Logo />
              </div>
              <nav className="flex flex-col gap-1 p-3" aria-label="Mobil navigatsiya">
                {navLinks.map(({ to, icon: Icon, label, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: exact ?? false }}
                    className={NAV_LINK}
                    activeProps={{ className: NAV_LINK_ACTIVE }}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <div className="mt-2 border-t pt-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className={
                      NAV_LINK + " w-full text-left text-destructive hover:text-destructive"
                    }
                    aria-label={t("nav_signout")}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {t("nav_signout")}
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
