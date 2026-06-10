import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ListChecks, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface TestCardProps {
  id: string;
  name: string;
  description?: string | null;
  questionCount: number;
  durationMinutes?: number | null;
  status?: "not_started" | "in_progress" | "completed";
}

const statusLabel: Record<NonNullable<TestCardProps["status"]>, string> = {
  not_started: "Boshlanmagan",
  in_progress: "Davom etmoqda",
  completed: "Tugagan",
};
const statusClass: Record<NonNullable<TestCardProps["status"]>, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

export function TestCard({ id, name, description, questionCount, durationMinutes, status = "not_started" }: TestCardProps) {
  return (
    <Card className="group overflow-hidden border-border/60 transition-all hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}>
            {statusLabel[status]}
          </span>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{questionCount} savol</span>
          {durationMinutes && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{durationMinutes} daq.</span>}
        </div>
        <Button asChild className="w-full" variant={status === "completed" ? "outline" : "default"}>
          <Link to="/test/$id" params={{ id }}>
            {status === "in_progress" ? "Davom ettirish" : status === "completed" ? "Qayta ko'rish" : "Boshlash"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}