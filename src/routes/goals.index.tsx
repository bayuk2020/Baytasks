/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import GlowButton from "@/components/ui/GlowButton";
import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Plus, List, Flag, TrendingUp, CheckCircle2, Clock, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { GoalCard } from "@/components/goals/GoalCard";
import { AICoach } from "@/components/goals/AICoach";
// 🌟 FIX IMPORE: Ambil fungsi hitung progress reaktif
import { generateInsights, computeGoalProgress, type CoachInsight } from "@/lib/goals/goals";

export const Route = createFileRoute("/goals/")({
  head: () => ({
    meta: [
      { title: "Goals — BayTasks" },
      { name: "description", content: "Your personal goals command center." },
    ],
  }),
  component: GoalsDashboard,
});

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },      
  career: { label: "Career", emoji: "🚀", color: "#0ea5e9" },       
  health: { label: "Health", emoji: "💪", color: "#ef4444" },       
  relationship: { label: "Relationship", emoji: "❤️", color: "#ec4899" }, 
  learning: { label: "Learning", emoji: "📚", color: "#eab308" },   
  spiritual: { label: "Spiritual", emoji: "🧘", color: "#a855f7" },  
  business: { label: "Business", emoji: "📈", color: "#3b82f6" },   
};

function GoalsDashboard() {
  const goals = useStore((s: any) => s.goals || []);
  const milestones = useStore((s: any) => s.milestones || []);
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const tasks = useStore((s: any) => s.tasks || []);
  const habitLogs = useStore((s: any) => s.habitLogs || []);
  const habits = useStore((s: any) => s.habits || []);
  const loadGoals = useStore((s: any) => s.loadGoals);

  useEffect(() => {
    if (loadGoals) {
      loadGoals();
    }
  }, [loadGoals]);

  // 1. 🌟 FIX UTAMA: Petakan data goals mentah menjadi data live yang akurat
  const liveGoals = useMemo(() => {
    const ctx = { tasks, habitLogs, milestones, habits };
    return goals.map((g: any) => {
      const progress = computeGoalProgress(g, ctx);
      const isLiveCompleted = g.status === "completed" || g.completed === 1 || progress.pct >= 100;
      return {
        ...g,
        livePct: progress.pct,
        liveCompleted: isLiveCompleted
      };
    });
  }, [goals, tasks, habitLogs, milestones, habits]);

  // 2. 🌟 SINKRONISASI STATS KPI: Hitung statistik berdasarkan data live
  const stats = useMemo(() => {
    const total = liveGoals.length;
    const completed = liveGoals.filter((g: any) => g.liveCompleted);
    const active = liveGoals.filter((g: any) => !g.liveCompleted);
    
    const rate = total ? Math.round((completed.length / total) * 100) : 0;
    
    const q = Math.floor(new Date().getMonth() / 3) + 1;
    const qThis = plans.filter((p: any) => p.quarter === q && p.year === new Date().getFullYear());
    const qTarget = qThis.reduce((a: number, p: any) => a + (p.target || p.target_amount || 0), 0);
    const qCurrent = qThis.reduce((a: number, p: any) => a + (p.current || p.current_amount || 0), 0);
    const qPct = qTarget > 0 ? Math.round((qCurrent / qTarget) * 100) : rate; // Gunakan rate total jika plan q kosong
    
    return { 
      total, 
      active: active.length, 
      completed: completed.length, 
      rate, 
      qPct, 
      q 
    };
  }, [liveGoals, plans]);

  // Gunakan data aktif live untuk list kartu di bawah
const activeGoals = useMemo(() => {
    return [...liveGoals].slice(0, 6);
  }, [liveGoals]);

  const recent = useMemo(() => [...liveGoals].slice(0, 4), [liveGoals]);

  const upcoming = useMemo(() => {
    return milestones
      .filter((m: any) => !m.completed && m.dueAt)
      .sort((a: any, b: any) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
      .slice(0, 6)
      .map((m: any) => ({ 
        m, 
        goal: liveGoals.find((g: any) => g.id?.toString() === m.goalId?.toString() || g.id?.toString() === m.goal_id?.toString()) 
      }))
      .filter((x: any) => x.goal);
  }, [milestones, liveGoals]);

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    liveGoals.forEach((g: any) => {
      const name = (g.lifeArea || g.area?.name || "career").toLowerCase();
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [liveGoals]);

  const summaryInsights: CoachInsight[] = useMemo(() => {
    const ctx = { tasks, habitLogs, milestones, plans };
    const topActive = liveGoals
      .filter((g: any) => !g.liveCompleted)
      .map((g: any) => ({ g, ins: generateInsights(g, ctx) }));
      
    const warnings = topActive.flatMap(({ g, ins }: any) => ins.filter((i: any) => i.tone === "warning").slice(0, 1).map((i: any) => ({ ...i, text: `${g.title || g.name}: ${i.text}` })));
    const wins = topActive.flatMap(({ g, ins }: any) => ins.filter((i: any) => i.tone === "positive").slice(0, 1).map((i: any) => ({ ...i, text: `${g.title || g.name}: ${i.text}` })));
    
    const out = [...warnings.slice(0, 2), ...wins.slice(0, 2)];
    if (out.length === 0) {
      // Tampilkan info pemenang jika target skripsi beres 100%
      const clearGoal = liveGoals.find((g: any) => g.liveCompleted);
      if (clearGoal) {
        out.push({ tone: "positive", text: `Luar biasa! Target "${clearGoal.title || clearGoal.name}" telah tercapai 100%.` });
      } else {
        out.push({ tone: "neutral", text: `Tracking ${stats.active} active goals at a ${stats.rate}% completion rate.` });
      }
    }
    return out.slice(0, 4);
  }, [liveGoals, milestones, plans, tasks, habitLogs, stats]);

  return (
    <div className="space-y-7 relative text-white text-xs">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <header className="flex items-end justify-between flex-wrap gap-3 relative border-b border-white/5 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Vision → Goal → Milestone → Quarter → Task</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Goals <span className="neon-text">Command Center</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/goals/list" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition font-semibold">
            <BrowseList className="h-4 w-4" /> All Goals
          </Link>
          <Link to="/goals/create">
            <GlowButton>
              <Plus className="h-4 w-4" />
              <span>New Goal</span>
            </GlowButton>
          </Link>
        </div>
      </header>

      {/* 🌟 SEKARANG KARTU KPI DI ATAS BERUBAH SINKRON SECARA LIVE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <KPI icon={<Target className="h-4 w-4" />} label="Total Goals" value={stats.total} accent />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Active" value={stats.active} />
        <KPI icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} />
        <KPI icon={<Layers className="h-4 w-4" />} label="Completion" value={`${stats.rate}%`} />
        <KPI icon={<Flag className="h-4 w-4" />} label="Upcoming" value={upcoming.length} />
        <KPI icon={<Clock className="h-4 w-4" />} label={`Q${stats.q} Progress`} value={`${stats.qPct}%`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 relative">
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Goals Progress</h2>
          {activeGoals.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center bg-white/[0.01]">
              <p className="text-muted-foreground">No active goals. Define your first vision.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeGoals.map((g: any, i: number) => <GoalCard key={g.id} goal={g} index={i} />)}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <AICoach insights={summaryInsights} title="AI Coach Summary" />

          <section className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
            <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-sky-400" /> Upcoming Milestones
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No upcoming milestones.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(({ m, goal }: any) => {
                  const areaKey = (goal.lifeArea || goal.area?.name || "career").toLowerCase();
                  const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
                  const overdue = m.dueAt && m.dueAt < Date.now();
                  return (
                    <li key={m.id}>
                      <Link to="/goals/$id" params={{ id: goal.id.toString() }} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 hover:border-white/10 transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{area.emoji}</span>
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-white">{m.title || m.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{goal.title || goal.name}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] shrink-0 ${overdue ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
                          {m.dueAt ? new Date(m.dueAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" }) : "-"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 relative">
        <section className="lg:col-span-2 border border-white/5 bg-white/[0.01] rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Goals by Life Area</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byArea.length === 0 ? (
              <p className="text-xs text-muted-foreground">No goals yet.</p>
            ) : byArea.map(([areaName, count]) => {
              const meta = LIFE_AREA_META_LOCAL[areaName] || LIFE_AREA_META_LOCAL["career"];
              const avg = Math.round(liveGoals.filter((g: any) => (g.lifeArea || g.area?.name || "career").toLowerCase() === areaName).reduce((a: number, g: any) => a + g.livePct, 0) / count); 
              return (
                <div key={areaName} className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{count} target</span>
                  </div>
                  <div className="mt-2 font-semibold text-white">{meta.label}</div>
                  <div className="mt-3 h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${avg}%` }} className="h-full rounded-full" style={{ background: meta.color }} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">{avg}% avg progress</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Recently Updated</h3>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((g: any) => {
                const areaKey = (g.lifeArea || g.area?.name || "career").toLowerCase();
                const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
                return (
                  <li key={g.id}>
                    <Link to="/goals/$id" params={{ id: g.id.toString() }} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 hover:border-white/10 transition">
                      <span>{area.emoji}</span>
                      <span className="flex-1 font-semibold truncate text-white">{g.title || g.name}</span>
                      <span className="text-xs font-bold" style={{ color: area.color }}>{g.livePct}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <motion.div className={`border border-white/5 bg-white/[0.02] rounded-2xl p-4 relative overflow-hidden ${accent ? "border-sky-500/30 neon-ring" : ""}`}>
      <div className="relative flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`relative mt-2 text-xl font-bold ${accent ? "text-sky-400" : "text-white"}`}>{value}</div>
    </motion.div>
  );
}

function BrowseList(props: any) {
  return <List {...props} />;
}