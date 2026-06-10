import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { POSITION_MAP, type CouncilMemberWithProfile } from "@/types/council";

interface Props {
  member: CouncilMemberWithProfile;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function CouncilMemberCard({ member, canEdit, onDelete, deleting }: Props) {
  const pos = POSITION_MAP[member.position] ?? POSITION_MAP.member;
  const name = member.profiles?.full_name ?? "Noma'lum";
  const cls = member.profiles?.class_number
    ? `${member.profiles.class_number}-${member.profiles.class_letter ?? ""} sinf`
    : null;

  return (
    <div className="relative flex flex-col items-center rounded-2xl border border-border/60 bg-card p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md">
      {canEdit && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          disabled={deleting}
          className="absolute right-2 top-2 h-7 w-7 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(member.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Avatar */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ${pos.ring}`}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Lavozim */}
      <span className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${pos.badge}`}>
        {pos.icon} {pos.label}
      </span>

      {/* Ism */}
      <p className="mt-2 font-semibold text-foreground leading-tight">{name}</p>
      {cls && <p className="text-xs text-muted-foreground">{cls}</p>}

      {/* Sektor */}
      {member.sector && (
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">
          🧭 {member.sector}
        </p>
      )}

      {/* Izoh */}
      {member.notes && (
        <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
          "{member.notes}"
        </p>
      )}
    </div>
  );
}
