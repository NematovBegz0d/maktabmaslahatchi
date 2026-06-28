import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BilimnomaPublicHeader } from "@/components/bilimnoma-public-header";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ArrowRight, Search, ArrowUpRight } from "lucide-react";
import {
  sectionBySlug,
  demandMeta,
  categoryTheme,
  entryIcon,
  type CategoryTheme,
  type BilimnomaCategory,
  type BilimnomaEntry,
} from "@/lib/bilimnoma";

export const Route = createFileRoute("/bilimnoma/$section")({
  head: ({ params }) => {
    const s = sectionBySlug(params.section);
    return { meta: [{ title: `${s?.title ?? "Bilimnoma"} — EduLens` }] };
  },
  component: BilimnomaSection,
});

const ENTRY_COLS =
  "id, section, category_id, title, summary, icon, demand, details, image_url, sort_order, is_published, created_by, created_at";

// Ochiq sahifa — login talab qilinmaydi
function BilimnomaSection() {
  const { section: slug } = Route.useParams();
  const section = sectionBySlug(slug);

  const { data, isLoading } = useQuery({
    queryKey: ["bilimnoma-section", section?.key],
    enabled: !!section,
    queryFn: async () => {
      const sec = section!.key;
      const [categories, entries] = await Promise.all([
        supabase
          .from("bilimnoma_categories")
          .select("id, section, title, description, icon, sort_order, is_published, created_at")
          .eq("section", sec)
          .eq("is_published", true)
          .order("sort_order")
          .then(unwrap),
        supabase
          .from("bilimnoma_entries")
          .select(ENTRY_COLS)
          .eq("section", sec)
          .eq("is_published", true)
          .order("sort_order")
          .then(unwrap),
      ]);
      return {
        categories: (categories ?? []) as BilimnomaCategory[],
        entries: (entries ?? []) as BilimnomaEntry[],
      };
    },
  });

  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categories = data?.categories ?? [];
  const entries = data?.entries ?? [];

  // category_id -> tartib indeksi (rang temasini aniqlash uchun)
  const catIndex = useMemo(() => {
    const m = new Map<string, number>();
    categories.forEach((c, i) => m.set(c.id, i));
    return m;
  }, [categories]);

  const themeFor = (e: BilimnomaEntry): CategoryTheme =>
    categoryTheme(e.category_id ? (catIndex.get(e.category_id) ?? 0) : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const catOk = activeCat === "all" || e.category_id === activeCat;
      const textOk =
        !q || e.title.toLowerCase().includes(q) || (e.summary ?? "").toLowerCase().includes(q);
      return catOk && textOk;
    });
  }, [entries, activeCat, search]);

  if (!section) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-extrabold text-slate-900">Bo'lim topilmadi</h1>
          <Link to="/bilimnoma" className="font-bold text-violet-600 hover:text-violet-700">
            Bilimnomaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const SectionIcon = section.icon;
  const hasChips = categories.length > 0;

  return (
    <div className="min-h-screen bg-[#fafaff] text-slate-900">
      <BilimnomaPublicHeader />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-8">
        <Link
          to="/bilimnoma"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Bilimnoma
        </Link>

        {/* Hero */}
        <div className="mt-6 flex flex-col gap-5 border-b border-slate-200/70 pb-8 sm:flex-row sm:items-center">
          <span
            className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${section.accentBg} ${section.accentText} shadow-sm`}
          >
            <SectionIcon className="h-8 w-8" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Bilimnoma
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              {section.title}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">
              {section.short}
            </p>
          </div>
          {entries.length > 0 && (
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-4xl font-extrabold tracking-tight text-slate-900">
                {entries.length}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.kind === "place" ? "joy" : "kasb"}
              </p>
            </div>
          )}
        </div>

        {/* Qidiruv + toifa chiplari */}
        {entries.length > 0 && (
          <div className="mt-8 space-y-5">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nomi bo'yicha qidiring..."
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-slate-300"
              />
            </div>
            {hasChips && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCat("all")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeCat === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  Hammasi
                </button>
                {categories.map((c, i) => {
                  const theme = categoryTheme(i);
                  const active = activeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        active
                          ? theme.chipActive
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {!active && (
                        <span
                          className={`h-2 w-2 rounded-full ${theme.chipText}`}
                          aria-hidden="true"
                        />
                      )}
                      {c.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
              Hozircha ma'lumot qo'shilmagan — tez orada to'ldiriladi.
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
              Qidiruv bo'yicha hech narsa topilmadi.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => (
                <EntryCard key={e.id} section={section.slug} entry={e} theme={themeFor(e)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EntryCard({
  section,
  entry,
  theme,
}: {
  section: string;
  entry: BilimnomaEntry;
  theme: CategoryTheme;
}) {
  const demand = demandMeta(entry.demand);
  const Icon = entryIcon(entry.title, theme.icon);
  return (
    <Link
      to="/bilimnoma/$section/$id"
      params={{ section, id: entry.id }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.18)]"
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${theme.medallion} transition-transform duration-300 group-hover:scale-105`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        {demand && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${demand.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${demand.dot}`} aria-hidden="true" />
            {demand.label}
          </span>
        )}
      </div>
      <h3
        className={`mt-4 text-[17px] font-bold leading-snug tracking-tight text-slate-900 transition-colors ${theme.hoverText}`}
      >
        {entry.title}
      </h3>
      {entry.summary && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{entry.summary}</p>
      )}
      <span
        className={`mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold ${theme.link}`}
      >
        Batafsil
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
      <ArrowUpRight
        className="absolute right-5 top-5 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
}
