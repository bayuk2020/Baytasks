/* eslint-disable prettier/prettier */
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Minus } from "lucide-react";
import type { CoachInsight } from "@/lib/goals/goals";

const TONE = {
  positive: { color: "#10b981", icon: TrendingUp },
  warning: { color: "#ef4444", icon: AlertTriangle },
  neutral: { color: "#38bdf8", icon: Minus },
} as const;

export function AICoach({
  insights,
  title = "AI Goal Coach",
  compact = false,
}: {
  insights: CoachInsight[];
  title?: string;
  compact?: boolean;
}) {
  return (
    <div className="border border-border bg-card rounded-2xl p-5 relative overflow-hidden text-xs text-foreground">
      <div className="pointer-events-none absolute -top-14 -right-10 h-40 w-40 rounded-full bg-[var(--neon-soft)] blur-3xl" />

      <div className="relative flex items-center gap-2">
        {/* Kotak ikon berlatar biru pekat: ikonnya tetap PUTIH di kedua tema.
            text-foreground tidak bisa dipakai di sini karena di tema terang
            nilainya gelap, dan ikonnya akan hilang di atas biru. */}
        <div className="h-7 w-7 rounded-lg grid place-items-center bg-[var(--neon)] shadow-md neon-ring">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground">
            {title === "AI Goal Coach" ? (
              <>AI Goal <span className="neon-text">Coach</span></>
            ) : (
              title
            )}
          </div>
          {!compact && <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Live insights</div>}
        </div>
      </div>

      <div className="relative mt-4 space-y-2.5">
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add progress and milestones to unlock coaching insights.</p>
        ) : (
          insights.map((ins, i) => {
            const t = TONE[ins.tone] || TONE.neutral;
            const Icon = t.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
              >
                <span
                  className="mt-0.5 h-5 w-5 shrink-0 grid place-items-center rounded-md"
                  style={{ color: t.color, background: `${t.color}15` }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs leading-relaxed text-foreground/80">{ins.text}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}