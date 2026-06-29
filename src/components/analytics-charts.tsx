// "Tahlil" sahifasidagi recharts'ga asoslangan grafiklar — ALOHIDA komponent.
//
// Nega alohida? recharts (~104 KB gzip) og'ir. Bu komponent analytics.tsx'da
// React.lazy bilan yuklanadi — KPI kartalari darhol ko'rinadi, grafik kutubxonasi
// esa fonda yuklanadi. Shu tariqa sahifaning idrok etiladigan tezligi oshadi.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const PIE_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

export interface NameValue {
  name: string;
  value: number;
}
export interface HollandDatum {
  short: string;
  name: string;
  value: number;
}

interface Props {
  holland: HollandDatum[];
  temperament: NameValue[];
  testPopularity: NameValue[];
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default function AnalyticsCharts({ holland, temperament, testPopularity }: Props) {
  return (
    <>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Holland taqsimoti */}
        <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground">Holland yoʻnalishlari taqsimoti</h3>
            {holland.length === 0 ? (
              <EmptyChart text="Holland testi natijalari hali yoʻq" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holland}>
                    <XAxis dataKey="short" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid oklch(0.92 0.01 247)",
                        fontSize: 12,
                      }}
                      formatter={(v: number, _n, p: { payload?: { name?: string } }) => [
                        `${v} ta`,
                        p?.payload?.name ?? "",
                      ]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {holland.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temperament taqsimoti */}
        <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground">Temperament taqsimoti</h3>
            {temperament.length === 0 ? (
              <EmptyChart text="Ayzenk testi natijalari hali yoʻq" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={temperament}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {temperament.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v: number) => [`${v} ta`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test mashhurligi */}
      <Card className="mt-6 border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold text-foreground">Testlar boʻyicha yechilganlik</h3>
          {testPopularity.length === 0 ? (
            <EmptyChart text="Hali test yakunlanmagan" />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testPopularity} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} ta`, "Yechilgan"]} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="oklch(0.546 0.215 262.9)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
