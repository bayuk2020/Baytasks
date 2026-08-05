/* eslint-disable prettier/prettier */
import { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Brain, Coffee, Timer } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  usePomodoro,
  usePomodoroTimer,
  formatClock,
  MODE_LABEL,
  type PomodoroMode,
} from "@/lib/pomodoroStore";

const MODES: { id: PomodoroMode; short: string; icon: typeof Brain }[] = [
  { id: "focus", short: "Focus", icon: Brain },
  { id: "short", short: "Short", icon: Coffee },
  { id: "long", short: "Long", icon: Coffee },
];

/**
 * Kontrol Pomodoro yang nempel di Topbar, jadi timer bisa diatur dari
 * halaman mana pun tanpa balik ke /pomodoro.
 */
export function PomodoroWidget() {
  const mode = usePomodoro((s) => s.mode);
  const primaryAction = usePomodoro((s) => s.primaryAction);
  const reset = usePomodoro((s) => s.reset);
  const switchMode = usePomodoro((s) => s.switchMode);
  const markAlerted = usePomodoro((s) => s.markAlerted);
  const alerted = usePomodoro((s) => s.alertedThisSegment);

  const { running, remaining, overtime, progress } = usePomodoroTimer();
  const addNotification = useStore((s) => s.addNotification);

  // Bunyi + notifikasi SEKALI saat menyentuh 00:00. Timer sengaja tidak
  // dihentikan supaya durasi sebenarnya (yang mungkin molor) tetap terekam.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!running || !overtime || alerted) return;

    markAlerted();

    audioRef.current ??= new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2310/2310-preview.mp3",
    );
    void audioRef.current.play().catch(() => {
      /* autoplay bisa diblokir browser -- tidak fatal */
    });

    const label = MODE_LABEL[mode];
    toast.success(`${label} selesai!`, {
      description: "Timer lanjut menghitung kelebihan waktunya.",
    });
    addNotification({
      id: `pomodoro-${mode}-${Date.now()}`,
      type: "pomodoro_done",
      title: `${label} selesai`,
      message: `Sesi ${label} sudah mencapai target waktunya.`,
    });
  }, [running, overtime, alerted, mode, markAlerted, addNotification]);

  const isBreak = mode !== "focus";

  // Warna mengikuti mode supaya sekilas lihat langsung tahu lagi fokus atau rehat.
  const accent = isBreak
    ? { text: "text-amber-300", ring: "border-amber-400/30", bg: "bg-amber-500/10" }
    : { text: "text-cyan-300", ring: "border-cyan-400/30", bg: "bg-cyan-500/10" };

  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 h-9 pl-2 pr-1.5 rounded-lg border bg-secondary/30 backdrop-blur-sm ${
        running ? accent.ring : "border-border"
      }`}
    >
      {/* MODE SWITCHER */}
      <div className="flex items-center gap-0.5">
        {MODES.map(({ id, short, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            title={MODE_LABEL[id]}
            aria-label={MODE_LABEL[id]}
            aria-pressed={mode === id}
            className={`h-6 px-1.5 rounded-md text-[10px] font-medium inline-flex items-center gap-1 transition ${
              mode === id
                ? `${accent.bg} ${accent.text}`
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden lg:inline">{short}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* WAKTU */}
      <div className="relative flex items-center">
        <Timer className={`h-3.5 w-3.5 mr-1 ${running ? accent.text : "text-muted-foreground"}`} />
        <span
          className={`text-sm font-mono font-semibold tracking-wider tabular-nums ${
            overtime ? "text-rose-400" : running ? accent.text : "text-muted-foreground"
          }`}
        >
          {overtime ? "+" : ""}
          {formatClock(remaining)}
        </span>
      </div>

      {/* PROGRESS TIPIS */}
      <div className="hidden md:block w-10 h-1 rounded-full bg-border/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            isBreak ? "bg-amber-400" : "bg-cyan-400"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* KONTROL */}
      <button
        onClick={primaryAction}
        title={
          !running
            ? "Mulai"
            : mode === "focus"
              ? "Jeda (mulai hitung Short Break)"
              : "Selesai istirahat, lanjut Focus"
        }
        aria-label={!running ? "Mulai pomodoro" : "Jeda pomodoro"}
        className={`h-6 w-6 grid place-items-center rounded-md transition ${accent.bg} ${accent.text} hover:brightness-125`}
      >
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      <button
        onClick={reset}
        title="Reset (sesi berjalan tetap dicatat)"
        aria-label="Reset pomodoro"
        className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
