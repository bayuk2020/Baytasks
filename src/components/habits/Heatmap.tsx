/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { useStore, todayKey } from "@/lib/store";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "year";

// Mapping warna OKLCH asli biar sinergi sama HabitCard lu, su! 🎨
const COLOR_VAR: Record<string, string> = {
  cyan: "oklch(0.78 0.18 200)",
  violet: "oklch(0.72 0.18 295)",
  emerald: "oklch(0.74 0.16 160)",
  amber: "oklch(0.82 0.15 80)",
  rose: "oklch(0.72 0.2 18)",
  sky: "oklch(0.78 0.16 235)",
};

export function Heatmap() {
  const { habits, habitLogs } = useStore();
  
  const [currentFocus, setCurrentFocus] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const handlePrev = () => {
    setCurrentFocus((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") d.setMonth(d.getMonth() - 1);
      else d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentFocus((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") d.setMonth(d.getMonth() + 1);
      else d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentFocus(new Date());
  };

  const dateRange = useMemo(() => {
    const arr: { date: string; label: string; dayName: string }[] = [];
    const year = currentFocus.getFullYear();
    const month = currentFocus.getMonth();

    let startDate: Date;
    let endDate: Date;

    if (viewMode === "month") {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const dKey = todayKey(tempDate);
      const labelStr = tempDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      const dayNameStr = tempDate.toLocaleDateString("id-ID", { weekday: "short" });

      arr.push({
        date: dKey,
        label: labelStr,
        dayName: dayNameStr
      });
      
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return arr;
  }, [currentFocus, viewMode]);

  const currentPeriodLabel = useMemo(() => {
    if (viewMode === "month") {
      return currentFocus.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    }
    return `Tahun ${currentFocus.getFullYear()}`;
  }, [currentFocus, viewMode]);

  // 🔑 LOGIC FIX ANTI BOLONG KOTAK HARI INI
  const getDotStyle = (isDone: boolean, isToday: boolean, habitColorName: string) => {
    const accentColor = COLOR_VAR[habitColorName] ?? COLOR_VAR.cyan;

if (isDone) {
      // Kondisi SUKSES: Baru boleh menyala solid warna kustom! 🔥
      return {
        background: accentColor,
        borderColor: `color-mix(in oklab, ${accentColor} 50%, transparent)`,
        boxShadow: `0 0 10px 1px color-mix(in oklab, ${accentColor} 50%, transparent)`
      };
    }

if (isToday) {
      // Kondisi HARI INI BELUM DICENTANG: Warnanya sama abu-abu kayak kotak lain,
      // tapi bordernya putih agak terang dikit (border-white/20) biar penandanya tetep kelihatan rapi!
      return {
        background: "color-mix(in oklab, var(--foreground) 6%, transparent)",
      };
    }

    // Kondisi kosong/bolong hari-hari biasa: Abu-abu redup bawaan glassmorphism lu
return {
      background: "color-mix(in oklab, var(--foreground) 6%, transparent)",
      borderColor: "color-mix(in oklab, var(--foreground) 3%, transparent)"
    };
  };

  return (
    <div className="glass rounded-2xl mt-5 p-5 relative z-0">
      
      {/* HEADER CONTROL & NAVIGATION HUB */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-border/40 pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Consistency Tracker
          </div>
          <div className="text-base font-medium mt-0.5 flex items-center gap-2">
            <span>Matrix Misi Aktif:</span>
            <span className="neon-text font-semibold capitalize">{currentPeriodLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40 text-xs">
            <button
              onClick={() => { setViewMode("month"); handleToday(); }}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                viewMode === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => { setViewMode("year"); handleToday(); }}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                viewMode === "year" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tahun
            </button>
          </div>

          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all"
              title={viewMode === "month" ? "Bulan Sebelumnya" : "Tahun Sebelumnya"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-medium hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all"
              title={viewMode === "month" ? "Bulan Berikutnya" : "Tahun Berikutnya"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX CONTAINER */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Belum ada habit aktif untuk dilacak konsistensinya.
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto pb-2">
          {activeHabits.map((h) => {
            const completedInGrid = dateRange.filter((d) =>
              habitLogs.some((l) => Number(l.habitId) === Number(h.id) && l.date === d.date)
            ).length;

            const ratePct = dateRange.length > 0 ? Math.round((completedInGrid / dateRange.length) * 100) : 0;

            return (
              <div key={h.id} className="flex items-center gap-4 min-w-[600px] group/row py-1">
                {/* IDENTITAS HABIT */}
                <div className="w-48 shrink-0 flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{h.emoji}</span>
                    <span className="text-sm font-medium truncate text-foreground/90">
                      {h.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 bg-secondary/30 px-1.5 py-0.5 rounded tabular-nums ml-2">
                    {ratePct}%
                  </span>
                </div>

                {/* TRACKING DOTS MENDATAR */}
                <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                  {dateRange.map((d) => {
                    const isDone = habitLogs.some(
                      (l) => Number(l.habitId) === Number(h.id) && l.date === d.date
                    );
                    const isToday = d.date === todayKey();

                    return (
                      <div key={d.date} className="relative group/dot">
                        <div
                          className="h-3.5 w-3.5 rounded-[3px] border transition-all duration-200 cursor-help hover:scale-125"
                          style={getDotStyle(isDone, isToday, h.color)}
                        />

                        {/* SMART TOOLTIP NATIVE */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150">
                          <div className="bg-popover text-popover-foreground border border-border text-[11px] rounded-lg p-2 shadow-xl whitespace-nowrap space-y-0.5 text-center glass-strong">
                            <div className="font-semibold text-foreground">
                              {d.dayName}, {d.label} {isToday && <span className="text-cyan-400 font-normal text-[10px] ml-1">(Hari Ini)</span>}
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <span>{h.emoji}</span>
                              <span className={isDone ? "text-emerald-400 font-medium" : "text-muted-foreground"}>
                                {isDone ? "✅ Misi Selesai" : "❌ Belum Dicentang"}
                              </span>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 mx-auto -mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER KETERANGAN BAWAH */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Rentang data yang tampil: {dateRange.length} hari</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-white/5 border border-white/10" />
            <span>Belum lewat</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/10 border border-cyan-500/50" />
            <span>Target hari ini</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span>Misi Sukses</span>
          </div>
        </div>
      </div>

    </div>
  );
}