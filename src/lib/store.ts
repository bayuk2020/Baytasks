import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Priority = "low" | "med" | "high" | "urgent";
export type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";

export const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export interface Subtask { id: string; title: string; done: boolean }
export interface Attachment { id: string; name: string; size: number; dataUrl: string }
export interface ActivityLog { id: string; ts: number; text: string }

export interface Task {
  id: string;
  boardId: string;
  column: ColumnId;
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
  dueAt?: number;
  reminder?: "10m" | "1h" | "1d" | null;
  reminded?: boolean;
  recurring?: "none" | "daily" | "weekly" | "monthly";
  subtasks: Subtask[];
  attachments: Attachment[];
  notes?: string;
  activity: ActivityLog[];
  createdAt: number;
  completedAt?: number;
  order: number;
}

export interface Board {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

interface State {
  boards: Board[];
  tasks: Task[];
  activeBoardId: string;
  theme: "dark" | "light";
  telegram: { chatId: string; enabled: boolean; dailyBriefing: boolean };
  streak: { current: number; lastDay: string | null };
  setActiveBoard: (id: string) => void;
  addBoard: (name: string, emoji?: string) => string;
  removeBoard: (id: string) => void;
  renameBoard: (id: string, name: string, emoji?: string) => void;
  addTask: (t: Partial<Task> & { boardId: string; title: string; column: ColumnId }) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, column: ColumnId, order: number) => void;
  reorderInColumn: (boardId: string, column: ColumnId, ids: string[]) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  toggleTheme: () => void;
  setTelegram: (patch: Partial<State["telegram"]>) => void;
  bumpStreak: () => void;
  markReminded: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): { boards: Board[]; tasks: Task[]; activeBoardId: string } => {
  const b1: Board = { id: uid(), name: "BayTasks Launch", emoji: "🚀", createdAt: Date.now() };
  const b2: Board = { id: uid(), name: "Personal", emoji: "🌙", createdAt: Date.now() };
  const now = Date.now();
  const t = (o: Partial<Task>): Task => ({
    id: uid(), boardId: b1.id, column: "todo", title: "Untitled",
    priority: "med", tags: [], subtasks: [], attachments: [], activity: [],
    createdAt: now, order: 0, ...o,
  } as Task);
  const tasks: Task[] = [
    t({ title: "Design dark glass UI", column: "done", priority: "high", tags: ["design"], order: 0, completedAt: now }),
    t({ title: "Kanban drag & drop", column: "in_progress", priority: "urgent", tags: ["frontend"], order: 0,
       subtasks: [{ id: uid(), title: "Column DnD", done: true }, { id: uid(), title: "Card DnD", done: false }] }),
    t({ title: "Telegram reminders", column: "todo", priority: "high", tags: ["backend", "telegram"], order: 0,
       dueAt: now + 1000 * 60 * 60 * 26, reminder: "1h" }),
    t({ title: "Calendar view", column: "todo", priority: "med", tags: ["frontend"], order: 1 }),
    t({ title: "Analytics dashboard", column: "review", priority: "med", tags: ["analytics"], order: 0 }),
    t({ title: "Recurring tasks engine", column: "backlog", priority: "low", tags: ["backend"], order: 0 }),
    t({ title: "Export to JSON / CSV", column: "backlog", priority: "low", tags: ["misc"], order: 1 }),
  ];
  return { boards: [b1, b2], tasks, activeBoardId: b1.id };
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      theme: "dark",
      telegram: { chatId: "", enabled: false, dailyBriefing: true },
      streak: { current: 1, lastDay: null },

      setActiveBoard: (id) => set({ activeBoardId: id }),
      addBoard: (name, emoji = "📋") => {
        const id = uid();
        set((s) => ({ boards: [...s.boards, { id, name, emoji, createdAt: Date.now() }], activeBoardId: id }));
        return id;
      },
      removeBoard: (id) => set((s) => ({
        boards: s.boards.filter((b) => b.id !== id),
        tasks: s.tasks.filter((t) => t.boardId !== id),
        activeBoardId: s.activeBoardId === id ? (s.boards.find((b) => b.id !== id)?.id ?? "") : s.activeBoardId,
      })),
      renameBoard: (id, name, emoji) => set((s) => ({
        boards: s.boards.map((b) => b.id === id ? { ...b, name, emoji: emoji ?? b.emoji } : b),
      })),

      addTask: (t) => {
        const id = uid();
        const order = get().tasks.filter((x) => x.boardId === t.boardId && x.column === t.column).length;
        const task: Task = {
          id, boardId: t.boardId, column: t.column, title: t.title,
          description: t.description, priority: t.priority ?? "med",
          tags: t.tags ?? [], dueAt: t.dueAt, reminder: t.reminder ?? null,
          recurring: t.recurring ?? "none",
          subtasks: t.subtasks ?? [], attachments: t.attachments ?? [],
          notes: t.notes, activity: [{ id: uid(), ts: Date.now(), text: "Task created" }],
          createdAt: Date.now(), order,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },
      updateTask: (id, patch) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch };
          if (patch.column && patch.column !== t.column) {
            next.activity = [...t.activity, { id: uid(), ts: Date.now(), text: `Moved to ${patch.column}` }];
            if (patch.column === "done" && !t.completedAt) next.completedAt = Date.now();
            if (patch.column !== "done") next.completedAt = undefined;
          }
          return next;
        }),
      })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, column, order) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, column, order } : t),
      })),
      reorderInColumn: (boardId, column, ids) => set((s) => ({
        tasks: s.tasks.map((t) =>
          t.boardId === boardId && t.column === column
            ? { ...t, order: ids.indexOf(t.id) === -1 ? t.order : ids.indexOf(t.id) }
            : t,
        ),
      })),
      toggleSubtask: (taskId, subId) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === taskId ? {
          ...t, subtasks: t.subtasks.map((x) => x.id === subId ? { ...x, done: !x.done } : x),
        } : t),
      })),
      toggleTheme: () => set((s) => {
        const next = s.theme === "dark" ? "light" : "dark";
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", next === "light");
        }
        return { theme: next };
      }),
      setTelegram: (patch) => set((s) => ({ telegram: { ...s.telegram, ...patch } })),
      bumpStreak: () => set((s) => {
        const today = new Date().toDateString();
        if (s.streak.lastDay === today) return {};
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const current = s.streak.lastDay === yesterday ? s.streak.current + 1 : 1;
        return { streak: { current, lastDay: today } };
      }),
      markReminded: (id) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, reminded: true } : t),
      })),
    }),
    { name: "baytasks-v1" },
  ),
);
