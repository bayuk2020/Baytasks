/* eslint-disable prettier/prettier */
import { create } from "zustand";
import { useEffect } from "react";
import { taskApi, subtaskApi, journalApi, bookApi, bookNoteApi, boardApi, habitApi, goalApi } from "@/lib/api";
import { toast } from "sonner";

export type Priority = "low" | "med" | "high" | "urgent";
export type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Mood = "great" | "good" | "neutral" | "low" | "bad";
export type NotifType = "task_overdue" | "habit_missed" | "pomodoro_done" | "recurring_created" | "task_completed" | "info";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

// ============================== INTEGRASI GOALS LOVABLE ==============================
export type LifeAreaType = "finance" | "career" | "health" | "relationship" | "learning" | "spiritual" | "business";
export type GoalType = "manual" | "task" | "habit" | "finance" | "debt" | "hybrid";
export type GoalStatus = "active" | "completed" | "archived";
export type GoalPriority = "low" | "med" | "high";
export type GoalLinkType = "task" | "habit" | "book" | "debt" | "account" | "transaction";

export interface GoalLink { id: string; type: GoalLinkType; refId: string; label: string }

export interface LifeArea {
  id: number;
  name: string;
}

export interface Milestone {
  id: number;
  goalId?: string; // Penunjang Lovable UI
  title?: string;  // Penunjang Lovable UI
  name: string;
  target_value: number;
  current_value: number;
  due_date: string | null;
  weight: number;
  completed: boolean;
}

export interface QuarterlyPlan {
  id: string;
  goalId: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  target: number;
  current: number;
  notes?: string;
}

export interface GoalActivityLog { id: string; goalId: string; ts: number; text: string }

export interface Goal {
  id: number;
  title: string;
  name?: string; // Fallback Lovable UI
  description: string | null;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  status?: GoalStatus; // Fallback Lovable UI
  links?: GoalLink[];  // Fallback Lovable UI
  area?: LifeArea; 
  milestones?: Milestone[];
}

