/* eslint-disable prettier/prettier */
import { Search, Sun, Moon, Command, Clock, Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { NotificationBell } from "./NotificationCenter";
import { useState, useEffect } from "react";

export function Topbar({ onSearch, search, onOpenPalette }: {
  onSearch?: (q: string) => void;
  search?: string;
  onOpenPalette?: () => void;
}) {
  const { theme, toggleTheme } = useStore();

  // =========================================================
  // STATE JAM REAL-TIME LAPTOP
  // =========================================================
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const formattedDate = time.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  // =========================================================
  // STREAK CALCULATION (INJECTED FROM ZUSTAND)
  // =========================================================
  const completedDays = Array.from(
    new Set(
      useStore
        .getState()
        .tasks.filter((t) => t.completedAt)
        .map((t) => {
          const d = new Date(t.completedAt!);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
    ),
  ).sort((a, b) => b - a);

  let streakCount = 0;
  for (let i = 0; i < completedDays.length; i++) {
    if (i === 0) {
      streakCount++;
      continue;
    }
    const diff = completedDays[i - 1] - completedDays[i];
    if (diff === 86400000) {
      streakCount++;
    } else {
      break;
    }
  }

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border">
      <div className="flex items-center gap-3 px-5 py-3">
        {/* INPUT SEARCH */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search tasks, tags, boards…"
            className="w-full rounded-lg bg-secondary/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* QUICK PALETTE BUTTON */}
        <button
          onClick={onOpenPalette}
          className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition text-xs text-muted-foreground"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Quick find</span>
          <kbd className="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </button>

        {/* =========================================================
            STREAK DURATION BOX (ORANGE NEON LOOK)
            ========================================================= */}
        <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-secondary/30 backdrop-blur-sm">
          <Flame className="h-4 w-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)] animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-orange-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.2)]">
              {streakCount}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium lowercase">
              days streak
            </span>
          </div>
        </div>

        {/* =========================================================
            JAM DIGITAL REAL-TIME TOPBAR (OS STYLE)
            ========================================================= */}
        <div className="hidden md:flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border bg-secondary/30 backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-mono font-semibold tracking-wider text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.25)]">
              {formattedTime}
            </span>
            <span className="text-[10px] text-muted-foreground border-l border-border pl-1.5 font-medium">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* TOGGLE THEME BUTTON */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* NOTIFICATION BELL */}
        <NotificationBell />
      </div>
    </header>
  );
}