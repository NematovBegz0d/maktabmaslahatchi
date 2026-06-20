import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/error-boundary";

// Render paytida xato tashlaydigan bola
function Boom(): never {
  throw new Error("portlash xatosi");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("bola xato tashlasa — O'ZBEKCHA fallback ko'rsatadi va xatoni hisobotlaydi", () => {
    // console.error'ni mock qilamiz: React'ning boundary shovqinini bosamiz +
    // reportError chaqirilganini tasdiqlaymiz.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Fallback UI o'zbekcha (lang-buzuqlik tuzatildi — inglizcha matn yo'q)
    expect(screen.getByText("Kutilmagan xatolik")).toBeInTheDocument();
    expect(screen.getByText("portlash xatosi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bosh sahifaga qaytish/i })).toBeInTheDocument();

    // Markaziy reportError ishladi (console.error "[error]" bilan)
    expect(spy.mock.calls.some((c) => c[0] === "[error]")).toBe(true);
  });

  it("bola xato tashlamasa — bolani ko'rsatadi", () => {
    render(
      <ErrorBoundary>
        <p>TINCH</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("TINCH")).toBeInTheDocument();
  });
});
