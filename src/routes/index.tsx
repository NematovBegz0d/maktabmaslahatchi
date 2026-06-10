import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Brain, Target, Users, Check, Star, BarChart2, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduLens — Maktab maslahatchisi platformasi" },
      { name: "description", content: "O'quvchilarning psixologiyasi, intellekti va kelajagini ilmiy testlar orqali aniqlash tizimi." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <Link
          to="/auth"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
        >
          Tizimga kirish
        </Link>
      </header>

      <main className="px-4 pb-24 pt-12 md:px-8 md:pt-20">

        {/* Hero */}
        <section className="mx-auto mb-24 max-w-4xl text-center md:mb-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
            Maktab maslahatchilari uchun professional vosita
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            O'quvchini chuqur
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              tushunish vositasi
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600">
            EduLens — ilmiy psixologik testlar orqali har bir o'quvchining shaxsiyati, intellekti,
            qiziqishlari va kuchli tomonlarini aniqlab, kelajagi uchun shaxsiy portfolio tuzadi.
          </p>

          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
          >
            Tizimga kirish
          </Link>
        </section>

        {/* Feature cards */}
        <section className="mx-auto mb-24 grid max-w-7xl grid-cols-1 gap-6 md:mb-32 md:grid-cols-3">
          {[
            {
              icon: Brain,
              iconBg: "bg-blue-50",
              iconText: "text-blue-600",
              iconHover: "group-hover:bg-blue-600",
              title: "8 ta ilmiy test",
              text: "Holland, Ayzenk, Big Five, Raven IQ, EQ, Liderlik va boshqalar — xalqaro standartlar asosida.",
            },
            {
              icon: FileText,
              iconBg: "bg-purple-50",
              iconText: "text-purple-600",
              iconHover: "group-hover:bg-purple-600",
              title: "Shaxsiy portfolio",
              text: "Har bir o'quvchi uchun to'liq psixologik profil — kuchli tomonlar, temperament, IQ, kasb tavsiyalari.",
            },
            {
              icon: BarChart2,
              iconBg: "bg-indigo-50",
              iconText: "text-indigo-600",
              iconHover: "group-hover:bg-indigo-600",
              title: "Maslahatchi paneli",
              text: "Barcha o'quvchilarni bir yerda ko'ring, tahlil qiling va har biri bo'yicha chuqur xulosa oling.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${f.iconBg} ${f.iconText} transition-colors ${f.iconHover} group-hover:text-white`}>
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h3>
              <p className="leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-4xl font-extrabold text-slate-900 md:text-5xl">Qanday ishlaydi?</h2>
            <p className="mb-10 text-lg text-slate-600">
              Maslahatchi nazoratida to'liq psixologik profil shakllanadi.
            </p>

            <div className="space-y-6">
              {[
                { n: "1", title: "Maslahatchi tizimga kiradi", sub: "O'z maktabining o'quvchilari ro'yxatini ko'radi" },
                { n: "2", title: "O'quvchilar testlarni topshiradi", sub: "Holland, IQ, EQ, Ayzenk va boshqa 8 ta test" },
                { n: "3", title: "Portfolio avtomatik shakllanadi", sub: "Radar chart, IQ, temperament, kuchli tomonlar" },
                { n: "4", title: "Maslahatchi tahlil qiladi", sub: "AI xulosa va kasbiy tavsiyalar bilan ishlaydi" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.title}</p>
                    <p className="text-slate-500">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test showcase */}
          <div className="relative">
            <div className="absolute inset-0 rotate-3 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-2xl" />
            <div className="relative space-y-3 rounded-[40px] border border-white/50 bg-white/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              {[
                { code: "H", label: "Holland RIASEC", sub: "Kasb yo'nalishi", bg: "bg-indigo-50", color: "text-indigo-600" },
                { code: "A", label: "Ayzenk", sub: "Temperament", bg: "bg-purple-50", color: "text-purple-600" },
                { code: "R", label: "Raven IQ", sub: "Intellekt darajasi", bg: "bg-blue-50", color: "text-blue-600" },
                { code: "B", label: "Big Five", sub: "Shaxsiyat tipi", bg: "bg-green-50", color: "text-green-600" },
              ].map((t, i) => (
                <div
                  key={t.label}
                  className={`flex items-center justify-between rounded-2xl p-4 shadow-sm transition-transform hover:scale-[1.02] ${i === 3 ? "bg-slate-900" : "border border-slate-100 bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${i === 3 ? "bg-white/10 text-white" : `${t.bg} ${t.color}`}`}>
                      {t.code}
                    </div>
                    <span className={`font-bold ${i === 3 ? "text-white" : "text-slate-900"}`}>{t.label}</span>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${i === 3 ? "text-slate-400" : "text-slate-400"}`}>{t.sub}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="font-bold text-white">AI psixologik xulosa</span>
                <span className="ml-auto text-xs font-semibold text-indigo-200">Avtomatik</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto mt-24 max-w-4xl md:mt-32">
          <div className="grid grid-cols-2 gap-6 rounded-3xl bg-indigo-600 p-8 text-white md:grid-cols-4">
            {[
              { value: "8", label: "Ilmiy test" },
              { value: "6", label: "Psixologik ko'rsatkich" },
              { value: "15+", label: "Kasb tavsiyasi" },
              { value: "AI", label: "Xulosa tahlili" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold">{s.value}</p>
                <p className="mt-1 text-sm text-indigo-200">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-10 text-center text-sm text-slate-400 md:px-8">
        © {new Date().getFullYear()} EduLens — Maktab maslahatchilari uchun
      </footer>
    </div>
  );
}
