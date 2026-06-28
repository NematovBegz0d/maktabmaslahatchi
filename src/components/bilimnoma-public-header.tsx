import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/hooks/use-auth";

// Bilimnoma ochiq sahifalari ham login'siz, ham ilova ichidan ochiladi.
// Tizimga kirgan foydalanuvchiga to'liq ilova navbari (AppHeader) ko'rsatamiz —
// shunda "Tizimga kirish" chiqib, go'yo chiqib ketgandek tuyulmaydi.
// Anon (mehmon)ga esa ochiq header + "Tizimga kirish" CTA chiqadi.
export function BilimnomaPublicHeader() {
  const { user, loading } = useAuth();

  if (user) return <AppHeader />;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link to="/">
          <Logo />
        </Link>
        {/* Auth holati aniqlanmaguncha tugmani ko'rsatmaymiz (flash bo'lmasin) */}
        {!loading && (
          <Link
            to="/auth"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700"
          >
            Tizimga kirish
          </Link>
        )}
      </div>
    </header>
  );
}
