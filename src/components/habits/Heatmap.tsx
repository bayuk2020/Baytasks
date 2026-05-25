import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useStore, todayKey } from "@/lib/store";

const DAYS = 91; // ~13 weeks

export function Heatmap() {
  const { habits, habitLogs } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);
  const dayCount = activeHabits.length || 1;

  const cells = useMemo(() => {
    const arr: { date: string; count: number; ratio: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = todayKey(d);
      const count = habitLogs.filter((l) => l.date === date).length;
      arr.push({ date, count, ratio: Math.min(1, count / dayCount) });
    }
    return arr;
  }, [habitLogs, dayCount]);

  // pad to start week (Mon = 1). simpler: 13 cols × 7 rows column-major
  const cols: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));

  const intensity = (r: number) => {
    if (r === 0) return "color-mix(in oklab, var(--foreground) 6%, transparent)";
    const pct = 20 + r * 70;
    return `color-mix(in oklab, var(--neon) ${pct}%, transparent)`;
  };

  const detail = selected ? cells.find((c) => c.date === selected) : null;
  const detailLogs = selected ? habitLogs.filter((l) => l.date === selected) : [];

  return (
    <div className="glass rounded-2xl mt-5 p-5 relative -z-0">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Consistency
          </div>
          <div className="text-base font-medium mt-0.5">Last 90 days</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-sm" style={{ background: intensity(r) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((c) => (
              <button
                key={c.date}
                onClick={() => setSelected(c.date)}
                title={`${c.date} — ${c.count} completion${c.count === 1 ? "" : "s"}`}
                className="h-3.5 w-3.5 rounded-sm transition hover:ring-1 hover:ring-[var(--neon)]"
                style={{ background: intensity(c.ratio) }}
              />
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-strong rounded-2xl p-6 relative"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 h-8 w-8 grid place-items-center rounded-md hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Daily detail
              </div>
              <h3 className="text-lg font-semibold tracking-tight mt-1">
                {new Date(detail.date).toDateString()}
              </h3>
              <div className="mt-1 text-sm text-muted-foreground">
                {detail.count} of {dayCount} habits completed
              </div>
              <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {activeHabits.map((h) => {
                  const done = detailLogs.some((l) => l.habitId === h.id);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/60"
                    >
                      <span className="text-base">{h.emoji}</span>
                      <span className="flex-1 text-sm truncate">{h.title}</span>
                      <span className={`text-xs ${done ? "neon-text" : "text-muted-foreground"}`}>
                        {done ? "Done" : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
