import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { SocialPortfolio } from "@/components/social-portfolio";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/social-portfolio")({
  head: () => ({ meta: [{ title: "Ijtimoiy Portfolio — EduLens" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["student"]}>
      <SocialPortfolioPage />
    </ProtectedRoute>
  ),
});

function SocialPortfolioPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Activity className="h-7 w-7 text-primary" /> {t("sp_title")}
          </h1>
          <p className="mt-1.5 text-muted-foreground">{t("sp_subtitle")}</p>
        </div>

        {user && <SocialPortfolio studentId={user.id} canEdit={false} />}
      </main>
    </div>
  );
}