export type BookStatus = "reading" | "completed" | "paused" | "wishlist";
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  coverPath?: string;
  format: "pdf" | "physical" | "both";
  filePath?: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  createdAt: number;
  updatedAt: number;
}
export interface BookNote {
  id: string;
  bookId: string;
  pageNumber: number;
  chapter: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
export interface ReadingSession {
  id: string;
  bookId: string;
  previousPage: number;
  newPage: number;
  pagesRead: number;
  createdAt: number;
}
export interface Journal {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
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
  books: Book[];
  bookNotes: BookNote[];
  readingSessions: ReadingSession[];
  notifications: Notification[];
  reorderBoards: (draggedId: string, targetId: string) => Promise<void>;
  loadBooks: () => Promise<void>;
  addBook: (payload: any) => Promise<string>;
  updateBook: (id: string, payload: any) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  setBookProgress: (id: string, currentPage: number) => Promise<void>;
  addBookNote: (payload: any) => Promise<string>;
  updateBookNote: (id: string, payload: any) => Promise<void>;
  removeBookNote: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  journals: Journal[];
  addJournal: (journal: Partial<Journal>) => Promise<string>;
  updateJournal: (id: string, patch: Partial<Journal>) => Promise<void>;
  removeJournal: (id: string) => Promise<void>;
  habits: Habit[];
  habitLogs: HabitLog[];
  xp: number;
  loadHabits: () => Promise<void>;
  addHabit: (payload: any) => Promise<void>;
  updateHabit: (id: number, payload: any) => Promise<void>;
  toggleHabit: (id: number) => Promise<void>;
  removeHabit: (id: number) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;
  loadJournals: () => Promise<void>;
  boards: Board[];
  tasks: Task[];
  activeBoardId: string;
  theme: "dark" | "light";
  telegram: { chatId: string; enabled: boolean; dailyBriefing: boolean };
  streak: { current: number; lastDay: string | null };
  loadTasks: () => Promise<void>;
  loadBoards: () => Promise<void>;
  addBoard: (name: string, emoji: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  setActiveBoard: (id: string) => void;
  addTask: (t: Partial<Task> & { boardId: string; title: string; column: ColumnId }) => Promise<string>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  moveTask: (id: string, column: ColumnId, order: number, completedAt?: number) => Promise<void>;
  reorderInColumn: (boardId: string, column: ColumnId, ids: string[]) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  toggleTheme: () => void;
  setTelegram: (patch: Partial<State["telegram"]>) => void;
  bumpStreak: () => void;
  markReminded: (id: string) => void;
  
  // State khusus penunjang modul Goals agar UI Lovable tidak patah
  goals: Goal[];
  milestones: Milestone[];
  quarterlyPlans: QuarterlyPlan[];
  goalActivity: GoalActivityLog[];
  loadGoals: () => Promise<void>;
  addGoal: (g: any) => Promise<number>;
  updateGoal: (id: string, patch: any) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  setGoalStatus: (id: string, status: any) => Promise<void>;
  addGoalLink: (goalId: string, link: any) => Promise<void>;
  removeGoalLink: (goalId: string, linkId: string) => Promise<void>;
  addMilestone: (m: any) => Promise<string>;
  updateMilestone: (id: string, patch: any) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  addQuarterlyPlan: (q: any) => Promise<string>;
  updateQuarterlyPlan: (id: string, patch: any) => Promise<void>;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  completedAt?: number;
}
export interface Habit {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  color: string;
  frequency: "daily" | "weekly";
  target: number;
  xp_per_completion: number;
  archived: boolean;
  createdAt: number;
  logs: HabitLog[];
}

export const todayKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function xpToLevel(totalXp: number) {
  let level = 1;
  while (50 * level * (level + 1) <= totalXp) level++;
  const prev = 50 * (level - 1) * level;
  const next = 50 * level * (level + 1);
  return { level, into: totalXp - prev, span: next - prev, next };
}

export const RANK_TITLES: { min: number; title: string }[] = [
  { min: 1, title: "Awakened" },
  { min: 3, title: "Apprentice" },
  { min: 5, title: "Discipline Hunter" },
  { min: 8, title: "Iron Will" },
  { min: 10, title: "Shadow Monarch" },
  { min: 15, title: "Ascendant" },
  { min: 20, title: "Sovereign" },
];

export const rankFor = (level: number) =>
  [...RANK_TITLES].reverse().find((r) => level >= r.min)?.title ?? "Awakened";

export const BOOK_STATUS_META: Record<BookStatus, { label: string; color: string }> = {
  reading: { label: "Reading", color: "var(--neon)" },
  completed: { label: "Completed", color: "oklch(0.72 0.16 165)" },
  paused: { label: "Paused", color: "oklch(0.78 0.15 90)" },
  wishlist: { label: "Wishlist", color: "oklch(0.7 0.2 305)" },
};

export const bookProgress = (b: Pick<Book, "currentPage" | "totalPages">) =>
  b.totalPages > 0 ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100)) : 0;

