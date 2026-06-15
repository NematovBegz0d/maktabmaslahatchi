import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Supabase javobini "ochadi": xato bo'lsa throw qiladi — React Query uni
 * `isError` sifatida ko'rsatadi va (retry sozlamasiga ko'ra) qayta uradi.
 * Aks holda `data`ni qaytaradi. Xatoni jimgina yutib, bo'sh sahifa ko'rsatishning
 * oldini oladi.
 *
 * Ishlatish:
 *   queryFn: async () => unwrap(await supabase.from("x").select("*"))
 */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
