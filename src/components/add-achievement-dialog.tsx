import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_MAP,
  LEVEL_MAP,
  RESULT_MAP,
  type AchievementCategory,
  type AchievementLevel,
  type AchievementResult,
} from "@/types/social-portfolio";

interface Props {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddAchievementDialog({ studentId, open, onOpenChange, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AchievementCategory>("academic");
  const [level, setLevel] = useState<AchievementLevel>("school");
  const [result, setResult] = useState<AchievementResult>("winner");
  const [achievedAt, setAchievedAt] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("academic");
    setLevel("school");
    setResult("winner");
    setAchievedAt("");
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Yutuq nomini kiriting.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("student_achievements").insert({
        student_id: studentId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        level,
        result,
        achieved_at: achievedAt || null,
      });
      if (error) throw error;
      toast.success("Yutuq qo'shildi!");
      reset();
      onOpenChange(false);
      onAdded();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "42501" || err.code === "PGRST301")
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
      else { console.error("[add-achievement]", err); toast.error("Xatolik yuz berdi. Qayta urinib ko'ring."); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🥇 Yutuq qo'shish</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Yutuq nomi *</Label>
            <Input
              placeholder="Masalan: Matematika olimpiadasi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Qisqacha tavsif..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Yo'nalish</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AchievementCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_MAP) as AchievementCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CATEGORY_MAP[k].icon} {CATEGORY_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Daraja</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as AchievementLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LEVEL_MAP) as AchievementLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LEVEL_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Natija</Label>
              <Select value={result} onValueChange={(v) => setResult(v as AchievementResult)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESULT_MAP) as AchievementResult[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {RESULT_MAP[k].icon} {RESULT_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Sana</Label>
              <Input
                type="date"
                value={achievedAt}
                onChange={(e) => setAchievedAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
