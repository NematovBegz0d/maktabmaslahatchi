export function Logo({
  className = "",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Doira shaklidagi logo — markazdagi MM belgisiga zoom qilingan */}
      <div
        className="h-11 w-11 shrink-0 rounded-full bg-white ring-1 ring-border/60 shadow-sm"
        style={{
          backgroundImage: "url(/logo.png)",
          backgroundSize: "120%",        // markazni kattalashtirish (zoom)
          backgroundPosition: "center 70%", // MM belgisiga fokus
          backgroundRepeat: "no-repeat",
        }}
        role="img"
        aria-label="Maktab M logotipi"
      />
      {showText && (
        <span className="text-xl font-bold tracking-tight text-foreground">
          Maktab M
        </span>
      )}
    </div>
  );
}
