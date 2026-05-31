/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Target, ArrowRight } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/indexold")({
  head: () => ({
    meta: [
      { title: "Dashboard — BayTasks" },
      { name: "description", content: "Your productivity command center." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tasks, boards, activeBoardId } = useStore();
  // =========================
  // STREAK CALCULATION
  // =========================

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
  )

    .sort((a, b) => b - a);

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
  const myTasks = tasks.filter((t) => t.boardId === activeBoardId);
  const stats = useMemo(() => {
    const done = myTasks.filter((t) => t.column === "done").length;
    const inProg = myTasks.filter((t) => t.column === "in_progress").length;
    const overdue = myTasks.filter(
      (t) => t.dueAt && t.dueAt < Date.now() && t.column !== "done",
    ).length;
    const focus = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;
    return { done, inProg, overdue, focus, total: myTasks.length };
  }, [myTasks]);

  const upcoming = myTasks
    .filter((t) => t.dueAt && t.column !== "done")
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
    .slice(0, 5);

  const board = boards.find((b) => b.id === activeBoardId);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Let's ship <span className="neon-text">{board?.name ?? "your work"}</span>
          </h1>
        </div>
        <Link
          to="/board"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--gradient-neon)] text-primary-foreground text-sm font-medium neon-ring hover:scale-[1.02] transition"
        >
          Open board <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Focus score"
          value={`${stats.focus}%`}
          accent
        />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.done} />
        <Stat icon={<Clock className="h-4 w-4" />} label="In progress" value={stats.inProg} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${streakCount}d`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Upcoming deadlines</h2>
            <span className="text-xs text-muted-foreground">{upcoming.length} tasks</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nothing scheduled. Calm seas ahead.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => {
                const overdue = t.dueAt && t.dueAt < Date.now();
                return (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.tags.map((tag) => `#${tag}`).join(" ") || "—"}
                      </div>
                    </div>
                    <div
                      className={`text-xs ${overdue ? "text-[var(--priority-urgent)]" : "text-muted-foreground"}`}
                    >
                      {t.dueAt
                        ? new Date(t.dueAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="font-medium mb-4">Boards</h2>
          <ul className="space-y-2">
            {boards.map((b) => {
              const count = tasks.filter((t) => t.boardId === b.id && t.column !== "done").length;
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 hover-lift"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span>{b.emoji}</span>
                    {b.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{count} open</span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-4 ${accent ? "neon-ring" : ""}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent ? "neon-text" : ""}`}>{value}</div>
    </motion.div>
  );
}
