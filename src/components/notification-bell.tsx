// Header'dagi qo'ng'iroq — maslahatchi uchun bajariladigan ishlar bildirishnomasi.
//
// Bildirishnomalar derived (DB'siz) bo'lgani uchun "o'qilmaganlik" client tarafda,
// localStorage'da imzolar (signature) orqali kuzatiladi:
//   • Yangi yoki qiymati o'zgargan ish  → badge'da hisoblanadi
//   • Panel ochilganda joriy ishlar "ko'rilgan" deb belgilanadi
//   • Ish bajarilsa — bildirishnoma butunlay yo'qoladi
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { NotificationList } from "@/components/notification-list";
import { useCounselorNotifications } from "@/hooks/use-counselor-notifications";
import { useAuth } from "@/hooks/use-auth";
import {
  countUnseen,
  seenSnapshot,
  type CounselorNotification,
  type SeenMap,
} from "@/lib/notifications";
import { Bell } from "lucide-react";

function readSeen(key: string | null): SeenMap {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") as SeenMap;
  } catch {
    return {};
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const { data } = useCounselorNotifications();
  const items = data ?? [];

  const [open, setOpen] = useState(false);
  const seenKey = user?.id ? `edulens:notif-seen:${user.id}` : null;
  const [seen, setSeen] = useState<SeenMap>(() => readSeen(seenKey));

  const markAllSeen = useCallback(
    (list: CounselorNotification[]) => {
      const next = seenSnapshot(list);
      setSeen(next);
      if (seenKey) {
        try {
          localStorage.setItem(seenKey, JSON.stringify(next));
        } catch {
          /* localStorage o'chiq bo'lsa — jim o'tamiz */
        }
      }
    },
    [seenKey],
  );

  const unread = countUnseen(items, seen);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) markAllSeen(items);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={`Bildirishnomalar${unread > 0 ? ` — ${unread} ta yangi` : ""}`}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold text-foreground">Bajariladigan ishlar</p>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">{items.length} ta</span>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <NotificationList items={items} onItemClick={() => setOpen(false)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
