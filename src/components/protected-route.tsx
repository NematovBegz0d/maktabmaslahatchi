import { useEffect, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Logo } from "./logo";
import { ShieldX } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: Props) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Session va role ikkalasi yuklanguncha spinner
  if (loading || !user || role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse"><Logo /></div>
      </div>
    );
  }

  // Rol tekshiruvi
  if (requiredRoles && !requiredRoles.includes(role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Ruxsat yo'q</h1>
        <p className="max-w-sm text-muted-foreground">
          Bu sahifaga kirish uchun sizda yetarli huquq yo'q.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Bosh sahifaga qaytish</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
