// media bucket'ga rasm yuklash (faqat admin — storage RLS tekshiradi)
import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE_MB = 5;

export async function uploadMedia(
  file: File,
  folder: "news" | "clubs" | "bilimnoma",
): Promise<string> {
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Rasm hajmi ${MAX_SIZE_MB} MB dan oshmasin`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
