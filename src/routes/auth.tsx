import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import { GraduationCap, UserCog } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Kirish — EduLens" }] }),
  component: AuthPage,
});

// Guvohnoma seriyasi formatini tekshirish: harf+raqam, @ yo'q
function isPassportSeries(val: string): boolean {
  return !val.includes("@") && /^[a-zA-Zа-яА-ЯёЁ]{2,3}\d{7}$/i.test(val.trim());
}

// Guvohnoma → Supabase email formatiga o'tkazish
function toStudentEmail(series: string): string {
  return `${series.toLowerCase().trim()}@edulab.uz`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && user) window.location.replace("/dashboard");
  }, [user, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <h1 className="mb-1 text-xl font-bold text-foreground">Tizimga kirish</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Maslahatchi yoki o'quvchi sifatida kiring
          </p>
          <LoginForm />
        </div>

        {/* Yordam */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/50 p-3 text-center">
            <UserCog className="mx-auto mb-1.5 h-5 w-5 text-indigo-500" />
            <p className="text-xs font-semibold text-foreground">Maslahatchi</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Email bilan kiradi</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-3 text-center">
            <GraduationCap className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" />
            <p className="text-xs font-semibold text-foreground">O'quvchi</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Guvohnoma seriyasi bilan</p>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← {t("go_home")}</Link>
        </p>
      </div>
    </div>
  );
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { t } = useI18n();

  const isStudent = loginId.length > 0 && !loginId.includes("@");
  const inputType = loginId.includes("@") ? "email" : "text";

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        clearInterval(tick);
      } else {
        setCountdown(remaining);
      }
    }, 500);
    return () => clearInterval(tick);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setBusy(true);

    // Email aniqlash: @ bo'lmasa → guvohnoma seriyasi → @edulab.uz
    const email = loginId.includes("@")
      ? loginId.trim()
      : toStudentEmail(loginId);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      console.error("[Auth] Login error:", error.message, error.status);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        setCountdown(LOCKOUT_SECONDS);
        toast.error(`${MAX_ATTEMPTS} marta xato. ${LOCKOUT_SECONDS} soniya kuting.`);
      } else {
        // Foydalanuvchiga umumiy xabar; texnik detal yuqorida console.error'da
        toast.error("Login yoki parol noto'g'ri. Tekshirib qayta urining.");
      }
      return;
    }

    toast.success(`${t("dashboard_welcome")}!`);
    // TanStack Start SSR da navigate() ishlamaydi — hard redirect ishlatamiz
    window.location.replace("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-id">
          {isStudent ? "Guvohnoma seriyasi" : "Email yoki guvohnoma seriyasi"}
        </Label>
        <div className="relative">
          <Input
            id="login-id"
            type={inputType}
            required
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="ibh1234567 yoki email@misol.uz"
            disabled={isLocked}
            className={isStudent ? "border-emerald-300 focus-visible:ring-emerald-400" : ""}
          />
          {isStudent && loginId.length > 0 && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600">
              O'quvchi
            </span>
          )}
          {loginId.includes("@") && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600">
              Maslahatchi
            </span>
          )}
        </div>
        {isStudent && (
          <p className="text-xs text-muted-foreground">
            Misol: <span className="font-mono font-semibold">ibh1234567</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{t("auth_password")}</Label>
        <Input
          id="login-password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLocked}
        />
      </div>

      {isLocked && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive"
          role="alert" aria-live="assertive">
          Kirish bloklangan — {countdown} soniyadan so'ng qayta urinish
        </p>
      )}

      <Button type="submit" className="w-full" disabled={busy || isLocked}>
        {isLocked ? `${countdown}s kutish...` : busy ? "Kirilmoqda..." : t("auth_login")}
      </Button>
    </form>
  );
}
