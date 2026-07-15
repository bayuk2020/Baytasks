/* eslint-disable prettier/prettier */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, CalendarClock, Flag, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
// 🌟 FIX: Impor computeGoalProgress untuk kalkulasi persentase agregat dinamis
import { velocityPerDay, projectedCompletion, formatValue, remainingAmount, computeGoalProgress } from "@/lib/goals/goals";

export function GoalAnalytics({ goal, accent }: { goal: any; accent: string }) {
  const tasks = useStore((s: any) => s.tasks || []);
  const habitLogs = useStore((s: any) => s.habitLogs || []);
  const milestones = useStore((s: any) => s.milestones || []);
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const habits = (useStore((s: any) => s.habits) || []);

  // 1. Siapkan full context agar sinkron dengan algoritma goals.ts
  const ctx = { tasks, habitLogs, milestones, habits };

  // 2. 🌟 FIX UTAMA: Hitung ulang progress secara reaktif di tingkat klien
  const calculated = computeGoalProgress(goal, ctx);
  const pct = calculated.pct;

  const ms = milestones.filter((m: any) => m.goalId?.toString() === goal.id?.toString() || m.goal_id?.toString() === goal.id?.toString());
  const msDone = ms.filter((m: any) => m.completed).length;
  const msRate = ms.length ? Math.round((msDone / ms.length) * 100) : 0;

  const velocity = velocityPerDay(goal);
  const proj = projectedCompletion(goal);

  const qPlans = useMemo(
    () => plans.filter((p: any) => p.goalId?.toString() === goal.id?.toString() || p.goal_id?.toString() === goal.id?.toString())
               .sort((a: any, b: any) => a.year - b.year || a.quarter - b.quarter),
    [plans, goal.id],
  );

  // 3. 🌟 FIX PROGRESS TREND: Hitung tren berdasarkan data riil penyelesaian item saat ini
  const trend = useMemo(() => {
    if (qPlans.length === 0) return [];
    return qPlans.map((p: any) => {
      if (p.target_amount > 0) {
        return Math.min(100, Math.round((p.current_amount / p.target_amount) * 100));
      }
      // Jika rencana kuartal kosong, gunakan fallback persentase kalkulasi saat ini sebagai titik tren
      return pct;
    });
  }, [qPlans, pct]);

  const maxTrend = Math.max(100, ...trend);

  return (
    <div className="space-y-5 text-white text-xs">
      {/* Batang Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Gauge className="h-4 w-4" />} label="Overall progress" value={`${pct}%`} accent={accent} highlight />
        <Stat icon={<Flag className="h-4 w-4" />} label="Milestones" value={`${msRate}%`} accent={accent} sub={`${msDone}/${ms.length} done`} />
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Goal velocity"
          value={velocity > 0 ? `${formatValue(goal, velocity * 30)}` : "—"}
          accent={accent}
          sub="per month"
        />
        <Stat
          icon={<CalendarClock className="h-4 w-4" />}
          label="Projected finish"
          value={proj ? new Date(proj).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "—"}
          accent={accent}
          sub={`${formatValue(goal, remainingAmount(goal))} left`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kinerja Triwulan */}
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
          <h3 className="font-semibold text-white/90 mb-1">Quarterly performance</h3>
          <p className="text-[11px] text-muted-foreground mb-5">Completion against each quarter's target.</p>
          {qPlans.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-white/5 rounded-xl bg-black/10 text-muted-foreground">
              No quarterly plans yet.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-44 pt-4">
              {qPlans.map((p: any, i: number) => {
                const v = p.target_amount > 0 ? Math.min(100, Math.round((p.current_amount / p.target_amount) * 100)) : pct;
                return (
                  <div key={p.id} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-[10px] text-muted-foreground">{v}%</div>
                    <div className="w-full flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ delay: i * 0.05, type: "spring", stiffness: 80 }}
                        className="w-full rounded-t-lg"
                        style={{ background: `linear-gradient(180deg, ${accent}, rgba(0,0,0,0.2))` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold">Q{p.quarter}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grafik Tren Svg */}
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
          <h3 className="font-semibold text-white/90 mb-1">Progress trend</h3>
          <p className="text-[11px] text-muted-foreground mb-5">Cumulative completion over planned periods.</p>
          {trend.length < 2 ? (
            <div className="py-10 text-center border border-dashed border-white/5 rounded-xl bg-black/10 text-muted-foreground">
              Need at least two quarters or points to chart a trend curve. Current progress: {pct}%
            </div>
          ) : (
            <Sparkline values={trend} max={maxTrend} accent={accent} />
          )}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Milestone completion</span>
            <div className="flex-1 mx-3 h-2 rounded-full bg-black/40 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${msRate}%` }} className="h-full rounded-full" style={{ background: accent }} />
            </div>
            <span className="text-xs font-bold" style={{ color: accent }}>{msRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values, max, accent }: { values: number[]; max: number; accent: string }) {
  const w = 320, h = 120, pad = 8;
  const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 overflow-visible">
      <defs>
        <linearGradient id="goalArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={area} fill="url(#goalArea)" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} d={path} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
      ))}
    </svg>
  );
}

function Stat({ icon, label, value, sub, accent, highlight }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent: string; highlight?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-white/5 bg-white/[0.02] rounded-2xl p-4 relative overflow-hidden">
      {highlight && <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-20" style={{ background: accent }} />}
      <div className="relative flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="relative mt-2 text-xl font-bold" style={{ color: highlight ? accent : undefined }}>{value}</div>
      {sub && <div className="relative mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}