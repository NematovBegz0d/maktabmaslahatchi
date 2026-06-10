import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  onRetry?: () => void;
  message?: string;
}

export function QueryError({ onRetry, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="font-medium text-foreground">
        {message ?? "Ma'lumot yuklanmadi"}
      </p>
      <p className="text-sm text-muted-foreground">
        Internet aloqasini tekshiring va qayta urinib ko'ring.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Qayta yuklash
        </Button>
      )}
    </div>
  );
}
