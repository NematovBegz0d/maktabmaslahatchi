// Mantiqiy qobiliyat (Raven/Matematik) ko'rsatkichi ko'rinadigan har joyda ogohlantirish.
// Shkala kam savolga asoslangan taxminiy nisbiy ball (scoring.ts: 70 + foiz*0.6) —
// validatsiyalangan IQ normasi emas, tashxis sifatida ishlatilmasligi kerak.
export function IqDisclaimer() {
  return (
    <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      ⚠️ Mantiqiy qobiliyat ko'rsatkichi kam savolga asoslangan taxminiy nisbiy ball — bu rasmiy IQ
      yoki klinik tashxis emas, faqat yo'naltiruvchi ko'rsatkich. Yakuniy xulosa pedagog-psixolog
      bilan chiqariladi.
    </p>
  );
}
