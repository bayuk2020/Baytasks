/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysRemaining, formatValue } from "@/lib/goals/goals";

export const Route = createFileRoute("/goals/list")({
  head: () => ({
    meta: [
      { title: "All Goals — BayTasks" },
      { name: "description", content: "Browse, filter and search every goal across all life areas." },
    ],
  }),
  component: GoalsList,
});

type Filter = "all" | "active" | "completed" | "overdue";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },
  career: { label: "Career", emoji: "🚀", color: "#6366f1" },
  health: { label: "Health", emoji: "💪", color: "#ef4444" },
  relationship: { label: "Relationship", emoji: "❤️", color: "#ec4899" },
  learning: { label: "Learning", emoji: "📚", color: "#eab308" },
  spiritual: { label: "Spiritual", emoji: "🧘", color: "#a855f7" },
  business: { label: "Business", emoji: "📈", color: "#3b82f6" },
};

function GoalsList() {
  // Ambil state gabungan langsung dari store pusat
  const goals = useStore((s: any) => s.goals || []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return goals
      .filter((g: any) => {
        const isCompleted = g.status === "completed" || (g.progress_percent !== undefined && g.progress_percent >= 100);
        
        if (filter === "all") return true;
        if (filter === "active") return !isCompleted;
        if (filter === "completed") return isCompleted;
        if (filter === "overdue") {
          const tDate = g.targetDate || g.due_date ? new Date(g.targetDate || g.due_date).getTime() : null;
          return !isCompleted && tDate && tDate < Date.now();
        }
        return true;
      })
      .filter((g: any) => {
        const titleText = g.title || g.name || "";
        const descText = g.description || "";
        return !term || titleText.toLowerCase().includes(term) || descText.toLowerCase().includes(term);
      });
  }, [goals, q, filter]);

  return (
    <div className="space-y-6 relative text-white text-xs">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="flex items-center justify-between relative gap-3 border-b border-white/5 pb-4">
        <Link to="/goals" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition font-semibold">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <Link to="/goals/create" className="px-4 py-1.5 rounded-lg bg-indigo-600 font-semibold shadow-md transition text-white border-0 cursor-pointer">
          <Plus className="h-4 w-4 inline mr-1" /> New Goal
        </Link>
      </div>

      <header className="relative">
        <p className="text-xs text-muted-foreground">All goals</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Your Goal Library</h1>
      </header>

      <div className="flex items-center gap-3 flex-wrap relative">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search goals…"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border cursor-pointer bg-transparent ${
                filter === f.id ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" : "border-white/10 text-muted-foreground hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden relative">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground border-b border-white/5 bg-white/5">
          <span>Goal</span><span>Life area</span><span>Progress</span><span>Status</span><span>Target date</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-xs text-muted-foreground">No goals match your filters.</div>
        ) : (
          filtered.map((g: any, i: number) => {
            const areaKey = (g.lifeArea || g.area?.name || "career").toLowerCase();
            const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
            const dRem = daysRemaining(g);
            const isCompleted = g.status === "completed" || g.progress_percent >= 100;
            const currentAmount = g.currentValue !== undefined ? g.currentValue : (g.current_amount || 0);
            const targetAmount = g.targetValue !== undefined ? g.targetValue : (g.target_amount || 100);
            
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to="/goals/$id" params={{ id: g.id.toString() }}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.4fr_1fr_1fr] gap-3 px-4 py-3.5 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-white">{g.title || g.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{currentAmount} / {targetAmount}</div>
                  </div>
                  <div className="text-xs text-white/80 flex items-center gap-1.5"><span>{area.emoji}</span>{area.label}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${g.progress_percent}%`, background: area.color }} />
                    </div>
                    <span className="text-xs font-bold w-9 text-right" style={{ color: area.color }}>{g.progress_percent}%</span>
                  </div>
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                      {isCompleted ? "Completed" : "Active"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {g.targetDate || g.due_date ? new Date(g.targetDate || g.due_date).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    {dRem !== null && dRem < 0 && !isCompleted && <span className="text-red-400 font-medium"> · overdue</span>}
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}