/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Sparkles } from "lucide-react";
import { pomodoroApi, type PomodoroSession, type PomodoroStatRow } from "@/lib/api";
import {
  usePomodoro,
  usePomodoroTimer,
  formatClock,
  formatDuration,
  MODE_LABEL,
  type PomodoroMode,
} from "@/lib/pomodoroStore";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [{ title: "Pomodoro — BayTasks" }],
  }),
  component: PomodoroPage,
});

function PomodoroPage() {
  // Semua state timer hidup di store global (src/lib/pomodoroStore.ts),
  // BUKAN di useState komponen ini -- itulah sebabnya hitungan tidak lagi
  // berhenti begitu pindah halaman.
  const mode = usePomodoro((s) => s.mode);
  const durations = usePomodoro((s) => s.durations);
  const setDuration = usePomodoro((s) => s.setDuration);
  const primaryAction = usePomodoro((s) => s.primaryAction);
  const reset = usePomodoro((s) => s.reset);
  const switchMode = usePomodoro((s) => s.switchMode);
  const savedCount = usePomodoro((s) => s.savedCount);

  const { running, remaining, overtime, progress } = usePomodoroTimer();

  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [stats, setStats] = useState<PomodoroStatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([pomodoroApi.sessions(), pomodoroApi.stats(14)]);
      setSessions(s.sessions ?? []);
      setStats(st.rows ?? []);
    } catch (err) {
      console.error("LOAD POMODORO ERROR", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Muat ulang tiap kali sebuah segmen baru tersimpan, biar tabel & riwayat
  // langsung menyusul tanpa perlu refresh manual.
  useEffect(() => {
    void load();
  }, [load, savedCount]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.04] via-background to-blue-500/[0.03] p-6 shadow-[0_0_50px_rgba(34,211,238,0.06)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-100 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Pomodoro
            </h1>
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Timer tetap berjalan walau kamu pindah halaman — kontrolnya juga ada di header.
          </p>
        </div>
      </motion.div>

      {/* MODES */}
      <div className="flex flex-wrap gap-3">
        <ModeButton
          active={mode === "focus"}
          onClick={() => switchMode("focus")}
          icon={<Brain className="h-4 w-4" />}
          label="Focus"
        />
        <ModeButton
          active={mode === "short"}
          onClick={() => switchMode("short")}
          icon={<Coffee className="h-4 w-4" />}
          label="Short Break"
        />
        <ModeButton
          active={mode === "long"}
          onClick={() => switchMode("long")}
          icon={<Coffee className="h-4 w-4" />}
          label="Long Break"
        />
      </div>

      {/* TIMER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden glass rounded-[2rem] border border-cyan-400/10 p-6 sm:p-10 flex flex-col items-center shadow-[0_0_80px_rgba(34,211,238,0.08)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative h-64 w-64 sm:h-72 sm:w-72 rounded-full flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[10px] border-white/5" />
          <motion.div
            animate={{
              background: `conic-gradient(${overtime ? "#f43f5e" : "#06b6d4"} ${progress}%, rgba(255,255,255,0.06) ${progress}%)`,
            }}
            className="absolute inset-0 rounded-full"
          />
          <div className="absolute h-[88%] w-[88%] rounded-full bg-background/90 backdrop-blur-xl border border-white/5 flex flex-col items-center justify-center">
            <div
              className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
                overtime
                  ? "text-rose-400"
                  : "bg-gradient-to-r from-cyan-100 via-cyan-300 to-blue-400 bg-clip-text text-transparent"
              }`}
            >
              {overtime ? "+" : ""}
              {formatClock(remaining)}
            </div>
            <div className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {MODE_LABEL[mode]}
            </div>
            {overtime && (
              <div className="mt-1 text-[10px] text-rose-400/80">melewati target</div>
            )}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={primaryAction}
            className="h-14 px-6 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-100 flex items-center gap-2 hover:bg-cyan-500/25 transition"
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {!running
              ? "Start"
              : mode === "focus"
                ? "Jeda → Short Break"
                : "Selesai → Focus"}
          </button>

          <button
            onClick={reset}
            className="h-14 px-6 rounded-2xl bg-secondary/40 border border-border flex items-center gap-2 hover:border-cyan-400/20 transition"
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
          Menekan jeda saat Focus otomatis mulai menghitung Short Break. Setiap segmen
          tersimpan ke database begitu berpindah.
        </p>
      </motion.div>

      {/* SETTINGS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["focus", "short", "long"] as PomodoroMode[]).map((m) => (
          <SettingCard
            key={m}
            title={MODE_LABEL[m]}
            value={durations[m]}
            onChange={(v: number) => setDuration(m, v)}
          />
        ))}
      </div>

      {/* SESI HARI INI */}
      <section className="glass rounded-2xl p-5">
        <h2 className="font-medium mb-3">Sesi hari ini</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada sesi tercatat hari ini. Tekan Start untuk mulai.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm rounded-lg border border-border bg-secondary/30 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      s.mode === "focus" ? "bg-cyan-400" : "bg-amber-400"
                    }`}
                  />
                  {MODE_LABEL[s.mode]}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatDuration(s.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* REKAP HARIAN */}
      <section className="glass rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="font-medium">Rekap harian</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Score 0–100: 45% volume fokus (target 4 jam), 25% rasio fokus vs istirahat,
            30% rasio task selesai.
          </p>
        </div>

        {/* Tabel dibungkus overflow-x sendiri supaya di HP dia yang scroll,
            bukan seluruh halaman yang melar ke samping. */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-medium">Tanggal</th>
                <th className="py-2 px-3 font-medium text-right">Task masuk</th>
                <th className="py-2 px-3 font-medium text-right">Task selesai</th>
                <th className="py-2 px-3 font-medium text-right">Focus</th>
                <th className="py-2 px-3 font-medium text-right">Short break</th>
                <th className="py-2 px-3 font-medium text-right">Long break</th>
                <th className="py-2 pl-3 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Belum ada data.
                  </td>
                </tr>
              )}
              {stats.map((row) => (
                <tr key={row.date} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(row.date + "T00:00:00").toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{row.tasksAdded}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{row.tasksCompleted}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-cyan-300">
                    {formatDuration(row.focusSeconds)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {formatDuration(row.shortBreakSeconds)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {formatDuration(row.longBreakSeconds)}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <ScoreBadge score={row.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
      : score >= 45
        ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
        : score > 0
          ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
          : "bg-secondary text-muted-foreground border-border";

  return (
    <span
      className={`inline-block min-w-[2.5rem] rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
    >
      {score}
    </span>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition ${
        active
          ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-100"
          : "border-border bg-secondary/30 hover:border-cyan-400/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SettingCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="glass rounded-3xl p-5 border border-border/40">
      <div className="text-sm text-muted-foreground">{title}</div>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 outline-none focus:border-cyan-400/30"
      />
      <div className="mt-2 text-xs text-muted-foreground">Minutes</div>
    </div>
  );
}
