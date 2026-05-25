import { motion } from "framer-motion";
import { useStore, xpToLevel, rankFor } from "@/lib/store";

export function XPBar() {
  const xp = useStore((s) => s.xp);
  const { level, into, span } = xpToLevel(xp);
  const pct = Math.min(100, Math.round((into / span) * 100));
  const rank = rankFor(level);

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Rank</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-3xl font-semibold neon-text tabular-nums">Lv {level}</span>
            <span className="text-sm text-muted-foreground">— {rank}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Total XP
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{xp.toLocaleString()}</div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="h-3 rounded-full bg-secondary overflow-hidden border border-border">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className="h-full rounded-full"
            style={{
              background: "var(--gradient-neon)",
              boxShadow: "0 0 24px color-mix(in oklab, var(--neon) 55%, transparent)",
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            {into} / {span} XP
          </span>
          <span>Next: Lv {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