export const useStore = create<State>()((set, get) => ({
  books: [],
  bookNotes: [],
  readingSessions: [],
  notifications: [],
  journals: [],
  habits: [],
  habitLogs: [],
  xp: 0,
  boards: [],
  tasks: [],
  activeBoardId: "",
  theme: "dark",
  telegram: { chatId: "", enabled: false, dailyBriefing: true },
  streak: { current: 1, lastDay: null },
  
  // State Default untuk penunjang Goals Lovable UI
  goals: [],
  milestones: [],
  quarterlyPlans: [],
  goalActivity: [],

  reorderBoards: async (draggedId: string, targetId: string) => {
    const { boards } = get();
    const draggedIndex = boards.findIndex(b => b.id === draggedId);
    const targetIndex = boards.findIndex(b => b.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newBoards = [...boards];
    const [draggedItem] = newBoards.splice(draggedIndex, 1);
    newBoards.splice(targetIndex, 0, draggedItem);
    const updatedBoards = newBoards.map((board, index) => ({ ...board, position: index }));
    set({ boards: updatedBoards });
    try {
      await boardApi.reorder({ boards: updatedBoards.map(b => ({ id: b.id, position: b.position })) });
    } catch (error) {
      console.error("Gagal menyimpan urutan board:", error);
      get().loadBoards(); 
    }
  },

  loadBooks: async () => {
    try {
      const data = await bookApi.getAll();
      set({
        books: (data.books ?? []).map((b: any) => ({
          id: String(b.id),
          title: b.title,
          author: b.author,
          coverImage: b.cover_image ?? "",
          coverPath: b.cover_path ?? "",
          format: b.format ?? "physical",
          filePath: b.file_path ?? "",
          totalPages: b.total_pages ?? 0,
          currentPage: b.current_page ?? 0,
          status: b.status,
          createdAt: new Date(b.created_at).getTime(),
          updatedAt: new Date(b.updated_at).getTime(),
        })),
        bookNotes: (data.bookNotes ?? []).map((n: any) => ({
          id: String(n.id),
          bookId: String(n.book_id),
          pageNumber: n.page_number,
          chapter: n.chapter ?? "",
          title: n.title ?? "",
          content: n.content ?? "",
          createdAt: new Date(n.created_at).getTime(),
          updatedAt: new Date(n.updated_at).getTime(),
        })),
        readingSessions: (data.readingSessions ?? []).map((s: any) => ({
          id: String(s.id),
          bookId: String(s.book_id),
          previousPage: s.previous_page,
          newPage: s.new_page,
          pagesRead: s.pages_read,
          createdAt: new Date(s.created_at).getTime(),
        })),
      });
    } catch (err) {
      console.error("LOAD BOOKS ERROR", err);
    }
  },

  addBook: async (payload) => {
    try {
      const data = await bookApi.create(payload);
      set((s) => ({ books: [data.book, ...s.books] }));
      toast.success("Book added");
      return data.book?.id ?? "";
    } catch (err) {
      console.error("ADD BOOK ERROR", err);
      return "";
    }
  },

  updateBook: async (id, payload) => {
    try {
      set((s) => ({
        books: s.books.map((b) => String(b.id) === String(id) ? { ...b, ...payload, updatedAt: Date.now() } : b),
      }));
      await bookApi.update(id, payload);
      toast.success("Book updated");
    } catch (err) {
      console.error("UPDATE BOOK ERROR", err);
      await get().loadBooks();
    }
  },

  removeBook: async (id) => {
    try {
      set((s) => ({
        books: s.books.filter((b) => String(b.id) !== String(id)),
        bookNotes: s.bookNotes.filter((n) => String(n.bookId) !== String(id)),
        readingSessions: s.readingSessions.filter((r) => String(r.bookId) !== String(id)),
      }));
      await bookApi.remove(id);
      toast.success("Book removed");
    } catch (err) {
      console.error("REMOVE BOOK ERROR", err);
      await get().loadBooks();
    }
  },

  setBookProgress: async (id, currentPage) => {
    try {
      set((s) => ({
        books: s.books.map((b) => String(b.id) === String(id) ? { ...b, currentPage, updatedAt: Date.now() } : b),
      }));
      await bookApi.updateProgress(id, currentPage);
      toast.success("Progress updated");
    } catch (err) {
      console.error("UPDATE PROGRESS ERROR", err);
      await get().loadBooks();
    }
  },

  addBookNote: async (payload) => {
    try {
      const data = await bookNoteApi.create({
        book_id: Number(payload.bookId),
        page_number: payload.pageNumber,
        chapter: payload.chapter,
        title: payload.title,
        content: payload.content,
      });
      await get().loadBooks();
      toast.success("Note added");
      return String(data.note?.id ?? "");
    } catch (err) {
      console.error("ADD NOTE ERROR", err);
      return "";
    }
  },

  updateBookNote: async (id, payload) => {
    try {
      await bookNoteApi.update(id, {
        page_number: payload.pageNumber,
        chapter: payload.chapter,
        title: payload.title,
        content: payload.content,
      });
      await get().loadBooks();
      toast.success("Note updated");
    } catch (err) {
      console.error("UPDATE BOOK NOTE ERROR", err);
    }
  },

  removeBookNote: async (id) => {
    try {
      await bookNoteApi.remove(id);
      await get().loadBooks();
      toast.success("Note deleted");
    } catch (err) {
      console.error("REMOVE BOOK NOTE ERROR", err);
    }
  },

  loadTasks: async () => {
    try {
      const data = await taskApi.getAll();
      set({ tasks: data });
    } catch (err) {
      console.error("LOAD TASKS ERROR", err);
    }
  },

  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),

  markAllNotificationsRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
  })),

  clearNotifications: () => set({ notifications: [] }),

  loadJournals: async () => {
    try {
      const data = await journalApi.getAll();
      set({
        journals: (data ?? []).map((j: any) => ({
          id: String(j.id),
          title: j.title,
          content: j.content,
          mood: j.mood,
          tags: (j.tags ?? []).map((t: any) => t.tag),
          createdAt: new Date(j.created_at).getTime(),
          updatedAt: new Date(j.updated_at).getTime(),
        })),
      });
    } catch (err) {
      console.error("LOAD JOURNALS ERROR", err);
    }
  },

  addJournal: async (journal) => {
    try {
      const created = await journalApi.create({
        title: journal.title ?? "Untitled",
        content: journal.content,
        mood: journal.mood,
        tags: journal.tags,
      });
      await get().loadJournals();
      return String(created.id);
    } catch (err) {
      console.error("ADD JOURNAL ERROR", err);
      return "";
    }
  },

  updateJournal: async (id, patch) => {
    try {
      set((s) => ({
        journals: s.journals.map((j) => j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j),
      }));
      await journalApi.update(Number(id), {
        title: patch.title,
        content: patch.content,
        mood: patch.mood,
        tags: patch.tags,
      });
    } catch (err) {
      console.error("UPDATE JOURNAL ERROR", err);
    }
  },

  removeJournal: async (id) => {
    try {
      await journalApi.remove(Number(id));
      await get().loadJournals();
    } catch (err) {
      console.error("REMOVE JOURNAL ERROR", err);
    }
  },

  loadHabits: async () => {
    try {
      const data = await habitApi.getAll();
      const habits = data.map((h: any) => ({
        id: String(h.id),
        title: h.title,
        description: h.description ?? "",
        emoji: h.emoji ?? "🚀",
        color: h.color ?? "#00ffff",
        frequency: h.frequency ?? "daily",
        target: h.target ?? 1,
        xp_per_completion: h.xp_per_completion !== undefined ? Number(h.xp_per_completion) : 25, 
        archived: !!h.archived,
        createdAt: Date.now(),
        logs: (h.logs ?? []).map((log: any) => ({
          id: String(log.id),
          date: String(log.date).slice(0, 10),
          completed: !!log.completed,
          completedAt: log.completed_at ? new Date(log.completed_at).getTime() : undefined,
        })),
      }));
      const habitLogs = habits.flatMap((h: any) => (h.logs ?? []).map((log: any) => ({ ...log, habitId: h.id })));
      const xp = habits.reduce((acc: number, h: any) => acc + (h.logs?.length ?? 0) * (h.xp_per_completion ?? 25), 0);
      set({ habits, habitLogs, xp });
    } catch (err) {
      console.error("LOAD HABITS ERROR", err);
    }
  },

  addHabit: async (payload) => {
    try {
      await habitApi.create(payload);
      await get().loadHabits();
      toast.success("Habit created");
    } catch (err) {
      console.error("ADD HABIT ERROR", err);
    }
  },

  toggleHabit: async (id) => {
    try {
      const today = todayKey();
      const state = get();
      const existing = state.habitLogs.find((l) => Number(l.habitId) === Number(id) && l.date === today);
      let nextLogs = [];
      if (existing) {
        nextLogs = state.habitLogs.filter((l) => l.id !== existing.id);
      } else {
        nextLogs = [...state.habitLogs, { id: `temp-${Date.now()}`, habitId: String(id), date: today, completed: true, completedAt: Date.now() }];
      }
      const nextXp = state.habits.reduce((acc, h) => {
        const completionCount = nextLogs.filter((l) => Number(l.habitId) === Number(h.id)).length;
        return acc + (completionCount * (h.xp_per_completion ?? 25));
      }, 0);
      set({ habitLogs: nextLogs, xp: nextXp });
      await habitApi.toggle(Number(id));
      toast.success("Keren, lanjutkan");
    } catch (err) {
      console.error("TOGGLE HABIT ERROR", err);
      await get().loadHabits();
    }
  },

  updateHabit: async (id, payload) => {
    try {
      await habitApi.update(Number(id), payload);
      await get().loadHabits();
      toast.success("Habit updated");
    } catch (err) {
      console.error("UPDATE HABIT ERROR", err);
    }
  },

  removeHabit: async (id) => {
    try {
      await habitApi.remove(Number(id)); 
      await get().loadHabits();
      toast.success("Habit removed permanently");
    } catch (err) {
      console.error("REMOVE HABIT ERROR", err);
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitApi.archive(id);
      await get().loadHabits();
      toast.success("Habit archived");
    } catch (err) {
      console.error("ARCHIVE HABIT ERROR", err);
    }
  },

  loadBoards: async () => {
    try {
      const data = await boardApi.getAll();
      const mappedBoards = data.map((b: any) => ({
        id: String(b.id),
        name: b.name,
        emoji: b.emoji ?? "🚀",
        position: b.position !== undefined ? Number(b.position) : 0,
        createdAt: Date.now(),
      }));
      const sortedBoards = mappedBoards.sort((a: any, b: any) => a.position - b.position);
      set({ boards: sortedBoards });
      const currentActive = get().activeBoardId;
      const isStillValid = sortedBoards.find((b: any) => b.id === currentActive);
      if (sortedBoards.length > 0 && (!currentActive || !isStillValid)) {
        set({ activeBoardId: sortedBoards[0].id });
      }
    } catch (err) {
      console.error("LOAD BOARDS ERROR", err);
    }
  },

  addBoard: async (name, emoji) => {
    try {
      const nextPosition = get().boards.length;
      await boardApi.create({ project_id: 1, name, emoji, position: nextPosition });
      await get().loadBoards();
      toast.success("Board added successfully");
    } catch (err) {
      console.error("ADD BOARD ERROR", err);
    }
  },

  setTasks: (tasks) => set({ tasks }),
  setActiveBoard: (id) => set({ activeBoardId: id }),

  addTask: async (t) => {
    try {
      const data = await taskApi.create({
        board_id: t.boardId,
        title: t.title,
        description: t.description,
        notes: t.notes,
        column_key: t.column,
        priority: t.priority ?? "med",
        tags: t.tags ?? [],
        due_at: t.dueAt ? new Date(t.dueAt).toISOString() : null,
        reminder: t.reminder ?? null,
        recurring: t.recurring ?? "none",
        position: 0,
      });
      await get().loadTasks();
      toast.success("Task added successfully");
      return data.task?.id ?? "";
    } catch (err) {
      console.error("ADD TASK ERROR", err);
      return "";
    }
  },

  updateTask: async (id, patch) => {
    try {
      set({ tasks: get().tasks.map((task) => task.id === id ? { ...task, ...patch } : task) });
      await taskApi.update(id, {
        title: patch.title,
        description: patch.description,
        notes: patch.notes,
        column_key: patch.column,
        priority: patch.priority,
        tags: patch.tags,
        due_at: patch.dueAt ? new Date(patch.dueAt).toISOString() : null,
        reminder: patch.reminder,
        recurring: patch.recurring,
        completed_at: patch.completedAt ? new Date(patch.completedAt).toISOString() : null,
        position: patch.order,
      });
      toast.success("Task updated successfully");
    } catch (err) {
      console.error("UPDATE TASK ERROR", err);
      await get().loadTasks();
    }
  },

  removeTask: async (id) => {
    const oldTasks = get().tasks;
    set({ tasks: oldTasks.filter((task) => task.id !== id) });
    try {
      await taskApi.remove(id);
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error("DELETE TASK ERROR", err);
      set({ tasks: oldTasks });
    }
  },

  moveTask: async (id, column, order, completedAt) => {
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      await get().updateTask(id, {
        title: task.title,
        description: task.description,
        notes: task.notes,
        column,
        priority: task.priority,
        tags: task.tags,
        dueAt: task.dueAt,
        reminder: task.reminder,
        recurring: task.recurring,
        completedAt: completedAt,
        order,
      });
    } catch (err) {
      console.error("MOVE TASK ERROR", err);
    }
  },

  reorderInColumn: (boardId, column, ids) => {
    const tasks = get().tasks.map((t) => t.boardId === boardId && t.column === column ? { ...t, order: ids.indexOf(t.id) } : t);
    set({ tasks });
  },

  toggleSubtask: (taskId, subId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find((s) => s.id === subId);
    if (!subtask) return;
    const nextDone = !subtask.done;
    subtaskApi.toggle(subId, nextDone).catch((err) => console.error("TOGGLE SUBTASK ERROR", err));
    set({
      tasks: get().tasks.map((t) => t.id === taskId ? { ...t, subtasks: t.subtasks.map((s) => s.id === subId ? { ...s, done: nextDone } : s) } : t),
    });
  },
  
  toggleTheme: () => set((s) => {
    const next = s.theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") document.documentElement.classList.toggle("light", next === "light");
    return { theme: next };
  }),

  setTelegram: (patch) => set((s) => ({ telegram: { ...s.telegram, ...patch } })),

  bumpStreak: () => set((s) => {
    const completedDays = Array.from(new Set(s.tasks.filter((t) => t.completedAt).map((t) => {
      const d = new Date(t.completedAt!);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))).sort((a, b) => b - a);
    if (completedDays.length === 0) return { streak: { current: 0, lastDay: null } };
    let current = 1;
    for (let i = 0; i < completedDays.length - 1; i++) {
      if (completedDays[i] - completedDays[i + 1] === 86400000) current++;
      else break;
    }
    return { streak: { current, lastDay: new Date(completedDays[0]).toDateString() } };
  }),

  markReminded: (id) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, reminded: true } : t),
  })),


  // ========================= MUTATOR INTEGRASI UTUT REAKTIF MODUL GOALS LOVABLE =========================
 // ========================= MUTATOR INTEGRASI UTUT REAKTIF MODUL GOALS LOVABLE =========================
  loadGoals: async () => {
    try {
      const data = await goalApi.getAll();
      const areaMappingReverse: Record<number, string> = {
        1: "finance", 2: "career", 3: "health", 4: "relationship", 5: "learning", 6: "spiritual", 7: "business"
      };
      
      // 1. Amankan penarikan array goals utama
      const rawGoals = data.goals || (Array.isArray(data) ? data : []);
      const mappedGoals = rawGoals.map((g: any) => {
        const detectedArea = g.area_id ? areaMappingReverse[Number(g.area_id)] : (g.lifeArea || "career");
        
        return {
          id: g.id,
          title: g.title,
          name: g.title,
          description: g.description,
          lifeArea: detectedArea.toLowerCase(),
          type: g.type || "manual",
          startValue: 0,
          currentValue: Number(g.current_amount),
          targetValue: Number(g.target_amount),
          current_amount: Number(g.current_amount),
          target_amount: Number(g.target_amount),
          area_id: g.area_id ? Number(g.area_id) : 5,
          unit: g.unit || "",
          invert: false,
          targetDate: g.due_date ? new Date(g.due_date).getTime() : undefined,
          priority: g.priority || "med",
          status: g.completed ? "completed" : "active",
          notes: g.description || "",
          links: g.links || [],
          progress_percent: g.progress_percent || 0
        };
      });

      // 2. Amankan penarikan array milestones dari seluruh struktur response yang memungkinkan
      // Jika backend mengirimkan data gabungan di 'data.milestones' atau lewat array tersendiri
      const rawMilestones = data.milestones || data.milestone || [];
      const mappedMilestones = rawMilestones.map((m: any) => ({
        id: m.id,
        goal_id: String(m.goal_id),
        goalId: String(m.goal_id),
        title: m.name,
        name: m.name,
        target_value: Number(m.target_value),
        current_value: Number(m.current_value),
        targetValue: Number(m.target_value),
        currentValue: Number(m.current_value),
        dueAt: m.due_date ? new Date(m.due_date).getTime() : undefined,
        completed: !!m.completed
      }));

      // 3. Amankan penarikan array perencanaan triwulan (quarterlyPlans) sekaligus
      const rawPlans = data.quarterlyPlans || data.quarterly_plans || data.plans || [];
      const mappedPlans = rawPlans.map((q: any) => ({
        id: String(q.id),
        goal_id: String(q.goal_id),
        goalId: String(q.goal_id),
        year: q.year,
        quarter: q.quarter,
        target_amount: Number(q.target_amount),
        current_amount: Number(q.current_amount),
        target: Number(q.target_amount),
        current: Number(q.current_amount)
      }));

      // 4. Set seluruh state tabel ekosistem goals secara serentak ke dalam store global
      set({ 
        goals: mappedGoals, 
        milestones: mappedMilestones, 
        quarterlyPlans: mappedPlans 
      });

    } catch (err) {
      console.error("LOAD GOALS DATABASE ERROR", err);
    }
  },

  
  addGoal: async (g: any) => {
    try {
      const areaMapping: Record<string, number> = {
        finance: 1, career: 2, health: 3, relationship: 4, learning: 5, spiritual: 6, business: 7
      };
      
      const targetAreaString = (g.lifeArea || "learning").toLowerCase();
      const targetAreaId = areaMapping[targetAreaString] || 5;

      const payload = {
        ...g,
        area_id: targetAreaId,
        title: g.title || g.name,
        target_amount: g.targetValue || g.target_amount || 0,
        current_amount: g.currentValue || g.current_amount || 0,
      };

      const res = await goalApi.create(payload);
      const serverGoal = res.goal || res;
      
      const optimisticGoal: any = {
        id: serverGoal.id,
        title: serverGoal.title || payload.title,
        name: serverGoal.title || payload.title,
        description: serverGoal.description || g.description,
        lifeArea: targetAreaString,
        type: serverGoal.type || "manual",
        startValue: 0,
        currentValue: Number(serverGoal.current_amount || payload.current_amount),
        targetValue: Number(serverGoal.target_amount || payload.target_amount),
        current_amount: Number(serverGoal.current_amount || payload.current_amount),
        target_amount: Number(serverGoal.target_amount || payload.target_amount),
        area_id: targetAreaId,
        progress_percent: Number(serverGoal.progress_percent) || 0,
        status: "active",
        links: [],
        milestones: []
      };

      set((state: any) => ({
        goals: [optimisticGoal, ...(state.goals || [])]
      }));

      await get().loadGoals();
      toast.success("Goal saved to database");
      return serverGoal.id; 
    } catch (err) {
      console.error("ADD GOAL TO MYSQL ERROR", err);
      return Math.floor(100000 + Math.random() * 900000);
    }
  },
