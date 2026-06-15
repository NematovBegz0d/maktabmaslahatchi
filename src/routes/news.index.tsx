import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ChevronLeft } from "lucide-react";
import type { NewsItem } from "./index";

export const Route = createFileRoute("/news/")({
  head: () => ({ meta: [{ title: "Yangiliklar — EduLens" }] }),
  component: NewsList,
});

// Ochiq sahifa — login talab qilinmaydi
function NewsList() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["public-news"],
    queryFn: async () => {
      const data = unwrap(
        await supabase
          .from("news")
          .select("id, title, excerpt, body, cover_url, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50),
      );
      return (data ?? []) as NewsItem[];
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <Link
          to="/auth"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
        >
          Tizimga kirish
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Bosh sahifa
        </Link>
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-extrabold">
          <Newspaper className="h-9 w-9 text-indigo-600" /> Yangiliklar
        </h1>
        <p className="mb-10 text-lg text-slate-600">Markaz hayotidan so'nggi xabarlar</p>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : (news ?? []).length === 0 ? (
          <p className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Hozircha yangilik yo'q.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(news ?? []).map((n) => (
              <Link
                key={n.id}
                to="/news/$id"
                params={{ id: n.id }}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {n.cover_url ? (
                  <img
                    src={n.cover_url}
                    alt={n.title}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                    <Newspaper className="h-10 w-10 text-indigo-300" />
                  </div>
                )}
                <div className="p-6">
                  {n.published_at && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {new Date(n.published_at).toLocaleDateString("uz-UZ", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <h2 className="mb-2 text-lg font-bold transition-colors group-hover:text-indigo-600">
                    {n.title}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {n.excerpt ?? n.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
