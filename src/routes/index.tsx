/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, todayKey, xpToLevel, rankFor } from "@/lib/store";
import { motion } from "framer-motion";
import {
  // eslint-disable-next-line prettier/prettier
  CheckCircle2,
  Clock,
  Flame,
  Target,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Timer,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useMemo, useEffect } from "react";
import { ContinueReading } from "@/components/library/ContinueReading";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BayTasks" },
      {
        name: "description",
        content: "Daily productivity overview: tasks, habits, focus and streaks.",
      },
    ],
  }),
  component: Dashboard,
});

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Focus is the new IQ.",
  "Small steps, every day. The compound effect is unstoppable.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "Done is better than perfect. Shipping is the skill.",
];

function Dashboard() {
  const {
  tasks,
  boards,
  activeBoardId,
  streak,
  habits,
  habitLogs,
  xp,
  journals,
  books,
  bookNotes,
  readingSessions,
} = useStore();
  const today = todayKey();
  const board = boards.find((b) => b.id === activeBoardId);
  const myTasks = tasks.filter((t) => t.boardId === activeBoardId);
const loadBooks = useStore(
  (s) => s.loadBooks
);

useEffect(() => {

  loadBooks();

}, []);
  const stats = useMemo(() => {
    const done = myTasks.filter((t) => t.column === "done").length;
    const inProg = myTasks.filter((t) => t.column === "in_progress").length;
    const overdue = myTasks.filter(
      (t) => t.dueAt && t.dueAt < Date.now() && t.column !== "done",
    ).length;
    const focus = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;
    return { done, inProg, overdue, focus, total: myTasks.length };
  }, [myTasks]);

  const todaysTasks = useMemo(() => {
    return myTasks
      .filter((t) => t.column !== "done")
      .filter(
        (t) =>
          !t.dueAt ||
          new Date(t.dueAt).toDateString() === new Date().toDateString() ||
          t.dueAt < Date.now(),
      )
      .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))
      .slice(0, 6);
  }, [myTasks]);

  const todaysHabits = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    return active.map((h) => ({
      habit: h,
      done: habitLogs.some((l) => l.habitId === h.id && l.date === today),
    }));
  }, [habits, habitLogs, today]);

  const habitDoneCount = todaysHabits.filter((h) => h.done).length;

  const weekData = useMemo(() => {
    const days: { label: string; tasks: number; habits: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const completed = tasks.filter(
        (t) => t.completedAt && new Date(t.completedAt).toDateString() === d.toDateString(),
      ).length;
      const h = habitLogs.filter((l) => l.date === key).length;
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" })[0],
        tasks: completed,
        habits: h,
      });
    }
    return days;
  }, [tasks, habitLogs]);

  const maxWeek = Math.max(1, ...weekData.map((d) => d.tasks + d.habits));
  const level = xpToLevel(xp);
  const rank = rankFor(level.level);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const focusMinutes = todaysHabits.length * 25; // mock pomodoro

  return (
    <div className="space-y-8 relative">
      <div className="pointer-events-none absolute -top-20 left-1/3 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <header className="flex items-end justify-between flex-wrap gap-3 relative">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">
            Welcome back to <span className="neon-text">{board?.name ?? "BayTasks"}</span>
          </h1>
        </div>
        <Link
          to="/board"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--gradient-neon)] text-primary-foreground text-sm font-medium neon-ring hover:scale-[1.02] transition"
        >
          Enter the board <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
        <KPI
          icon={<Target className="h-4 w-4" />}
          label="Focus score"
          value={`${stats.focus}%`}
          accent
          sub={`${stats.done}/${stats.total} tasks`}
        />
        <KPI
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${streak.current}d`}
          sub={`Rank · ${rank}`}
        />
        <KPI
          icon={<Zap className="h-4 w-4" />}
          label={`XP · Lvl ${level.level}`}
          value={xp.toLocaleString()}
          sub={`${level.into}/${level.span} to next`}
        />
        <KPI
          icon={<Timer className="h-4 w-4" />}
          label="Focus time"
          value={`${focusMinutes}m`}
          sub="Pomodoro today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium">Today's tasks</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Open & overdue · ship them.</p>
            </div>
            <Link to="/board" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {todaysTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inbox zero. Calm seas ahead.
            </div>
          ) : (
            <ul className="space-y-2">
              {todaysTasks.map((t) => {
                const overdue = t.dueAt && t.dueAt < Date.now();
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 hover:border-primary/30 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-2 w-2 rounded-full ${overdue ? "bg-rose-500 pulse-neon" : "bg-primary"}`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t.tags.map((x) => `#${x}`).join(" ") || t.column.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-[11px] shrink-0 ${overdue ? "text-rose-400" : "text-muted-foreground"}`}
                    >
                      {t.dueAt
                        ? new Date(t.dueAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium">Daily rituals</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {habitDoneCount}/{todaysHabits.length} complete
              </p>
            </div>
            <Link to="/habits" className="text-xs text-primary hover:underline">
              Habits →
            </Link>
          </div>
          {todaysHabits.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No active habits.</div>
          ) : (
            <ul className="space-y-2">
              {todaysHabits.slice(0, 6).map(({ habit, done }) => (
                <li
                  key={habit.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                    done ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/40"
                  }`}
                >
                  <span className="text-lg">{habit.emoji}</span>
                  <span
                    className={`flex-1 text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}
                  >
                    {habit.title}
                  </span>
                  {done && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-medium inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Weekly momentum
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tasks shipped + habits hit, last 7 days.
              </p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {weekData.map((d, i) => {
              const total = d.tasks + d.habits;
              const h = (total / maxWeek) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 80 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary/30 to-primary shadow-[0_0_20px_-4px_var(--primary)]"
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{d.label}</div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Daily quote
            </div>
            <p className="mt-3 text-base leading-relaxed">"{quote}"</p>
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Row
                icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                label="Overdue"
                value={stats.overdue}
              />
              <Row
                icon={<Clock className="h-3.5 w-3.5 text-cyan-400" />}
                label="In progress"
                value={stats.inProg}
              />
              <Row
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                label="Completed"
                value={stats.done}
              />
              <Row
                icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                label="Journal entries"
                value={journals.length}
              />
            </div>
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative">
        <ContinueReading />
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="font-medium mb-4">Boards</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boards.map((b) => {
              const count = tasks.filter((t) => t.boardId === b.id && t.column !== "done").length;
              const done = tasks.filter((t) => t.boardId === b.id && t.column === "done").length;
              const total = count + done;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={b.id}
                  to="/board"
                  onClick={() => useStore.getState().setActiveBoard(b.id)}
                  className="rounded-xl border border-border bg-secondary/40 p-4 hover:border-primary/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{b.emoji}</span>
                    <span className="text-xs text-muted-foreground">{count} open</span>
                  </div>
                  <div className="mt-2 font-medium truncate">{b.name}</div>
                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-primary to-violet-400"
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">{pct}% complete</div>
                </Link>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`glass rounded-2xl p-4 relative overflow-hidden ${accent ? "neon-ring" : ""}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
      )}
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`relative mt-2 text-2xl font-semibold ${accent ? "neon-text" : ""}`}>
        {value}
      </div>
      {sub && <div className="relative mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
