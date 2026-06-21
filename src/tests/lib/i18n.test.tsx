import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider, useI18n, type TranslationKey } from "@/lib/i18n";

function Probe() {
  const { t } = useI18n();
  return (
    <ul>
      <li>nav:{t("nav_dashboard")}</li>
      <li>auth:{t("auth_login")}</li>
      <li>unknown:{t("__yoq__" as TranslationKey)}</li>
    </ul>
  );
}

function ContextKeys() {
  const ctx = useI18n();
  return <span>keys:{Object.keys(ctx).sort().join(",")}</span>;
}

describe("i18n — uz-only", () => {
  it("t() o'zbekcha qiymat qaytaradi", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText("nav:Boshqaruv")).toBeInTheDocument();
    expect(screen.getByText("auth:Kirish")).toBeInTheDocument();
  });

  it("noma'lum kalit — kalitning o'zini qaytaradi (fallback)", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText("unknown:__yoq__")).toBeInTheDocument();
  });

  it("useI18n FAQAT t ni beradi (locale/setLocale yo'q — uz-only)", () => {
    render(
      <I18nProvider>
        <ContextKeys />
      </I18nProvider>,
    );
    expect(screen.getByText("keys:t")).toBeInTheDocument();
  });
});
