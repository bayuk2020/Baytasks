import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — BayTasks" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { tasks, activeBoardId } = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [openId, setOpenId] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor); first.setDate(1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    while (cells.length % 7) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const m = new Map<string, typeof tasks>();
    for (const t of tasks.filter((x) => x.boardId === activeBoardId && x.dueAt)) {
      const k = new Date(t.dueAt!).toDateString();
      const arr = m.get(k) ?? [];
      arr.push(t); m.set(k, arr);
    }
    return m;
  }, [tasks, activeBoardId]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{monthLabel}</h1>
        <div className="flex gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}
            className="px-3 rounded-lg border border-border hover:border-primary/40 text-sm">Today</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="glass rounded-2xl p-3">
        <div className="grid grid-cols-7 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 px-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            const today = c.date && c.date.toDateString() === new Date().toDateString();
            const items = c.date ? tasksByDay.get(c.date.toDateString()) ?? [] : [];
            return (
              <div key={i} className={`min-h-[96px] rounded-lg p-2 border ${
                c.date ? (today ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30") : "border-transparent"
              }`}>
                {c.date && (
                  <>
                    <div className={`text-xs ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}>{c.date.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((t) => (
                        <button key={t.id} onClick={() => setOpenId(t.id)}
                          className="block w-full text-left text-[11px] truncate rounded px-1.5 py-0.5 bg-[var(--neon-soft)] text-foreground/90 hover:bg-primary/20">
                          {t.title}
                        </button>
                      ))}
                      {items.length > 3 && <div className="text-[10px] text-muted-foreground">+{items.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {openId && <TaskModal taskId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
