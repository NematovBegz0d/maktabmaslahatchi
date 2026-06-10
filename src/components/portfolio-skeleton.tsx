import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function PortfolioSkeleton() {
  return (
    <div className="space-y-5">
      {/* Hero card */}
      <Card className="overflow-hidden border-border/60">
        <div className="h-2 w-full bg-muted animate-pulse" />
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radar + Personality */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="pt-2 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IQ */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* Strengths */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-green-200/60">
          <CardContent className="p-5 space-y-2">
            <Skeleton className="h-5 w-32 mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 flex-1 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-yellow-200/60">
          <CardContent className="p-5 space-y-2">
            <Skeleton className="h-5 w-40 mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 flex-1 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
