// Dashboard'dagi "Bajariladigan ishlar" kartasi — maslahatchi bosh sahifasida.
// Qo'ng'iroq bilan bir xil derived bildirishnomalarni ko'rsatadi (kesh ulashiladi).
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationList } from "@/components/notification-list";
import { useCounselorNotifications } from "@/hooks/use-counselor-notifications";
import { ListTodo } from "lucide-react";

export function CounselorTodoCard() {
  const { data, isLoading } = useCounselorNotifications();
  const items = data ?? [];

  return (
    <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
          <ListTodo className="h-4 w-4 text-primary" /> Bajariladigan ishlar
          {items.length > 0 && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {items.length}
            </span>
          )}
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="-mx-3">
            <NotificationList items={items} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
