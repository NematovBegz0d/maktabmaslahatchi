import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  CATEGORY_MAP,
  LEVEL_MAP,
  RESULT_MAP,
  type Achievement,
} from "@/types/social-portfolio";

interface AchievementCardProps {
  achievement: Achievement;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function AchievementCard({
  achievement,
  canEdit,
  onDelete,
  deleting,
}: AchievementCardProps) {
  const cat = CATEGORY_MAP[achievement.category] ?? CATEGORY_MAP.other;
  const lvl = LEVEL_MAP[achievement.level] ?? LEVEL_MAP.school;
  const res = RESULT_MAP[achievement.result] ?? RESULT_MAP.participant;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 p-4 transition hover:shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
        {cat.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground leading-tight">
            {res.icon} {achievement.title}
          </p>
          {canEdit && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              disabled={deleting}
              className="h-7 w-7 shrink-0 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(achievement.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {achievement.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{achievement.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.badge}`}>
            {cat.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lvl.badge}`}>
            {lvl.label}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {res.label}
          </span>
          {achievement.achieved_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(achievement.achieved_at).toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
