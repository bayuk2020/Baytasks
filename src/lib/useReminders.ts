import { useEffect, useMemo, useRef } from "react";
import { useStore, todayKey } from "./store";
import { toast } from "sonner";

const beep = () => {
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.stop(ctx.currentTime + 0.65);
  } catch { /* noop */ }
};

const offsetMs: Record<string, number> = { "10m": 10 * 60_000, "1h": 60 * 60_000, "1d": 24 * 60 * 60_000 };

/**
 * Mesin reminder Task & Habit sisi web. WAJIB di-mount sekali di root layout
 * (AppShell) supaya jalan di semua halaman -- sebelumnya hook ini ditulis
 * lengkap tapi TIDAK PERNAH dipanggil di mana pun, jadi baik toast maupun
 * notifikasi bell tidak pernah muncul untuk task/habit yang mendekati deadline.
 */
export function useReminders() {
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const markReminded = useStore((s) => s.markReminded);
  const addNotification = useStore((s) => s.addNotification);
  const loadTasks = useStore((s) => s.loadTasks);
  const loadHabits = useStore((s) => s.loadHabits);
  const tickRef = useRef<number | null>(null);

  // Hook ini di-mount sekali secara global (AppShell), jadi jangan andalkan
  // halaman lain sudah memuat tasks/habits duluan -- reminder harus tetap
  // jalan walau user landing pertama kali bukan di Dashboard/Board/Habits.
  useEffect(() => {
    loadTasks();
    loadHabits();
  }, [loadTasks, loadHabits]);

  const active = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter((t) => t.dueAt && t.column !== "done")
      .filter((t) => {
        if (!t.dueAt) return false;
        const window = t.reminder ? offsetMs[t.reminder] : 60 * 60_000;
        return t.dueAt - now <= window;
      })
      .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  }, [tasks]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();

      // =========================
      // TASK: mendekati due / overdue
      // =========================
      for (const t of tasks) {
        if (!t.dueAt || t.reminded || t.column === "done") continue;
        const window = t.reminder ? offsetMs[t.reminder] : 0;
        if (window && t.dueAt - now <= window && t.dueAt - now > -60_000) {
          beep();
          toast(`⏰ ${t.title}`, { description: `Due ${new Date(t.dueAt).toLocaleString()}` });
          addNotification({
            id: `task-due-${t.id}`,
            type: "task_overdue",
            title: `Deadline mendekat: ${t.title}`,
            message: `Jatuh tempo ${new Date(t.dueAt).toLocaleString()}`,
          });
          markReminded(t.id);
        } else if (t.dueAt < now && !t.reminded) {
          toast(`🚨 Overdue: ${t.title}`, { description: "This task is past its deadline" });
          addNotification({
            id: `task-overdue-${t.id}`,
            type: "task_overdue",
            title: `Overdue: ${t.title}`,
            message: "Tugas ini sudah lewat tenggat waktunya.",
          });
          markReminded(t.id);
        }
      }

      // =========================
      // HABIT: belum dikerjakan & sudah lewat batas jam hari ini
      // =========================
      const today = todayKey();
      const nowTime = new Date();
      const nowMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();

      for (const h of habits) {
        if (h.archived) continue;

        const doneToday = h.logs?.some((l) => l.date === today && l.completed);
        if (doneToday) continue;

        const dueTimeStr = h.due_time || h.reminder_time;
        if (!dueTimeStr) continue;

        const [hh, mm] = dueTimeStr.split(":").map((v) => parseInt(v, 10));
        if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
        const dueMinutes = hh * 60 + mm;

        if (nowMinutes >= dueMinutes) {
          addNotification({
            id: `habit-missed-${h.id}-${today}`,
            type: "habit_missed",
            title: `Belum dikerjakan: ${h.emoji} ${h.title}`,
            message: `Batas waktu hari ini pukul ${dueTimeStr}.`,
          });
        }
      }
    };
    tick();
    tickRef.current = window.setInterval(tick, 30_000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [tasks, habits, markReminded, addNotification]);

  return { active };
}
