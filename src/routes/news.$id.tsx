import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import type { NewsItem } from "./index";

export const Route = createFileRoute("/news/$id")({
  head: () => ({ meta: [{ title: "Yangilik — EduLens" }] }),
  component: NewsDetail,
});

// Ochiq sahifa — login talab qilinmaydi
function NewsDetail() {
  const { id } = Route.useParams();

  const { data: item, isLoading } = useQuery({
    queryKey: ["public-news-item", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, excerpt, body, cover_url, published_at")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      return data as NewsItem | null;
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

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 md:px-8">
        <Link
          to="/news"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Barcha yangiliklar
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !item ? (
          <p className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Yangilik topilmadi yoki hali e'lon qilinmagan.
          </p>
        ) : (
          <article>
            {item.published_at && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {new Date(item.published_at).toLocaleDateString("uz-UZ", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            <h1 className="mb-6 text-4xl font-extrabold leading-tight">{item.title}</h1>
            {item.cover_url && (
              <img
                src={item.cover_url}
                alt={item.title}
                className="mb-8 w-full rounded-3xl object-cover shadow-lg"
              />
            )}
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
              {item.body}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
