import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { POSITION_MAP, POSITION_ORDER, type CouncilPosition } from "@/types/council";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: string;
  existingStudentIds: Set<string>;
  onAdded: () => void;
}

const ADD_LIST_LIMIT = 50;

export function AddCouncilMemberDialog({
  open,
  onOpenChange,
  term,
  existingStudentIds,
  onAdded,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<CouncilPosition>("member");
  const [sector, setSector] = useState("");
  const [electedAt, setElectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Faqat 'student' rolidagilar — student_directory view orqali (bitta so'rov)
  const { data: students } = useQuery({
    queryKey: ["students-for-council"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_directory")
        .select("id, full_name, class_number, class_letter")
        .order("full_name", { ascending: true });
      return data ?? [];
    },
  });

  const available = (students ?? []).filter(
    (s) =>
      !existingStudentIds.has(s.id) &&
      (!search || (s.full_name ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const visible = available.slice(0, ADD_LIST_LIMIT);
  const hidden = available.length - visible.length;

  function reset() {
    setSelectedId(null);
    setSearch("");
    setPosition("member");
    setSector("");
    setElectedAt("");
    setNotes("");
  }

  async function save() {
    if (!selectedId) {
      toast.error("O'quvchini tanlang.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("council_members").insert({
        student_id: selectedId,
        position,
        sector: sector.trim(),
        term,
        elected_at: electedAt || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Kengash a'zosi qo'shildi!");
      reset();
      onOpenChange(false);
      onAdded();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "23505") toast.error("Bu o'quvchi shu o'quv yilida allaqachon kengash a'zosi.");
      else if (err.code === "42501" || err.code === "PGRST301")
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
      else { console.error("[add-council-member]", err); toast.error("Xatolik yuz berdi. Qayta urinib ko'ring."); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>👑 Kengash a'zosi qo'shish</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* O'quvchi tanlash */}
          <div>
            <Label className="mb-1.5 block text-xs">O'quvchi tanlang *</Label>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ism bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border/50">
              {available.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {search ? "Topilmadi" : "Mavjud o'quvchi yo'q"}
                </p>
              ) : (
                <div className="divide-y divide-border/30">
                  {visible.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/50 ${
                        selectedId === s.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(s.full_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {s.full_name ?? "Noma'lum"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.class_number ? `${s.class_number}-${s.class_letter ?? ""} sinf` : "—"}
                        </p>
                      </div>
                      {selectedId === s.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                  {hidden > 0 && (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      Yana {hidden} ta — qidiruvdan foydalaning
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lavozim + sektor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Lavozim</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as CouncilPosition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_ORDER.map((k) => (
                    <SelectItem key={k} value={k}>
                      {POSITION_MAP[k].icon} {POSITION_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Saylangan sana</Label>
              <Input type="date" value={electedAt} onChange={(e) => setElectedAt(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Yo'nalish (sektor)</Label>
            <Input
              placeholder="Masalan: Ma'naviyat, Sport, Media..."
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Izoh (ixtiyoriy)</Label>
            <Input
              placeholder="Qisqacha..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={saving || !selectedId}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
