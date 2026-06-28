import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BilimnomaPublicHeader } from "@/components/bilimnoma-public-header";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Info,
  Check,
  X,
  Clock,
  ExternalLink,
  Link2,
  ListChecks,
  Images,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  MapPin,
  Lightbulb,
  Backpack,
} from "lucide-react";
import {
  sectionBySlug,
  demandMeta,
  categoryTheme,
  entryIcon,
  youtubeEmbedUrl,
  detailFields,
  type BilimnomaCategory,
  type BilimnomaEntry,
  type EntryDetails,
} from "@/lib/bilimnoma";

export const Route = createFileRoute("/bilimnoma/$section_/$id")({
  head: () => ({ meta: [{ title: "Bilimnoma — EduLens" }] }),
  component: BilimnomaEntryDetail,
});

const ENTRY_COLS =
  "id, section, category_id, title, summary, body, icon, demand, details, image_url, sort_order, is_published, created_by, created_at";

type MiniEntry = { id: string; title: string };

// Ochiq sahifa — login talab qilinmaydi
function BilimnomaEntryDetail() {
  const { section: slug, id } = Route.useParams();
  const section = sectionBySlug(slug);
  const [coverOk, setCoverOk] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["bilimnoma-entry", id],
    enabled: !!section,
    queryFn: async () => {
      const sec = section!.key;
      const [item, categories, entries] = await Promise.all([
        supabase
          .from("bilimnoma_entries")
          .select(ENTRY_COLS)
          .eq("id", id)
          .eq("is_published", true)
          .maybeSingle()
          .then(unwrap),
        supabase
          .from("bilimnoma_categories")
          .select("id, section, title, description, icon, sort_order, is_published, created_at")
          .eq("section", sec)
          .eq("is_published", true)
          .order("sort_order")
          .then(unwrap),
        supabase
          .from("bilimnoma_entries")
          .select("id, title")
          .eq("section", sec)
          .eq("is_published", true)
          .order("sort_order")
          .then(unwrap),
      ]);
      return {
        item: item as BilimnomaEntry | null,
        categories: (categories ?? []) as BilimnomaCategory[],
        entries: (entries ?? []) as MiniEntry[],
      };
    },
  });

  const item = data?.item ?? null;
  const catIdx = item?.category_id
    ? (data?.categories ?? []).findIndex((c) => c.id === item.category_id)
    : -1;
  const theme = categoryTheme(catIdx >= 0 ? catIdx : 0);
  const Icon = item ? entryIcon(item.title, theme.icon) : theme.icon;

  const demand = demandMeta(item?.demand ?? null);
  const details = (item?.details ?? {}) as EntryDetails;
  const detailBlocks = detailFields(section?.kind ?? "career").filter((f) =>
    (details[f.key] ?? "").toString().trim(),
  );
  const embed = youtubeEmbedUrl(details.video_url);
  const hasCover = !!item?.image_url && coverOk;

  // Bog'liq kasblar — sarlavhalarni mavjud yozuvlarga moslab havola qilamiz
  const relatedEntries = (details.related ?? [])
    .map((t) => (data?.entries ?? []).find((e) => e.title === t))
    .filter((e): e is MiniEntry => !!e && e.id !== item?.id);

  return (
    <div className="min-h-screen bg-[#fafaff] text-slate-900">
      <BilimnomaPublicHeader />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 md:px-8">
        <Link
          to="/bilimnoma/$section"
          params={{ section: slug }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> {section?.title ?? "Orqaga"}
        </Link>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-52 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : !item ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            Ma'lumot topilmadi yoki hali e'lon qilinmagan.
          </p>
        ) : (
          <article className="mt-6 space-y-6">
            {/* Hero */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
              {hasCover ? (
                <img
                  src={item.image_url!}
                  alt={item.title}
                  className="h-52 w-full object-cover md:h-64"
                  onError={() => setCoverOk(false)}
                />
              ) : (
                <div className={`h-1.5 bg-gradient-to-r ${theme.bar}`} aria-hidden="true" />
              )}
              <div className="p-7 md:p-9">
                <div className="flex items-center gap-4">
                  {!hasCover && (
                    <span
                      className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${theme.soft}`}
                    >
                      <Icon className="h-8 w-8" aria-hidden="true" />
                    </span>
                  )}
                  {demand && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${demand.badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${demand.dot}`}
                        aria-hidden="true"
                      />
                      {demand.label}
                    </span>
                  )}
                </div>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
                  {item.title}
                </h1>
                {item.summary && (
                  <p className="mt-3 text-lg leading-relaxed text-slate-600">{item.summary}</p>
                )}
                {details.map_url && (
                  <a
                    href={details.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    <MapPin className="h-4 w-4" /> Xaritada ko'rish
                  </a>
                )}
              </div>
            </div>

            {/* Video */}
            {embed && (
              <Section title="Video tanishtiruv">
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-black">
                  <iframe
                    src={embed}
                    title={item.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Section>
            )}

            {/* Info tiles */}
            {detailBlocks.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {detailBlocks.map((f) => (
                  <div
                    key={f.key}
                    className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${theme.soft}`}
                      >
                        <f.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {f.label}
                      </h2>
                    </div>
                    <p className="text-[15px] leading-relaxed text-slate-700">
                      {String(details[f.key])}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Qiziqarli faktlar (joy) */}
            {(details.facts?.length ?? 0) > 0 && (
              <Section title="Qiziqarli faktlar" icon={<Lightbulb className="h-4 w-4" />}>
                <ul className="space-y-2">
                  {details.facts!.map((f, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-slate-700">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Maslahatchi uchun (joy — ekskursiya maslahati) */}
            {details.counselor_tip && details.counselor_tip.trim() && (
              <section className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-6">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-700">
                  <Backpack className="h-4 w-4" /> Maslahatchi uchun
                </h2>
                <p className="text-[15px] leading-relaxed text-slate-700">
                  {details.counselor_tip}
                </p>
              </section>
            )}

            {/* Afzalliklari / Kamchiliklari */}
            {((details.pros?.length ?? 0) > 0 || (details.cons?.length ?? 0) > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(details.pros?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                      <ThumbsUp className="h-4 w-4" aria-hidden="true" /> Afzalliklari
                    </h2>
                    <ul className="space-y-2">
                      {details.pros!.map((p, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[15px] leading-relaxed text-slate-700"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(details.cons?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-700">
                      <ThumbsDown className="h-4 w-4" aria-hidden="true" /> Kamchiliklari
                    </h2>
                    <ul className="space-y-2">
                      {details.cons!.map((c, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[15px] leading-relaxed text-slate-700"
                        >
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Bir kunlik hayot */}
            {(details.day_in_life?.length ?? 0) > 0 && (
              <Section title="Bir kunlik hayot" icon={<Clock className="h-4 w-4" />}>
                <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
                  {details.day_in_life!.map((step, i) => (
                    <li key={i} className="relative">
                      <span
                        className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${theme.soft}`}
                      >
                        {i + 1}
                      </span>
                      <p className="text-[15px] leading-relaxed text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Mini-test */}
            {(details.quiz?.length ?? 0) > 0 && <MiniTest items={details.quiz!} />}

            {/* Foydali resurslar */}
            {(details.resources?.length ?? 0) > 0 && (
              <Section title="Foydali resurslar" icon={<ExternalLink className="h-4 w-4" />}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {details.resources!.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      <span className="truncate">{r.label}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-500" />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Bog'liq kasblar */}
            {relatedEntries.length > 0 && (
              <Section
                title={section?.kind === "place" ? "Bog'liq joylar" : "Bog'liq kasblar"}
                icon={<Link2 className="h-4 w-4" />}
              >
                <div className="flex flex-wrap gap-2">
                  {relatedEntries.map((e) => (
                    <Link
                      key={e.id}
                      to="/bilimnoma/$section/$id"
                      params={{ section: slug, id: e.id }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      {e.title}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Galereya */}
            {(details.gallery?.length ?? 0) > 0 && (
              <Section title="Rasmlar" icon={<Images className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {details.gallery!.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${item.title} ${i + 1}`}
                      loading="lazy"
                      className="h-32 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Maxsus blok (extra) */}
            {details.extra && details.extra.trim() && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    {details.extra_label?.trim() || "Qo'shimcha"}
                  </h2>
                </div>
                <p className="text-[15px] leading-relaxed text-slate-700">{details.extra}</p>
              </div>
            )}

            {/* Erkin matn */}
            {item.body && item.body.trim() && (
              <div className="whitespace-pre-wrap rounded-2xl border border-slate-200/70 bg-white p-6 text-[15px] leading-relaxed text-slate-700">
                {item.body}
              </div>
            )}

            <div>
              <Link
                to="/bilimnoma/$section"
                params={{ section: slug }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" /> {section?.title ?? "Barchasi"}
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

/* ─── Bo'lim qutisi ──────────────────────────────────────────────────────── */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── "Bu kasb senga mosmi?" mini-test ───────────────────────────────────── */
function MiniTest({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const [done, setDone] = useState(false);

  const score = checked.filter(Boolean).length;
  const pct = items.length ? Math.round((score / items.length) * 100) : 0;
  const verdict =
    pct >= 70
      ? { text: "Bu kasb senga juda mos kelishi mumkin! 🎯", cls: "text-emerald-700" }
      : pct >= 40
        ? { text: "Yaxshi imkoniyat — yana yaqindan o'rganib ko'r.", cls: "text-amber-700" }
        : { text: "Boshqa kasblarni ham ko'rib chiqishni tavsiya qilamiz.", cls: "text-slate-600" };

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-violet-50/40 p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-700">
        <ListChecks className="h-4 w-4" /> Bu kasb senga mosmi?
      </h2>
      <p className="mb-4 text-sm text-slate-500">O'zingga to'g'ri keladiganlarini belgilab ko'r.</p>
      <div className="space-y-2">
        {items.map((q, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-white px-4 py-3 text-[15px] text-slate-700 transition-colors hover:border-violet-300"
          >
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked];
                next[i] = e.target.checked;
                setChecked(next);
              }}
              className="mt-0.5 h-4 w-4 accent-violet-600"
            />
            {q}
          </label>
        ))}
      </div>
      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700"
        >
          Natijani ko'rish
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-violet-100 bg-white p-4">
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-violet-600" style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-sm font-bold ${verdict.cls}`}>
            {score}/{items.length} mos keldi — {verdict.text}
          </p>
        </div>
      )}
    </section>
  );
}
