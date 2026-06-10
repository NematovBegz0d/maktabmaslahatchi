import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CLUB_COLOR_MAP, type Club, type ClubColor } from "@/types/clubs";
import type { AppRole } from "@/hooks/use-auth";

interface ClubCardProps {
  club: Club;
  memberCount?: number;
  isMember?: boolean;
  role?: AppRole | null;
  /** Namuna (fallback) rejimida — detal sahifaga o'tib bo'lmaydi */
  disabled?: boolean;
}

export function ClubCard({
  club,
  memberCount,
  isMember,
  role,
  disabled,
}: ClubCardProps) {
  const { t } = useI18n();
  const colors = CLUB_COLOR_MAP[club.color as ClubColor] ?? CLUB_COLOR_MAP.blue;
  const isAdmin = role === "admin";

  const ctaLabel = isAdmin
    ? t("clubs_manage")
    : isMember
      ? t("clubs_details")
      : t("clubs_view");

  const inner = (
    <Card
      className={`group relative h-full overflow-hidden border transition-all ${colors.border} ${
        disabled ? "opacity-70" : "hover:-translate-y-0.5 hover:shadow-lg"
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Yuqori rang chizig'i */}
      <div className={`h-1.5 w-full ${colors.bg}`} />

      <CardContent className="flex h-full flex-col gap-4 p-5">
        {/* Icon + Nom + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${colors.soft}`}
            >
              {club.icon}
            </span>
            <div>
              <h3 className="font-semibold text-foreground leading-tight">{club.name}</h3>
              {isMember && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> {t("clubs_member")}
                </span>
              )}
            </div>
          </div>

          {/* A'zolar soni (admin uchun) */}
          {isAdmin && memberCount !== undefined && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
            >
              <Users className="h-3 w-3" />
              {memberCount}
            </span>
          )}
        </div>

        {/* Tavsif */}
        <p className="line-clamp-2 text-sm text-muted-foreground flex-1">{club.description}</p>

        {/* Fokus yo'nalishlari */}
        <div className="flex flex-wrap gap-1.5">
          {club.focus_area
            .split(", ")
            .filter(Boolean)
            .map((tag) => (
              <Badge key={tag} variant="secondary" className={`text-xs ${colors.badge}`}>
                {tag}
              </Badge>
            ))}
        </div>

        {/* CTA — butun karta bosiladi, shuning uchun bu vizual element (nested link bo'lmasligi uchun) */}
        <div
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
            disabled
              ? "bg-muted text-muted-foreground"
              : isMember
                ? "border border-input bg-background text-foreground group-hover:bg-accent"
                : "bg-primary text-primary-foreground group-hover:opacity-90"
          }`}
        >
          {ctaLabel}
          {!disabled && <ArrowRight className="h-3.5 w-3.5" />}
        </div>
      </CardContent>
    </Card>
  );

  // Namuna rejimida — bosib bo'lmaydi
  if (disabled) {
    return inner;
  }

  // Butun karta bosiladigan havola
  return (
    <Link
      to="/clubs/$id"
      params={{ id: club.id }}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      {inner}
    </Link>
  );
}
