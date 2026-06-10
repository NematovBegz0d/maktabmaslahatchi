// ===================================================================
// EduLens — Claude (Anthropic) AI klient yordamchisi
// ANTHROPIC_API_KEY muhit oʻzgaruvchisidan foydalanadi.
// ===================================================================

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY sozlanmagan. Supabase secrets'ga qoʻshing.");
  }
  const model = Deno.env.get("CLAUDE_MODEL") ?? DEFAULT_MODEL;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API xatosi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  // Anthropic javobi: { content: [{ type: "text", text: "..." }] }
  const text = (data?.content ?? [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n")
    .trim();

  return text || "Tahlil yaratib boʻlmadi.";
}
