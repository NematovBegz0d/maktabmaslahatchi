import { CLUB_COLOR_MAP, type ClubColor } from "@/types/clubs";

interface ClubBadgeProps {
  name: string;
  icon: string;
  color: ClubColor;
  joinedAt?: string;
  size?: "sm" | "md";
}

export function ClubBadge({ name, icon, color, joinedAt, size = "md" }: ClubBadgeProps) {
  const colors = CLUB_COLOR_MAP[color] ?? CLUB_COLOR_MAP.blue;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`}
      >
        <span>{icon}</span>
        {name}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${colors.soft} ${colors.border}`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold ${colors.text}`}>{name}</p>
        {joinedAt && (
          <p className="text-xs text-muted-foreground">
            {new Date(joinedAt).toLocaleDateString("uz-UZ", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            da qo'shilgan
          </p>
        )}
      </div>
    </div>
  );
}
