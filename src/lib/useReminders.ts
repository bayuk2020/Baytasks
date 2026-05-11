import { useEffect, useMemo, useRef } from "react";
import { useStore } from "./store";
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

export function useReminders() {
  const tasks = useStore((s) => s.tasks);
  const markReminded = useStore((s) => s.markReminded);
  const tickRef = useRef<number | null>(null);

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
      for (const t of tasks) {
        if (!t.dueAt || t.reminded || t.column === "done") continue;
        const window = t.reminder ? offsetMs[t.reminder] : 0;
        if (window && t.dueAt - now <= window && t.dueAt - now > -60_000) {
          beep();
          toast(`⏰ ${t.title}`, { description: `Due ${new Date(t.dueAt).toLocaleString()}` });
          markReminded(t.id);
        } else if (t.dueAt < now && !t.reminded) {
          toast(`🚨 Overdue: ${t.title}`, { description: "This task is past its deadline" });
          markReminded(t.id);
        }
      }
    };
    tick();
    tickRef.current = window.setInterval(tick, 30_000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [tasks, markReminded]);

  return { active };
}
