/* eslint-disable prettier/prettier */
import { motion } from "framer-motion";
import { Check, Flame, MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { type Habit, useStore, todayKey } from "@/lib/store";

const COLOR_VAR: Record<string, string> = {
  cyan: "oklch(0.78 0.18 200)",
  violet: "oklch(0.72 0.18 295)",
  emerald: "oklch(0.74 0.16 160)",
  amber: "oklch(0.82 0.15 80)",
  rose: "oklch(0.72 0.2 18)",
  sky: "oklch(0.78 0.16 235)",
};

type Props = {
  habit: Habit;
  onEdit: (h: Habit) => void;
};

export function HabitCard({ habit, onEdit }: Props) {
  const { habitLogs, toggleHabit, archiveHabit, removeHabit } = useStore();
  const [menu, setMenu] = useState(false);
  const today = todayKey();

  const done = useMemo(() => {
    return habitLogs.some((l) => Number(l.habitId) === Number(habit.id) && l.date === today);
  }, [habitLogs, habit.id, today]);

  const streak = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const exists = habitLogs.some((l) => Number(l.habitId) === Number(habit.id) && l.date === key);
      if (exists) total++;
      else if (i !== 0) break;
    }
    return total;
  }, [habitLogs, habit.id]);

  const accent = COLOR_VAR[habit.color] ?? COLOR_VAR.cyan;

  // Racikan Shadow Multi-Layer untuk menciptakan kedalaman pendaran Aura Neon yang sesungguhnya 🔮
  const getAuraStyle = (isDone: boolean, isHovered: boolean) => {
    if (isDone) {
      // Kondisi SUDAH DICENTANG: Kunci aura solid membara luar dalam
      return {
        borderColor: `color-mix(in oklab, ${accent} 70%, transparent)`,
        boxShadow: `
          0 0 1px 1px color-mix(in oklab, ${accent} 40%, transparent),
          0 0 20px 2px color-mix(in oklab, ${accent} 30%, transparent),
          0 0 45px 8px color-mix(in oklab, ${accent} 15%, transparent),
          inset 0 0 16px -4px color-mix(in oklab, ${accent} 15%, transparent)
        `
      };
    }
    
    if (isHovered) {
      // Kondisi BELUM DICENTANG + DI-HOVER: Ledakan aura maksimal pas dideketin kursor! 🔥
      return {
        borderColor: `color-mix(in oklab, ${accent} 65%, transparent)`,
        boxShadow: `
          0 0 1px 1px color-mix(in oklab, ${accent} 30%, transparent),
          0 0 25px 3px color-mix(in oklab, ${accent} 25%, transparent),
          0 0 50px 10px color-mix(in oklab, ${accent} 12%, transparent)
        `
      };
    }

    // Kondisi DEFAULT (Idle/Normal): Tetep memancarkan biasan aura halus dari balik kegelapan card
    return {
      borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
      boxShadow: `
        0 4px 20px -2px color-mix(in oklab, ${accent} 6%, transparent),
        0 0 20px 1px color-mix(in oklab, ${accent} 10%, transparent)
      `
    };
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-visible rounded-2xl border p-4 glass group transition-all duration-300"
      style={{
        zIndex: menu ? 999 : 1,
        ...getAuraStyle(done, false)
      }}
      // Handle manipulasi style via JS native state biar super smooth & instan tanpa flicker delay CSS
      onMouseEnter={(e) => {
        const styles = getAuraStyle(done, true);
        e.currentTarget.style.borderColor = styles.borderColor;
        e.currentTarget.style.boxShadow = styles.boxShadow;
      }}
      onMouseLeave={(e) => {
        setMenu(false);
        const styles = getAuraStyle(done, false);
        e.currentTarget.style.borderColor = styles.borderColor;
        e.currentTarget.style.boxShadow = styles.boxShadow;
      }}
    >
      {/* SINKRONISASI CAHAYA BACKGROUND SISI DALAM CARD */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" 
        style={{
          background: `radial-gradient(circle at top right, color-mix(in oklab, ${accent} 12%, transparent), transparent 45%)`
        }}
      />
      
      <div className="relative z-10 flex items-start gap-3">
        {/* CHECK BUTTON */}
        <button
          onClick={() => toggleHabit(Number(habit.id))}
          aria-pressed={done}
          className="relative h-11 w-11 shrink-0 rounded-xl border grid place-items-center transition-all duration-300"
          style={{
            background: done ? `color-mix(in oklab, ${accent} 25%, transparent)` : "var(--secondary)",
            borderColor: done ? accent : "var(--border)",
            boxShadow: done ? `0 0 25px color-mix(in oklab, ${accent} 50%, transparent)` : undefined,
          }}
        >
          <motion.div
            initial={false}
            animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Check className="h-5 w-5" style={{ color: accent }} />
          </motion.div>
          {/* ========================================== */}
      {/* SMART TOOLTIP DESKRIPSI MISI (NONGOL PAS HOVER) */}
      {/* ========================================== */}
      {habit.description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="bg-popover text-popover-foreground border border-border text-xs rounded-xl p-2.5 shadow-2xl max-w-xs whitespace-normal break-words text-center min-w-[150px] glass-strong">
            <div className="font-semibold text-foreground mb-0.5 flex items-center justify-center gap-1">
              {habit.description}
            </div>
          </div>
          {/* Segitiga Lancip Bawah */}
          <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 mx-auto -mt-1" />
        </div>
      )}
          {!done && <span className="absolute inset-0 flex items-center justify-center text-2xl leading-none">{habit.emoji}</span>}
        </button>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-medium">{habit.title}</span>
            {streak > 1 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                <Flame className="h-3 w-3" style={{ color: accent }} />
                {streak}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="capitalize">{habit.frequency}</span>
            <span>·</span>
            <span>+{habit.xp_per_completion} XP</span>
            
            {/* Inject Informasi Jam Aktif Pengingat jika data tersedia */}
            {habit.reminder_time && (
              <>
                <span>·</span>
                <span className="inline-flex items-center text-[11px] bg-secondary/60 px-1.5 py-0.5 rounded text-muted-foreground">
                  🔔 {habit.reminder_time.substring(0, 5)}
                </span>
              </>
            )}

            {/* Inject Informasi Batas Waktu pengerjaan jika data tersedia */}
            {habit.due_time && (
              <>
                <span>·</span>
                <span className="inline-flex items-center text-[11px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded text-red-400">
                  🚨 Max {habit.due_time.substring(0, 5)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* DROP MENU OPTIONS */}
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {menu && (
            <div className="absolute right-0 top-9 z-[9999] w-40 rounded-lg p-1 text-sm glass-strong shadow-xl">
              <button
                onClick={() => { setMenu(false); onEdit(habit); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button> 
              <button
                onClick={() => { setMenu(false); archiveHabit(Number(habit.id)); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <Archive className="h-3.5 w-3.5" /> {habit.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                onClick={() => { setMenu(false); removeHabit(Number(habit.id)); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}