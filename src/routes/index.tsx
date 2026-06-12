import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CalendarDays,
  Users,
  Star,
  Newspaper,
  ArrowRight,
  School,
  Trophy,
  ClipboardCheck,
  GraduationCap,
  Brain,
  Compass,
  Rocket,
  Loader2,
  Phone,
  MapPin,
  Send,
  Megaphone,
  BookOpen,
  Footprints,
  Target,
  Telescope,
  Pencil,
  Map,
  MessageCircleQuestion,
  Sparkles,
  PartyPopper,
  Landmark,
} from "lucide-react";

// "Kelajak" markazining ochiq sahifasi — login'siz (anon) ishlaydi
export interface CenterClub {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  schedule: string | null;
  age_range: string | null;
  teacher: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  published_at: string | null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kelajak markazi — Kelajak sen bilan boshlanadi" },
      {
        name: "description",
        content:
          "Kelajak markazi: to'garaklar, ilmiy testlar va shaxsiy portfolio — farzandingiz iqtidorini kashf eting.",
      },
    ],
  }),
  component: Index,
});

/* ─── Scroll-reveal: ko'ringanda paydo bo'lish ─────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = `${delay}ms`;
          el.classList.add("revealed");
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`reveal-init ${className}`}>
      {children}
    </div>
  );
}

/* ─── 0 dan sanab chiqadigan hisoblagich ───────────────────────────────────── */
function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (target === 0) {
      setValue(0);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out kvadrat — oxiriga sekinlashadi
      setValue(Math.round(target * (1 - (1 - p) * (1 - p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return <span ref={ref}>{value.toLocaleString("uz-UZ")}</span>;
}

/* ─── Hero rasmi ───────────────────────────────────────────────────────────────
   public/hero-student.png faylini qo'ysangiz — haqiqiy surat chiqadi (fonsiz PNG
   ideal). Fayl bo'lmasa ikonli fallback ko'rsatiladi. */
function HeroImage() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="landing-float-slow mb-4 inline-flex h-32 w-32 items-center justify-center rounded-full bg-white text-violet-600 shadow-xl md:h-40 md:w-40">
        <GraduationCap className="h-16 w-16 md:h-20 md:w-20" aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src="/hero-student.png"
      alt="Kelajak markazi o'quvchisi"
      className="h-48 w-auto object-contain object-bottom drop-shadow-xl md:h-64"
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Suzib yuruvchi stiker ────────────────────────────────────────────────── */
function Sticker({
  children,
  className = "",
  rot = 0,
  slow = false,
}: {
  children: React.ReactNode;
  className?: string;
  rot?: number;
  slow?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${slow ? "landing-float-slow" : "landing-float"} ${className}`}
      style={{ "--float-rot": `${rot}deg` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ─── Asosiy sahifa ────────────────────────────────────────────────────────── */
function Index() {
  // To'garaklar
  const { data: centerClubs } = useQuery({
    queryKey: ["landing-center-clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("center_clubs")
        .select("id, name, description, icon, image_url, schedule, age_range, teacher")
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at");
      return (data ?? []) as CenterClub[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // So'nggi yangiliklar
  const { data: news } = useQuery({
    queryKey: ["landing-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, excerpt, body, cover_url, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      return (data ?? []) as NewsItem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Jonli hisoblagichlar
  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("landing_stats");
      return (data ?? {}) as {
        schools?: number;
        students?: number;
        clubs?: number;
        tests?: number;
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Qiziqish bildirish dialogi
  const [applyClub, setApplyClub] = useState<CenterClub | null>(null);

  const latestNews = (news ?? [])[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9ff] text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-violet-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#togaraklar" className="transition-colors hover:text-violet-600">
              To'garaklar
            </a>
            <a href="#yol" className="transition-colors hover:text-violet-600">
              Qanday ishlaydi
            </a>
            <Link to="/news" className="transition-colors hover:text-violet-600">
              Yangiliklar
            </Link>
            <a href="#aloqa" className="transition-colors hover:text-violet-600">
              Aloqa
            </a>
          </nav>
          <Link
            to="/auth"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 hover:shadow-lg"
          >
            Tizimga kirish
          </Link>
        </div>
      </header>

      {/* ── Yuguruvchi satr (eng so'nggi yangilik) ── */}
      {latestNews && (
        <Link to="/news/$id" params={{ id: latestNews.id }} className="block bg-violet-600">
          <div className="overflow-hidden whitespace-nowrap py-2">
            <div className="landing-marquee inline-block">
              {Array.from({ length: 2 }).map((_, i) => (
                <span
                  key={i}
                  className="mx-8 inline-flex items-center text-sm font-semibold text-white"
                >
                  <Megaphone className="mr-2 inline h-4 w-4" aria-hidden="true" />
                  {latestNews.title} — batafsil o'qish uchun bosing
                  <span className="mx-8 opacity-50">•</span>
                  <Star className="mr-2 inline h-4 w-4 fill-current" aria-hidden="true" />
                  Kelajak sen bilan boshlanadi
                  <span className="mx-8 opacity-50">•</span>
                </span>
              ))}
            </div>
          </div>
        </Link>
      )}

      <main>
        {/* ── HERO ── */}
        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 text-center md:px-8 md:pt-20">
          {/* Suzib yuruvchi yorliqlar — haqiqiy ikonlar bilan */}
          <Sticker className="left-[4%] top-24 hidden md:block" rot={-8}>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Bilim sari yuksalish
            </span>
          </Sticker>
          <Sticker className="right-[5%] top-32 hidden md:block" rot={6} slow>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-rose-100 px-4 py-2 text-sm font-bold text-rose-600 shadow-sm">
              <Footprints className="h-4 w-4" aria-hidden="true" /> Har kun yangi qadam
            </span>
          </Sticker>
          <Sticker className="bottom-40 left-[8%] hidden lg:block" rot={-5} slow>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
              <Target className="h-4 w-4" aria-hidden="true" /> Yangi marralar sari
            </span>
          </Sticker>
          <Sticker className="bottom-48 right-[7%] hidden lg:block" rot={7}>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
              <Telescope className="h-4 w-4" aria-hidden="true" /> Yangi orzular sari
            </span>
          </Sticker>
          <Sticker className="left-[18%] top-10 hidden lg:block" rot={-10}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 shadow-sm">
              <Pencil className="h-6 w-6" aria-hidden="true" />
            </span>
          </Sticker>
          <Sticker className="right-[20%] top-8 hidden lg:block" rot={12} slow>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-sm">
              <Rocket className="h-6 w-6" aria-hidden="true" />
            </span>
          </Sticker>

          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-extrabold tracking-wide text-violet-700 shadow-sm">
              <Star className="h-4 w-4 fill-violet-500 text-violet-500" aria-hidden="true" />
              KELAJAK SEN BILAN BOSHLANADI
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-indigo-950 md:text-6xl">
              Istalgan joyda va vaqtda o'rganing —{" "}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                kelajagingizni biz bilan quring!
              </span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600">
              "Kelajak" markazi — to'garaklar, ilmiy testlar va shaxsiy portfolio orqali har bir
              o'quvchi o'z iqtidorini kashf etadigan makon.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#togaraklar"
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-violet-700 hover:shadow-[0_20px_50px_rgba(124,58,237,0.35)]"
              >
                To'garaklarni ko'rish <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-violet-200 bg-white px-8 py-4 text-lg font-bold text-violet-700 transition-all hover:border-violet-400 hover:shadow-lg"
              >
                Tizimga kirish
              </Link>
            </div>
          </Reveal>

          {/* Kamalak arklar — pastdan ko'tarilgan yarim doiralar.
              Doira markazi konteyner pastki chetida (translate-y-1/2), ortig'i
              overflow-hidden bilan kesiladi — tepadagi tugmalarga chiqmaydi. */}
          <div
            aria-hidden="true"
            className="relative mx-auto mt-12 h-52 w-full max-w-3xl overflow-hidden md:h-72"
          >
            <div className="absolute bottom-0 left-1/2 h-[480px] w-[480px] -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-200/70 md:h-[680px] md:w-[680px]" />
            <div className="absolute bottom-0 left-1/2 h-[340px] w-[340px] -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-300/60 md:h-[480px] md:w-[480px]" />
            <div className="absolute bottom-0 left-1/2 h-[210px] w-[210px] -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-400/50 md:h-[300px] md:w-[300px]" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <HeroImage />
            </div>
          </div>
        </section>

        {/* ── Jonli raqamlar ── */}
        <section className="mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 rounded-[32px] bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-violet-200 md:grid-cols-4 md:p-10">
              {[
                { value: stats?.schools ?? 0, label: "Hamkor maktablar", icon: School },
                { value: stats?.students ?? 0, label: "O'quvchilar", icon: GraduationCap },
                { value: stats?.clubs ?? 0, label: "To'garaklar", icon: Trophy },
                { value: stats?.tests ?? 0, label: "Topshirilgan testlar", icon: ClipboardCheck },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className="mx-auto mb-2 h-6 w-6 text-violet-200" aria-hidden="true" />
                  <p className="text-4xl font-extrabold">
                    <CountUp target={s.value} />
                  </p>
                  <p className="mt-1 text-sm text-violet-100">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── TO'GARAKLAR ── */}
        <section id="togaraklar" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-24 md:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
                <Landmark className="h-4 w-4" aria-hidden="true" /> "Kelajak" binosida
              </div>
              <h2 className="mb-3 text-4xl font-extrabold text-indigo-950 md:text-5xl">
                To'garaklarimiz
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Farzandingiz qiziqishiga mosini tanlang — joyida yozilish uchun "Qiziqish bildirish"
                tugmasini bosing, o'zimiz aloqaga chiqamiz.
              </p>
            </div>
          </Reveal>

          {(centerClubs ?? []).length === 0 ? (
            <Reveal>
              <p className="rounded-3xl border border-violet-100 bg-white p-12 text-center text-slate-500">
                To'garaklar ro'yxati tez orada e'lon qilinadi.
              </p>
            </Reveal>
          ) : (
            <Reveal>
              <Carousel opts={{ align: "start", loop: (centerClubs ?? []).length > 3 }}>
                <CarouselContent className="-ml-5 py-2">
                  {(centerClubs ?? []).map((c) => (
                    <CarouselItem key={c.id} className="pl-5 sm:basis-1/2 lg:basis-1/3">
                      <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-100">
                        {c.image_url ? (
                          <div className="h-44 overflow-hidden">
                            <img
                              src={c.image_url}
                              alt={c.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 text-6xl transition-transform duration-500 group-hover:scale-110">
                            {c.icon}
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-6">
                          <h3 className="mb-2 text-xl font-extrabold text-indigo-950">
                            {c.icon} {c.name}
                          </h3>
                          {c.description && (
                            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                              {c.description}
                            </p>
                          )}
                          <div className="mb-5 space-y-1.5 text-sm text-slate-500">
                            {c.schedule && (
                              <p className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-violet-500" /> {c.schedule}
                              </p>
                            )}
                            {c.age_range && (
                              <p className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-violet-500" /> {c.age_range}
                              </p>
                            )}
                            {c.teacher && (
                              <p className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-violet-500" /> {c.teacher}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setApplyClub(c)}
                            className="mt-auto w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-700 hover:shadow-lg"
                          >
                            Qiziqish bildirish
                          </button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {(centerClubs ?? []).length > 3 && (
                  <>
                    <CarouselPrevious className="-left-4 border-violet-200 bg-white text-violet-700" />
                    <CarouselNext className="-right-4 border-violet-200 bg-white text-violet-700" />
                  </>
                )}
              </Carousel>
            </Reveal>
          )}
        </section>

        {/* ── SENING YO'LING ── */}
        <section id="yol" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 md:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <h2 className="mb-3 flex items-center justify-center gap-3 text-4xl font-extrabold text-indigo-950 md:text-5xl">
                <Map className="h-9 w-9 text-violet-600" aria-hidden="true" /> Sening yo'ling
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Markazda har bir o'quvchi 4 qadamda o'z kelajagini topadi.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: Brain,
                title: "Testlarni topshir",
                text: "Holland, IQ, temperament — 8 ta ilmiy test sening kuchli tomonlaringni aniqlaydi.",
                bg: "bg-violet-100",
                fg: "text-violet-700",
              },
              {
                icon: Compass,
                title: "O'zingni kashf et",
                text: "Shaxsiy portfolio: radar diagramma, IQ, qiziqishlar — hammasi bir sahifada.",
                bg: "bg-emerald-100",
                fg: "text-emerald-700",
              },
              {
                icon: GraduationCap,
                title: "Kasbingni tanla",
                text: "AI tavsiyasi bilan senga eng mos kasblar va universitetlar ro'yxati.",
                bg: "bg-amber-100",
                fg: "text-amber-700",
              },
              {
                icon: Rocket,
                title: "To'garakda rivojlan",
                text: "Qiziqishingga mos to'garakka yozil va orzuing sari birinchi qadamni tashla.",
                bg: "bg-rose-100",
                fg: "text-rose-600",
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 150}>
                <div className="group relative h-full rounded-3xl border border-violet-100 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-950 px-3 py-1 text-xs font-bold text-white">
                    {i + 1}-qadam
                  </div>
                  <div
                    className={`mx-auto mb-4 mt-2 flex h-16 w-16 items-center justify-center rounded-2xl ${s.bg} ${s.fg} transition-transform group-hover:scale-110 group-hover:-rotate-6`}
                  >
                    <s.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className={`mb-2 text-lg font-extrabold ${s.fg}`}>{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── YANGILIKLAR ── */}
        {(news ?? []).length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-24 md:px-8">
            <Reveal>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="mb-2 flex items-center gap-3 text-4xl font-extrabold text-indigo-950">
                    <Newspaper className="h-9 w-9 text-violet-600" /> Yangiliklar
                  </h2>
                  <p className="text-lg text-slate-600">Markaz hayotidan so'nggi xabarlar</p>
                </div>
                <Link
                  to="/news"
                  className="inline-flex items-center gap-1.5 font-bold text-violet-600 transition-colors hover:text-violet-700"
                >
                  Barchasi <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {(news ?? []).map((n, i) => (
                <Reveal key={n.id} delay={i * 120}>
                  <Link
                    to="/news/$id"
                    params={{ id: n.id }}
                    className="group block h-full overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl"
                  >
                    {n.cover_url ? (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={n.cover_url}
                          alt={n.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50">
                        <Newspaper className="h-10 w-10 text-violet-300" />
                      </div>
                    )}
                    <div className="p-6">
                      {n.published_at && (
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-400">
                          {new Date(n.published_at).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      <h3 className="mb-2 text-lg font-extrabold text-indigo-950 transition-colors group-hover:text-violet-600">
                        {n.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {n.excerpt ?? n.body}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section className="mx-auto max-w-3xl px-4 pt-24 md:px-8">
          <Reveal>
            <h2 className="mb-8 flex items-center justify-center gap-3 text-center text-4xl font-extrabold text-indigo-950">
              <MessageCircleQuestion className="h-9 w-9 text-violet-600" aria-hidden="true" />
              Ko'p so'raladigan savollar
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Accordion
              type="single"
              collapsible
              className="rounded-3xl border border-violet-100 bg-white px-6 shadow-sm"
            >
              <AccordionItem value="q1">
                <AccordionTrigger className="text-left font-bold text-indigo-950">
                  To'garakka qanday yozilamiz?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Yoqqan to'garak kartasida "Qiziqish bildirish" tugmasini bosing, ism va telefon
                  raqamingizni qoldiring — mas'ul xodimimiz o'zi aloqaga chiqadi.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger className="text-left font-bold text-indigo-950">
                  Testlarni kim topshira oladi?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Hamkor maktab o'quvchilari — maktab maslahatchisi beradigan login va parol bilan
                  tizimga kirib, barcha testlarni bepul topshiradi.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger className="text-left font-bold text-indigo-950">
                  Natijalarni kim ko'radi?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  O'quvchining shaxsiy portfoliosini o'zi va faqat o'z maktabining maslahatchisi
                  ko'radi — ma'lumotlar boshqa hech kimga ochiq emas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger className="text-left font-bold text-indigo-950">
                  To'garaklar pullikmi?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Har bir to'garakning shartlari turlicha — ariza qoldirsangiz, aloqaga chiqib
                  barcha tafsilotlarni aytib beramiz.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>
        </section>

        {/* ── ALOQA ── */}
        <section id="aloqa" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] bg-indigo-950 p-10 text-white md:p-14">
              <Sticker className="right-8 top-8" rot={10}>
                <Sparkles className="h-10 w-10 text-fuchsia-300/80" aria-hidden="true" />
              </Sticker>
              <Sticker className="bottom-8 left-10 hidden md:block" rot={-8} slow>
                <Target className="h-10 w-10 text-violet-300/80" aria-hidden="true" />
              </Sticker>
              <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
                    Savolingiz bormi? Keling, gaplashamiz!
                  </h2>
                  <p className="text-indigo-200">
                    "Kelajak" binosiga tashrif buyuring yoki qo'ng'iroq qiling — farzandingiz uchun
                    eng mos yo'nalishni birga tanlaymiz.
                  </p>
                </div>
                <div className="space-y-3 text-lg">
                  <p className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-fuchsia-300" />
                    "Kelajak" binosi (manzilni admin paneldan yangilang)
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-fuchsia-300" />
                    +998 (__) ___-__-__
                  </p>
                  <p className="flex items-center gap-3">
                    <Send className="h-5 w-5 shrink-0 text-fuchsia-300" />
                    @kelajak_markazi
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-violet-100 bg-white py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} "Kelajak" markazi — kelajak sen bilan boshlanadi
      </footer>

      {/* ── Qiziqish bildirish dialogi ── */}
      <ApplyDialog club={applyClub} onClose={() => setApplyClub(null)} />
    </div>
  );
}

/* ─── Ariza dialogi ────────────────────────────────────────────────────────── */
function ApplyDialog({ club, onClose }: { club: CenterClub | null; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!fullName.trim() || phone.replace(/\D/g, "").length < 9) {
      toast.error("Ism va to'g'ri telefon raqam kiriting");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("club_applications").insert({
      center_club_id: club?.id ?? null,
      club_name: club?.name ?? null,
      full_name: fullName.trim(),
      phone: phone.trim(),
      note: note.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error("Yuborilmadi — birozdan keyin qayta urinib ko'ring");
      return;
    }
    setSent(true);
  }

  function close() {
    onClose();
    // Dialog yopilgach formani tozalaymiz
    setTimeout(() => {
      setFullName("");
      setPhone("");
      setNote("");
      setSent(false);
    }, 300);
  }

  return (
    <Dialog open={!!club} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="py-6 text-center">
            <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <PartyPopper className="h-8 w-8" aria-hidden="true" />
            </span>
            <DialogTitle className="mb-2">Arizangiz qabul qilindi!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Tez orada mas'ul xodimimiz siz bilan bog'lanadi.
            </p>
            <Button className="mt-6" onClick={close}>
              Yopish
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {club?.icon} {club?.name} — qiziqish bildirish
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="a-name">
                  Ism-familiya <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="a-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Karimova Madina (yoki farzandingiz ismi)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-phone">
                  Telefon raqam <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="a-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-note">Izoh (ixtiyoriy)</Label>
                <Textarea
                  id="a-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Yoshi, qulay vaqt..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={sending}>
                Bekor qilish
              </Button>
              <Button onClick={submit} disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Yuborish
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
