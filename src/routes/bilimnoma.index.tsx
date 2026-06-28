import { createFileRoute, Link } from "@tanstack/react-router";
import { BilimnomaPublicHeader } from "@/components/bilimnoma-public-header";
import { ChevronLeft, ArrowRight, BookOpen } from "lucide-react";
import { SECTIONS } from "@/lib/bilimnoma";

export const Route = createFileRoute("/bilimnoma/")({
  head: () => ({
    meta: [
      { title: "Bilimnoma — EduLens" },
      {
        name: "description",
        content:
          "O'quvchilar uchun bilim qo'llanmasi: kasblar, Prezident maktablari, iqtidorli yoshlar imkoniyatlari va oliy ta'lim.",
      },
    ],
  }),
  component: BilimnomaHub,
});

// Ochiq sahifa — login talab qilinmaydi
function BilimnomaHub() {
  return (
    <div className="min-h-screen bg-[#fafaff] text-slate-900">
      <BilimnomaPublicHeader />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Bosh sahifa
        </Link>

        {/* Hero */}
        <div className="mt-8 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" /> Bilimnoma
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            Kelajagingni ongli{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              tanlash uchun
            </span>{" "}
            bilim qo'llanmasi
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Kasblar olamidan oliy ta'limgacha — o'zing uchun eng to'g'ri yo'lni tanlashga yordam
            beradigan ishonchli ma'lumotlar.
          </p>
        </div>

        {/* Bo'limlar */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.key}
                to="/bilimnoma/$section"
                params={{ section: s.slug }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.18)]"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  aria-hidden="true"
                />
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${s.accentBg} ${s.accentText} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.short}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  Ochish
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
