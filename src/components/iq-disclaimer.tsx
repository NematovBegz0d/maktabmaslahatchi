// Sonli IQ ko'rsatilgan har bir joyda ko'rinadigan ogohlantirish.
// IQ shkalasi taxminiy "demo norma" (scoring.ts: 70 + foiz*0.6) — validatsiyalangan
// psixometrik norma emas, shuning uchun tashxis sifatida ishlatilmasligi kerak.
export function IqDisclaimer() {
  return (
    <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      ⚠️ IQ ko'rsatkichi taxminiy demo normaga asoslangan — bu tibbiy yoki psixologik tashxis emas,
      faqat yo'naltiruvchi ko'rsatkich. Yakuniy xulosa pedagog-psixolog bilan chiqariladi.
    </p>
  );
}
