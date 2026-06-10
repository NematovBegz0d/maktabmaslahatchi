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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ENROLLMENT_STATUS_MAP, type EnrollmentStatus } from "@/types/social-portfolio";

interface Props {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddEnrollmentDialog({ studentId, open, onOpenChange, onAdded }: Props) {
  const [institution, setInstitution] = useState("");
  const [direction, setDirection] = useState("");
  const [schedule, setSchedule] = useState("");
  const [status, setStatus] = useState<EnrollmentStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setInstitution("");
    setDirection("");
    setSchedule("");
    setStatus("active");
    setStartDate("");
  }

  async function save() {
    if (!institution.trim()) {
      toast.error("Muassasa nomini kiriting.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("extracurricular_enrollments").insert({
        student_id: studentId,
        institution_name: institution.trim(),
        direction: direction.trim(),
        schedule: schedule.trim() || null,
        status,
        start_date: startDate || null,
      });
      if (error) throw error;
      toast.success("Mashg'ulot qo'shildi!");
      reset();
      onOpenChange(false);
      onAdded();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "42501" || err.code === "PGRST301")
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
      else { console.error("[add-enrollment]", err); toast.error("Xatolik yuz berdi. Qayta urinib ko'ring."); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📚 Maktabdan tashqari ta'lim qo'shish</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Muassasa nomi *</Label>
            <Input
              placeholder="Masalan: Bolalar musiqa maktabi"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Yo'nalish</Label>
            <Input
              placeholder="Masalan: Fortepiano, Shaxmat, IT..."
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Jadval (ixtiyoriy)</Label>
            <Input
              placeholder="Masalan: Du, Chor, Ju — 15:00"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Holat</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EnrollmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENROLLMENT_STATUS_MAP) as EnrollmentStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ENROLLMENT_STATUS_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Boshlangan sana</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
