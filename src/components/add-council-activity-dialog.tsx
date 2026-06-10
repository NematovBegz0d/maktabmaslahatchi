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
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddCouncilActivityDialog({ open, onOpenChange, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setActivityDate("");
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Tadbir nomini kiriting.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("council_activities").insert({
        title: title.trim(),
        description: description.trim() || null,
        activity_date: activityDate || null,
      });
      if (error) throw error;
      toast.success("Faoliyat qo'shildi!");
      reset();
      onOpenChange(false);
      onAdded();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "42501" || err.code === "PGRST301")
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
      else { console.error("[add-council-activity]", err); toast.error("Xatolik yuz berdi. Qayta urinib ko'ring."); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📋 Kengash faoliyati qo'shish</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Tadbir nomi *</Label>
            <Input
              placeholder="Masalan: Liderlik treningi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Tavsif (ixtiyoriy)</Label>
            <Textarea
              placeholder="Tadbir haqida qisqacha..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Sana</Label>
            <Input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
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
