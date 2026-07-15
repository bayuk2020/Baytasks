/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
// 🌟 FIX UTAMA: Impor fungsi hitung agregat dinamis
import { daysRemaining, computeGoalProgress } from "@/lib/goals/goals";

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },      
  career: { label: "Career", emoji: "🚀", color: "#0ea5e9" },       
  health: { label: "Health", emoji: "💪", color: "#ef4444" },       
  relationship: { label: "Relationship", emoji: "❤️", color: "#ec4899" }, 
  learning: { label: "Learning", emoji: "📚", color: "#eab308" },   
  spiritual: { label: "Spiritual", emoji: "🧘", color: "#a855f7" },  
  business: { label: "Business", emoji: "📈", color: "#3b82f6" },   
};

export function GoalCard({ goal, index = 0 }: { goal: any; index?: number }) {
  const milestones = useStore((s: any) => s.milestones || []);
  const tasks = useStore((s: any) => s.tasks || []);
  const habitLogs = useStore((s: any) => s.habitLogs || []);
  const habits = useStore((s: any) => s.habits || []);

  // 1. Siapkan full konteks data reaktif dari store browser kamu
  const ctx = { 
    tasks, 
    habitLogs, 
    milestones, 
    habits 
  };

  // 2. 🌟 FIX PROGRESS: Paksa hitung live gabungan data, jangan pakai data statis MySQL
  const calculatedProgress = computeGoalProgress(goal, ctx);
  
  const pct = calculatedProgress.pct;
  const current = calculatedProgress.current;
  const target = calculatedProgress.target;

  const areaKey = (goal.lifeArea || goal.area?.name || "career").toLowerCase();
  const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
  const dRem = daysRemaining(goal);
  
  const ms = milestones.filter((m: any) => m.goal_id?.toString() === goal.id?.toString() || m.goalId?.toString() === goal.id?.toString());
  const msDone = ms.filter((m: any) => m.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
    >
      <Link
        to="/goals/$id"
        params={{ id: goal.id.toString() }}
        className="group block border border-white/5 bg-white/[0.01] rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition text-xs text-white"
      >
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-20"
          style={{ background: area.color }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none">{area.emoji}</span>
            <div className="min-w-0">
              <div className="font-bold truncate text-white">{goal.title || goal.name}</div>
              <div className="text-[10px] text-muted-foreground">{area.label}</div>
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${goal.completed || pct === 100 ? "bg-emerald-500/10 text-emerald-400" : "border border-sky-500/30 bg-sky-950/20 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.1)]"}`}>
            {goal.completed || pct === 100 ? "Completed" : "Active"}
          </span>
        </div>

        <div className="relative mt-4">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground mb-1.5">
            {/* Tampilkan sisa item gabungan yang riil */}
            <span>{current} <span className="opacity-60">/ {target}</span></span>
            <span className="font-bold" style={{ color: area.color }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: area.color }}
            />
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5 text-sky-400" /> {msDone}/{ms.length} milestones
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-white/70">
            {dRem === null ? "No deadline" : dRem < 0 ? `${Math.abs(dRem)}d overdue` : `${dRem}d left`}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-white" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}