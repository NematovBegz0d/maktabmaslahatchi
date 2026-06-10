import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

export interface StudentEditData {
  id: string;
  full_name: string | null;
  passport_series: string | null;
  class_number: number | null;
  class_letter: string | null;
  gender: string | null;
  birth_date: string | null;
  school_id: string | null;
}

interface Props {
  student: StudentEditData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const NONE = "__none__"; // Select bo'sh qiymat uchun (Radix bo'sh stringni qabul qilmaydi)

export function EditStudentDialog({ student, open, onOpenChange, onSaved }: Props) {
  const [fullName, setFullName] = useState("");
  const [passport, setPassport] = useState("");
  const [classNum, setClassNum] = useState("");
  const [classLet, setClassLet] = useState("");
  const [gender, setGender] = useState<string>(NONE);
  const [birthDate, setBirthDate] = useState("");
  const [schoolId, setSchoolId] = useState<string>(NONE);
  const [saving, setSaving] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Oyna ochilganda formani joriy qiymatlar bilan to'ldirish
  useEffect(() => {
    if (open) {
      setFullName(student.full_name ?? "");
      setPassport(student.passport_series ?? "");
      setClassNum(student.class_number != null ? String(student.class_number) : "");
      setClassLet(student.class_letter ?? "");
      setGender(student.gender ?? NONE);
      setBirthDate(student.birth_date ?? "");
      setSchoolId(student.school_id ?? NONE);
    }
  }, [open, student]);

  async function save() {
    if (!fullName.trim()) {
      toast.error("To'liq ismni kiriting.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          passport_series: passport.trim() ? passport.trim().toLowerCase() : null,
          class_number: classNum ? parseInt(classNum) : null,
          class_letter: classLet.trim() ? classLet.trim().toUpperCase() : null,
          gender: gender === NONE ? null : gender,
          birth_date: birthDate || null,
          school_id: schoolId === NONE ? null : schoolId,
        })
        .eq("id", student.id);
      if (error) throw error;
      toast.success("O'quvchi ma'lumotlari yangilandi.");
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "23505")
        toast.error("Bu guvohnoma seriyasi boshqa o'quvchida band.");
      else if (err.code === "42501" || err.code === "PGRST301")
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
      else {
        console.error("[edit-student]", err);
        toast.error("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>O'quvchi ma'lumotlarini tahrirlash</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">To'liq ism *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Karimov Ali Vohidovich" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Guvohnoma seriyasi</Label>
              <Input value={passport} onChange={(e) => setPassport(e.target.value)} placeholder="ibh1234567" />
              {passport.trim() && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Login: <span className="font-mono font-semibold">{passport.toLowerCase().trim()}@edulab.uz</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Sinf raqami</Label>
              <Input type="number" min={1} max={11} value={classNum} onChange={(e) => setClassNum(e.target.value)} placeholder="9" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Sinf harfi</Label>
              <Input value={classLet} onChange={(e) => setClassLet(e.target.value.toUpperCase())} placeholder="A" maxLength={2} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Jinsi</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Tanlanmagan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Tug'ilgan sana</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            {schools.length > 0 && (
              <div>
                <Label className="mb-1.5 block text-xs">Maktab</Label>
                <Select value={schoolId} onValueChange={setSchoolId}>
                  <SelectTrigger><SelectValue placeholder="Tanlanmagan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
