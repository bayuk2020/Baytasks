/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import {
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Activity,
  Brain,
  Flame,
  Wallet,
  NotebookPen,
  Library,
  Target,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  analyticsApi,
  type AnalyticsOverview,
  type AnalyticsAdvice,
} from "@/lib/api";
import { formatDuration } from "@/lib/pomodoroStore";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — BayTasks" }],
  }),
  component: Analytics,
});

const RANGES = [7, 14, 30, 90] as const;

const MODULE_META: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  tasks: { label: "Tasks", icon: CheckCircle2, color: "text-cyan-300" },
  focus: { label: "Focus", icon: Brain, color: "text-violet-300" },
  habits: { label: "Habits", icon: Flame, color: "text-orange-300" },
  finance: { label: "Finance", icon: Wallet, color: "text-emerald-300" },
  journal: { label: "Journal", icon: NotebookPen, color: "text-sky-300" },
  reading: { label: "Reading", icon: Library, color: "text-amber-300" },
  goals: { label: "Goals", icon: Target, color: "text-rose-300" },
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
};

function Analytics() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [advice, setAdvice] = useState<AnalyticsAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  // BUG LAMA: halaman ini sama sekali tidak memuat data (tidak ada loadTasks),
  // dan hanya memfilter board yang sedang aktif -- makanya "Weekly Performance"
  // selalu terlihat kosong kalau /analytics dibuka langsung. Sekarang semua
  // angka datang dari satu endpoint agregat lintas SEMUA board & modul.
  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await analyticsApi.overview(range));
    } catch (err) {
      console.error("LOAD ANALYTICS ERROR", err);
      setError("Gagal memuat data analytics dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
    // Saran AI sengaja TIDAK ikut dimuat otomatis -- tiap panggilan memakai
    // kuota provider, jadi user yang memutuskan kapan memintanya.
    setAdvice(null);
  }, [days, load]);

  const askAdvice = async () => {
    setAdviceLoading(true);
    try {
      setAdvice(await analyticsApi.advice(days));
    } catch (err) {
      console.error("LOAD ADVICE ERROR", err);
      setAdvice({ success: false, message: "AI tidak bisa dihubungi saat ini." });
    } finally {
      setAdviceLoading(false);
    }
  };

  const exportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baytasks-analytics-${days}d-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const daily = (data?.daily ?? []).map((d) => ({
    ...d,
    label: shortDate(d.date),
    focusJam: +(d.focusSeconds / 3600).toFixed(2),
  }));

  // Rata-rata bergerak 7 hari -- garis tren di atas batang harian, supaya
  // kelihatan arah jangka panjangnya tanpa terganggu naik-turun harian.
  const focusChart = daily.map((d, i, arr) => {
    const from = Math.max(0, i - 6);
    const window = arr.slice(from, i + 1);
    const avg = window.reduce((a, x) => a + x.focusMinutes, 0) / window.length;
    return { ...d, avg7: +avg.toFixed(1) };
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.04] via-background to-blue-500/[0.03] p-6 shadow-[0_0_50px_rgba(34,211,238,0.06)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)] pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-100 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Analytics
              </h1>
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Rekap seluruh modul BayTasks{data ? ` · ${shortDate(data.range.from)} – ${shortDate(data.range.to)}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* FILTER RENTANG */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setDays(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    days === r
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}h
                </button>
              ))}
            </div>

            <button
              onClick={exportJson}
              disabled={!data}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 text-sm hover:bg-cyan-500/20 transition disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </motion.header>

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">Memuat data…</div>
      ) : data ? (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPI
              title="Open Tasks"
              value={data.tasks.openTotal}
              sub={`${data.tasks.overdue} lewat deadline`}
              icon={<Clock3 className="h-5 w-5" />}
              glow="from-cyan-500/40 via-cyan-400/20 to-blue-500/30"
            />
            <KPI
              title="Selesai"
              value={data.tasks.completedInRange}
              sub={`${data.tasks.completionRate}% completion rate`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              glow="from-emerald-500/40 via-emerald-400/20 to-green-500/30"
            />
            <KPI
              title="Total Focus"
              value={formatDuration(data.focus.focusSeconds)}
              sub={`${data.focus.sessionCount} sesi · ${data.focus.activeDays} hari aktif`}
              icon={<Brain className="h-5 w-5" />}
              glow="from-violet-500/40 via-fuchsia-400/20 to-indigo-500/30"
            />
            <KPI
              title="Konsistensi Habit"
              value={`${data.habits.overallConsistency}%`}
              sub={`${data.habits.completionsInRange} dari ${data.habits.possible} kemungkinan`}
              icon={<Activity className="h-5 w-5" />}
              glow="from-orange-500/40 via-amber-400/20 to-red-500/30"
            />
          </div>

          {/* FOCUS TIME HARIAN */}
          <Panel
            title="Progres Focus Time Harian"
            subtitle="Batang = menit fokus per hari · garis = rata-rata bergerak 7 hari"
          >
            <div className="h-80">
              <ResponsiveContainer>
                <ComposedChart data={focusChart}>
                  <defs>
                    <linearGradient id="focusBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} unit="m" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [
                      `${v} menit`,
                      name === "focusMinutes" ? "Fokus" : "Rata-rata 7 hari",
                    ]}
                  />
                  <Legend
                    formatter={(v) => (v === "focusMinutes" ? "Fokus harian" : "Rata-rata 7 hari")}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="focusMinutes" fill="url(#focusBar)" radius={[6, 6, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="avg7"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={false}
                    strokeDasharray="4 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Rata-rata / hari aktif" value={formatDuration(data.focus.avgPerActiveDaySeconds)} />
              <Stat label="Rata-rata / hari" value={formatDuration(data.focus.avgPerDaySeconds)} />
              <Stat label="Rasio fokus" value={`${data.focus.focusRatio}%`} />
              <Stat
                label="Hari terbaik"
                value={
                  data.focus.bestDay
                    ? `${shortDate(data.focus.bestDay.date)} · ${formatDuration(data.focus.bestDay.seconds)}`
                    : "-"
                }
              />
            </div>
          </Panel>

          {/* PERFORMANCE + PRIORITY */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <Panel
                title="Task Performance"
                subtitle="Task dibuat vs diselesaikan per hari"
              >
                <div className="h-80">
                  <ResponsiveContainer>
                    <AreaChart data={daily}>
                      <defs>
                        <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        formatter={(v) => (v === "tasksCompleted" ? "Selesai" : "Dibuat")}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {/* Dua-duanya digambar -- versi lama menghitung `created`
                          tapi tidak pernah menampilkannya. */}
                      <Area type="monotone" dataKey="tasksCreated" stroke="#f59e0b" fill="url(#gNew)" strokeWidth={2} />
                      <Area type="monotone" dataKey="tasksCompleted" stroke="#06b6d4" fill="url(#gDone)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel title="Open by Priority">
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart
                    data={(["urgent", "high", "med", "low"] as const).map((p) => ({
                      priority: p,
                      count: data.tasks.byPriority[p],
                    }))}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="priority" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                      {(["urgent", "high", "med", "low"] as const).map((p, i) => (
                        <Cell
                          key={i}
                          fill={
                            p === "urgent" ? "#ef4444" : p === "high" ? "#f97316" : p === "med" ? "#06b6d4" : "#64748b"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          {/* SCORE HARIAN */}
          <Panel title="Skor Produktivitas Harian" subtitle="Gabungan volume fokus, rasio fokus, dan penyelesaian task">
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/100`, "Score"]} />
                  <Area type="monotone" dataKey="score" stroke="#34d399" fill="url(#gScore)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* MODUL LAIN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Habits" subtitle="Konsistensi per kebiasaan di rentang ini">
              {data.habits.breakdown.length === 0 ? (
                <Empty text="Belum ada habit aktif." />
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {data.habits.breakdown.map((h) => (
                    <li key={h.title} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{h.title}</span>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {h.completed}× · {h.consistency}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300"
                          style={{ width: `${Math.min(100, h.consistency)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Finance" subtitle="Arus kas & kategori paling boros">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Masuk" value={rupiah(data.finance.income)} tone="text-emerald-300" />
                <Stat label="Keluar" value={rupiah(data.finance.expense)} tone="text-rose-300" />
                <Stat
                  label="Arus kas"
                  value={rupiah(data.finance.cashflow)}
                  tone={data.finance.cashflow >= 0 ? "text-emerald-300" : "text-rose-300"}
                />
              </div>
              {data.finance.topExpenseCategories.length === 0 ? (
                <Empty text="Belum ada transaksi di rentang ini." />
              ) : (
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart data={data.finance.topExpenseCategories} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [rupiah(v), "Total"]} />
                      <Bar dataKey="total" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Panel title="Journal">
              <div className="text-3xl font-bold">{data.journal.entries}</div>
              <p className="text-xs text-muted-foreground mt-1">entri di rentang ini</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(data.journal.byMood).map(([mood, n]) => (
                  <span key={mood} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary border border-border">
                    {mood}: {n}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Reading Vault">
              <div className="text-3xl font-bold">{data.reading.pagesRead}</div>
              <p className="text-xs text-muted-foreground mt-1">halaman terbaca</p>
              <p className="text-sm mt-3 text-muted-foreground">
                {data.reading.reading} dibaca · {data.reading.completed} selesai · {data.reading.wishlist} wishlist
              </p>
            </Panel>

            <Panel title="Goals">
              <div className="text-3xl font-bold">{data.goals.avgProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">rata-rata progres</p>
              <p className="text-sm mt-3 text-muted-foreground">
                {data.goals.completed} dari {data.goals.total} goal selesai
              </p>
            </Panel>
          </div>

          {/* SARAN AI */}
          <section className="glass rounded-3xl p-5 border border-border/40">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-medium inline-flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-300" /> Saran AI
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI menafsirkan angka di atas, per modul, lalu merangkumnya jadi langkah berikutnya.
                  {advice?.provider ? ` Provider: ${advice.provider}.` : ""}
                </p>
              </div>

              <button
                onClick={askAdvice}
                disabled={adviceLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-100 text-sm hover:bg-amber-500/20 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${adviceLoading ? "animate-spin" : ""}`} />
                {adviceLoading ? "Menganalisis…" : advice ? "Analisis ulang" : "Minta saran AI"}
              </button>
            </div>

            {!advice && !adviceLoading && (
              <Empty text="Klik “Minta saran AI” untuk menganalisis data di atas." />
            )}

            {advice && !advice.success && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {advice.message ?? "AI gagal merespons."}
              </div>
            )}

            {advice?.success && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.entries(advice.modules ?? {}).map(([key, text]) => {
                    const meta = MODULE_META[key];
                    const Icon = meta?.icon ?? Sparkles;
                    return (
                      <div key={key} className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className={`inline-flex items-center gap-2 text-sm font-medium ${meta?.color ?? ""}`}>
                          <Icon className="h-4 w-4" />
                          {meta?.label ?? key}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                      </div>
                    );
                  })}
                </div>

                {advice.summary && (
                  <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.07] p-4">
                    <div className="text-sm font-medium text-cyan-100">Ringkasan keseluruhan</div>
                    <p className="mt-2 text-sm leading-relaxed">{advice.summary}</p>
                  </div>
                )}

                {(advice.nextSteps?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
                    <div className="text-sm font-medium text-emerald-100">Yang sebaiknya kamu lakukan</div>
                    <ol className="mt-2 space-y-1.5">
                      {advice.nextSteps!.map((s, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-emerald-300 font-semibold shrink-0">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass rounded-3xl p-5 border border-border/40 h-full"
    >
      <div className="mb-4">
        <h2 className="font-medium">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold truncate ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

function KPI({
  title,
  value,
  sub,
  icon,
  glow,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  glow: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br ${glow} p-5 shadow-[0_0_30px_rgba(0,0,0,0.15)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)] pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-2 text-2xl md:text-3xl font-bold truncate">{value}</div>
          {sub && <div className="mt-1 text-[11px] text-muted-foreground truncate">{sub}</div>}
        </div>
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