updateGoal: async (id: any, patch: any) => {
    try {
      // 🌟 Sinkronisasi field patch agar dipahami format snake_case MySQL database Laravel
      const dbPatch = {
        ...patch,
        current_amount: patch.currentValue !== undefined ? patch.currentValue : patch.current_amount,
        target_amount: patch.targetValue !== undefined ? patch.targetValue : patch.target_amount,
        completed: patch.status === "completed" ? 1 : undefined
      };

      set((state: any) => ({
        goals: (state.goals || []).map((g: any) => g.id.toString() === id.toString() ? { ...g, ...patch, ...dbPatch } : g)
      }));

      await goalApi.update(id, dbPatch);
      await get().loadGoals();
    } catch (err) {
      console.error("UPDATE GOAL ERROR", err);
    }
  },

  removeGoal: async (id: any) => {
    try {
      set((state: any) => ({
        goals: (state.goals || []).filter((g: any) => g.id.toString() !== id.toString())
      }));
      await goalApi.remove(id);
      toast.success("Goal deleted from database");
    } catch (err) {
      console.error("REMOVE GOAL ERROR", err);
    }
  },

  setGoalStatus: async (id: any, status: any) => {
    try {
      await get().updateGoal(id, { status });
    } catch (err) {
      console.error("SET STATUS ERROR", err);
    }
  },

  addGoalLink: async (goalId: any, link: any) => {
    try {
      // 1. Ambil target goal saat ini untuk mendapatkan link lama yang sudah tersimpan
      const currentGoal = (get().goals || []).find((g: any) => g.id.toString() === goalId.toString());
      const existingLinks = currentGoal?.links || [];

      // 2. Gabungkan link lama dengan link baru yang baru saja dipilih
      const updatedLinks = [...existingLinks, link];

      // 3. Update state lokal di UI secara optimis agar responsif
      set((state: any) => ({
        goals: (state.goals || []).map((g: any) => 
          g.id.toString() === goalId.toString() ? { ...g, links: updatedLinks } : g
        )
      }));

      // 4. Tembak langsung ke controller update Laravel untuk sinkronisasi tabel goal_links
      await goalApi.update(goalId, { links: updatedLinks });
      
      // 5. Tarik ulang data dari server agar ID link bawaan MySQL sinkron
      await get().loadGoals();
      toast.success("Resource berhasil di-link ke database");
    } catch (err) {
      console.error("ADD GOAL LINK ERROR", err);
      toast.error("Gagal menyimpan link resource");
    }
  },

  removeGoalLink: async (goalId: any, linkId: any) => {
    try {
      // 1. Ambil target goal saat ini
      const currentGoal = (get().goals || []).find((g: any) => g.id.toString() === goalId.toString());
      
      // 2. Filter buang link yang ingin dihapus berdasarkan ID-nya
      const updatedLinks = (currentGoal?.links || []).filter((l: any) => l.id !== linkId);

      // 3. Update state lokal di UI secara optimis
      set((state: any) => ({
        goals: (state.goals || []).map((g: any) => 
          g.id.toString() === goalId.toString() ? { ...g, links: updatedLinks } : g
        )
      }));

      // 4. Kirim sisa daftar link yang valid ke Laravel untuk memperbarui relasi di DB
      await goalApi.update(goalId, { links: updatedLinks });
      
      await get().loadGoals();
      toast.success("Link berhasil dicabut");
    } catch (err) {
      console.error("REMOVE GOAL LINK ERROR", err);
      toast.error("Gagal menghapus link");
    }
  },

  addMilestone: async (m: any): Promise<string> => {
    try {
      const res = await goalApi.createMilestone({
        goal_id: m.goal_id,
        name: m.name || m.title,
        due_date: m.due_date,
        target_value: m.target_value,
        current_value: 0,
        completed: false
      });

      const generatedId = res && (res.id || res.milestone?.id) 
        ? String(res.id || res.milestone?.id) 
        : "ms-" + Math.floor(1000 + Math.random() * 9000);

      const newMilestone = {
        id: generatedId,
        goal_id: String(m.goal_id),
        goalId: String(m.goal_id),
        name: m.name || m.title,
        title: m.name || m.title,
        target_value: Number(m.target_value || 0),
        current_value: 0,
        targetValue: Number(m.target_value || 0),
        currentValue: 0,
        due_date: m.due_date,
        dueAt: m.dueAt,
        completed: false
      };

      // 🌟 Paksa suntik ke memori lokal secara instan agar tidak kosong saat loadGoals berjalan
      set((state: any) => ({
        milestones: [...(state.milestones || []).filter((x: any) => x.id !== generatedId), newMilestone]
      }));

      await get().loadGoals();
      return generatedId;
    } catch (err) {
      console.error("ADD MILESTONE ERROR", err);
      return String(Math.random());
    }
  },

  updateMilestone: async (id: any, patch: any) => {
    try {
      const dbMilestonePatch = {
        ...patch,
        completed: patch.completed !== undefined ? (patch.completed ? 1 : 0) : undefined
      };

      set((state: any) => ({
        milestones: (state.milestones || []).map((m: any) => m.id.toString() === id.toString() ? { ...m, ...patch } : m)
      }));
      await goalApi.updateMilestone(id, dbMilestonePatch);
      await get().loadGoals();
    } catch (err) {
      console.error("UPDATE MILESTONE ERROR", err);
    }
  },

  toggleMilestone: async (id: any) => {
    try {
      // Find milestone yang mau di-toggle statusnya
      const list = get().milestones || [];
      const targetMilestone = list.find((m: any) => m.id.toString() === id.toString());
      if (!targetMilestone) return;

      const nextCompletedStatus = !targetMilestone.completed;

      // 1. Optimistic Update di UI lokal biar instan berubah jadi centang
      set((state: any) => ({
        milestones: (state.milestones || []).map((m: any) => 
          m.id.toString() === id.toString() ? { ...m, completed: nextCompletedStatus } : m
        )
      }));

      // 2. Tembak ke API Laravel Backend (Menggunakan format snake_case yang diminta MySQL)
      await goalApi.updateMilestone(id, {
        completed: nextCompletedStatus ? 1 : 0
      });

      // 3. Refresh data agar kalkulasi persentase goal utama ikut naik secara otomatis
      if (get().loadGoals) {
        await get().loadGoals();
      }
    } catch (err) {
      console.error("TOGGLE MILESTONE ERROR", err);
    }
  },

  removeMilestone: async (id: any) => {
    try {
      set((state: any) => ({
        milestones: (state.milestones || []).filter((m: any) => m.id.toString() !== id.toString())
      }));
      await goalApi.removeMilestone(id);
    } catch (err) {
      console.error("REMOVE MILESTONE ERROR", err);
    }
  },

  addQuarterlyPlan: async (q: any) => {
    try {
      const res = await goalApi.createQuarterlyPlan(q);
      await get().loadGoals();
      return String(res.plan?.id || res.id || Math.random());
    } catch (err) {
      console.error("ADD QUARTERLY PLAN ERROR", err);
      return String(Math.random());
    }
  },

  updateQuarterlyPlan: async (id: any, patch: any) => {
    try {
      set((state: any) => ({
        quarterlyPlans: (state.quarterlyPlans || []).map((q: any) => q.id === id ? { ...q, ...patch } : q)
      }));
      await goalApi.updateQuarterlyPlan(id, patch);
    } catch (err) {
      console.error("UPDATE QUARTER PLAN ERROR", err);
    }
  }
}));