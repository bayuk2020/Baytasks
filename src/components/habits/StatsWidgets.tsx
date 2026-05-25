import { motion } from "framer-motion";
import { Flame, Trophy, Zap, Target, CalendarCheck } from "lucide-react";
import { useStore, todayKey, xpToLevel } from "@/lib/store";
import { useMemo } from "react";

export function StatsWidgets() {
  const { habits, habitLogs, xp } = useStore();
  const today = todayKey();

  const stats = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    const todays = habitLogs.filter((l) => l.date === today);
    const todayXp = todays.reduce((acc, l) => {
      const h = habits.find((x) => x.id === l.habitId);
      return acc + (h?.xp_per_completion ?? 0);
    }, 0);
    const completionRate = active.length ? Math.round((todays.length / active.length) * 100) : 0;

    // current streak: consecutive days where >0 habits done
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      const has = habitLogs.some((l) => l.date === k);
      if (has) streak++;
      else if (i === 0) continue;
      else break;
    }

    // longest streak in last year
    let longest = 0,
      run = 0;
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      if (habitLogs.some((l) => l.date === k)) {
        run++;
        longest = Math.max(longest, run);
      } else run = 0;
    }

    // weekly consistency: last 7 days completion ratio
    let weeklyDone = 0,
      weeklyTotal = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      weeklyTotal += active.length;
      weeklyDone += habitLogs.filter(
        (l) => l.date === k && active.find((h) => h.id === l.habitId),
      ).length;
    }
    const weekly = weeklyTotal ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;

    return { todayXp, completionRate, streak, longest, weekly };
  }, [habits, habitLogs, today]);

  const { level } = xpToLevel(xp);

  const widgets = [
    { label: "Today XP", value: `+${stats.todayXp}`, icon: Zap, accent: "oklch(0.82 0.15 80)" },
    { label: "Level", value: `Lv ${level}`, icon: Trophy, accent: "oklch(0.78 0.16 235)" },
    { label: "Streak", value: `${stats.streak}d`, icon: Flame, accent: "oklch(0.72 0.2 18)" },
    {
      label: "Today",
      value: `${stats.completionRate}%`,
      icon: Target,
      accent: "oklch(0.74 0.16 160)",
    },
    {
      label: "This week",
      value: `${stats.weekly}%`,
      icon: CalendarCheck,
      accent: "oklch(0.72 0.18 295)",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {widgets.map((w, i) => (
        <motion.div
          key={w.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glass hover-lift rounded-xl p-4 relative overflow-hidden"
        >
          <div
            className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-30 blur-2xl"
            style={{ background: w.accent }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {w.label}
            </span>
            <w.icon className="h-4 w-4" style={{ color: w.accent }} />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{w.value}</div>
        </motion.div>
      ))}
    </div>
  );
}
