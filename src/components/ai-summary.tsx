import type { ReactNode } from "react";

// **bold** -> <strong>
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// Yengil Markdown renderer (qoʻshimcha kutubxonasiz)
export function AISummary({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="ml-1 space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushList(`l-${i}`);
      blocks.push(
        <h4 key={`h-${i}`} className="mt-5 text-base font-semibold text-foreground first:mt-0">
          {line.replace(/^##\s*/, "")}
        </h4>,
      );
    } else if (line.startsWith("# ")) {
      flushList(`l-${i}`);
      blocks.push(<h3 key={`h-${i}`} className="mt-5 text-lg font-bold text-foreground">{line.replace(/^#\s*/, "")}</h3>);
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s+/.test(line)) {
      list.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.length > 0) {
      flushList(`l-${i}`);
      blocks.push(<p key={`p-${i}`} className="text-sm leading-relaxed text-muted-foreground">{renderInline(line)}</p>);
    }
  });
  flushList("l-end");

  return <div className="space-y-2">{blocks}</div>;
}
