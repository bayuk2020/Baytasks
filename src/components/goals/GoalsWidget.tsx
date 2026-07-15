/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
// 🌟 FIX IMPORE: Tambah computeGoalProgress untuk kalkulasi dinamis
import { generateInsights, computeGoalProgress } from "@/lib/goals/goals";

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },
  career: { label: "Career", emoji: "🚀", color: "#0ea5e9" }, // Disamakan cyan mencorong sesuai detail
  health: { label: "Health", emoji: "💪", color: "#ef4444" },
  relationship: { label: "Relationship", emoji: "❤️", color: "#ec4899" },
  learning: { label: "Learning", emoji: "📚", color: "#eab308" },
  spiritual: { label: "Spiritual", emoji: "🧘", color: "#a855f7" },
  business: { label: "Business", emoji: "📈", color: "#3b82f6" },
};

export function GoalsWidget() {
  const goals = useStore((s: any) => s.goals || []);
  const tasks = useStore((s: any) => s.tasks || []);
  const habitLogs = useStore((s: any) => s.habitLogs || []);
  const milestones = useStore((s: any) => s.milestones || []);
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const habits = useStore((s: any) => s.habits || []);

  // 1. Siapkan full konteks data reaktif untuk algoritma goals.ts
  const ctx = { tasks, habitLogs, milestones, habits, plans };

  // 2. 🌟 FIX LOGIKA GABUNGAN: Petakan semua goal dan hitung ulang progresnya secara live
  const mappedGoals = goals.map((g: any) => {
    const calculated = computeGoalProgress(g, ctx);
    return {
      ...g,
      // Timpa nilai statis database dengan hasil kalkulasi live harian kamu
      calculatedPct: calculated.pct,
      calculatedCurrent: calculated.current,
      calculatedTarget: calculated.target,
    };
  });

  // 3. Filter target aktif berdasarkan hasil perhitungan live (belum 100%)
  const active = mappedGoals.filter((g: any) => g.status !== "completed" && g.calculatedPct < 100);

  // 4. Urutkan target teratas berdasarkan persentase live terbesar
  const top = [...active]
    .sort((a, b) => b.calculatedPct - a.calculatedPct)
    .slice(0, 3);

  // 5. Ambil target prioritas pertama untuk umpan AI Coach Insight
  const focus = active[0] || null;
  const insight = focus ? generateInsights(focus, ctx)[0] : null;

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 text-white text-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold inline-flex items-center gap-1.5 text-white/90"><Target className="h-4 w-4 text-sky-400" /> Goals Momentum</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{active.length} aktif di ruang hidupmu.</p>
        </div>
        <Link to="/goals" className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1">Open <ArrowRight className="h-3 w-3" /></Link>
      </div>

      {top.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          Belum ada target aktif. <Link to="/goals" className="text-sky-400 hover:underline">Buat baru →</Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {top.map((g) => {
            const areaKey = (g.lifeArea || g.area?.name || "career").toLowerCase();
            const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
            return (
              <li key={g.id}>
                <Link to="/goals/$id" params={{ id: g.id.toString() }} className="block rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 hover:border-white/10 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate inline-flex items-center gap-1.5">
                      <span>{area.emoji}</span>
                      {g.title || g.name}
                    </span>
                    {/* Tampilkan persentase live riil pengerjaan */}
                    <span className="text-xs font-bold shrink-0" style={{ color: area.color }}>{g.calculatedPct}%</span>
                  </div>
                  {/* Animasi progress bar ikut bergeser secara live */}
                  <div className="mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${g.calculatedPct}%` }} 
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full" 
                      style={{ background: area.color }} 
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {insight && focus && (
        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-950/20 px-3 py-2.5 shadow-[0_0_10px_rgba(14,165,233,0.1)]">
          <span className="text-[9px] uppercase font-bold tracking-wider text-sky-400">AI Coach</span>
          <p className="mt-1 text-xs leading-relaxed text-white/80 font-medium">{focus.title || focus.name}: {insight.text}</p>
        </div>
      )}
    </motion.section>
  );
}