/* eslint-disable prettier/prettier */
import { create } from "zustand";
import { useEffect } from "react";
import { taskApi, subtaskApi, journalApi, } from "@/lib/api";
import { toast } from "sonner";
import { boardApi } from "@/lib/api";

import {
  habitApi,
} from "@/lib/api";
export type Priority = "low" | "med" | "high" | "urgent";

export type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";

export type Mood =

  | "great"
  | "good"
  | "neutral"
  | "low"
  | "bad";

export type NotifType =

  | "task_overdue"
  | "habit_missed"
  | "pomodoro_done"
  | "recurring_created"
  | "task_completed"
  | "info";

export interface Notification {

  id: string;

  type: NotifType;

  title: string;

  message: string;

  read: boolean;

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

export const COLUMNS: {
  id: ColumnId;
  title: string;
}[] = [
  {
    id: "backlog",
    title: "Backlog",
  },
  {
    id: "todo",
    title: "To Do",
  },
  {
    id: "in_progress",
    title: "In Progress",
  },
  {
    id: "review",
    title: "Review",
  },
  {
    id: "done",
    title: "Done",
  },
];

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
}

export interface ActivityLog {
  id: string;
  ts: number;
  text: string;
}

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

  notifications: Notification[];

markNotificationRead: (
  id: string
) => void;

markAllNotificationsRead: () => void;

clearNotifications: () => void;

  journals: Journal[];

addJournal: (
  journal: Partial<Journal>
) => Promise<string>;

updateJournal: (
  id: string,
  patch: Partial<Journal>
) => Promise<void>;

removeJournal: (
  id: string
) => Promise<void>;
  habits: Habit[];
habitLogs: HabitLog[];
xp: number;

loadHabits: () => Promise<void>;

addHabit: (
  payload: any
) => Promise<void>;

updateHabit: (
  id: number,
  payload: any
) => Promise<void>;

toggleHabit: (
  id: number
) => Promise<void>;

removeHabit: (
  id: number
) => Promise<void>;
archiveHabit: (
  id: number,
) => Promise<void>;

loadJournals: () => Promise<void>;

  boards: Board[];
  
  tasks: Task[];

  activeBoardId: string;

  theme: "dark" | "light";

  telegram: {
    chatId: string;
    enabled: boolean;
    dailyBriefing: boolean;
  };

  streak: {
    current: number;
    lastDay: string | null;
  };

  loadTasks: () => Promise<void>;
  loadBoards: () => Promise<void>;
  addBoard: (name: string, emoji: string) => Promise<void>;

  setTasks: (tasks: Task[]) => void;

  setActiveBoard: (id: string) => void;

  addTask: (
    t: Partial<Task> & {
      boardId: string;
      title: string;
      column: ColumnId;
    },
  ) => Promise<string>;

  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;

  removeTask: (id: string) => Promise<void>;

  moveTask: (id: string, column: ColumnId, order: number, completedAt?: number) => Promise<void>;

  reorderInColumn: (boardId: string, column: ColumnId, ids: string[]) => void;

  toggleSubtask: (taskId: string, subId: string) => void;

  toggleTheme: () => void;

  setTelegram: (patch: Partial<State["telegram"]>) => void;

  bumpStreak: () => void;

  markReminded: (id: string) => void;
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

  frequency:
    | "daily"
    | "weekly";

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

// XP curve: level n requires n*100 XP from previous; total to reach level L = 50*L*(L+1)
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




export const useStore = create<State>()((set, get) => ({
  notifications: [],
  journals: [],
  habits: [],
  habitLogs: [],
xp: 0,
  boards: [],

  tasks: [],

  activeBoardId: "1",

  theme: "dark",

  telegram: {
    chatId: "",
    enabled: false,
    dailyBriefing: true,
  },

  streak: {
    current: 1,
    lastDay: null,
  },

  

  // =========================
  // LOAD TASKS
  // =========================

  loadTasks: async () => {
    try {
      const data = await taskApi.getAll();

      set({
        tasks: data,
      });
    } catch (err) {
      console.error("LOAD TASKS ERROR", err);
    }
  },

  // =========================
// NOTIFICATIONS
// =========================

markNotificationRead:
  (id) =>

    set((s) => ({

      notifications:

        s.notifications.map(
          (n) =>

            n.id === id

              ? {
                  ...n,
                  read: true,
                }

              : n
        ),
    })),

markAllNotificationsRead:
  () =>

    set((s) => ({

      notifications:

        s.notifications.map(
          (n) => ({
            ...n,
            read: true,
          })
        ),
    })),

clearNotifications:
  () =>

    set({

      notifications: [],
    }),

  // =========================
// LOAD JOURNALS
// =========================

loadJournals: async () => {

  try {

    const data =
      await journalApi.getAll();
    console.log(data);
    set({

  journals:

    (data ?? []).map(
          (j: any) => ({

            id:
              String(j.id),

            title:
              j.title,

            content:
              j.content,

            mood:
              j.mood,

            tags:
           (j.tags ?? []).map(
                (t: any) =>
                  t.tag
              ),

            createdAt:
              new Date(
                j.created_at
              ).getTime(),

            updatedAt:
              new Date(
                j.updated_at
              ).getTime(),
          })
        ),
    });

  } catch (err) {

    console.error(
      "LOAD JOURNALS ERROR",
      err
    );
  }
},

// =========================
// ADD JOURNAL
// =========================

addJournal:
  async (journal) => {

    try {

      const created =
        await journalApi.create({

                title:
              journal.title ??
              "Untitled",

          content:
            journal.content,

          mood:
            journal.mood,

          tags:
            journal.tags,
        });

      await get()
        .loadJournals();

      return String(
        created.id
      );

    } catch (err) {

      console.error(
        "ADD JOURNAL ERROR",
        err
      );

      return "";
    }
  },

// =========================
// UPDATE JOURNAL
// =========================

updateJournal:
  async (
    id,
    patch
  ) => {

    try {

      // optimistic update
      set((s) => ({

        journals:

          s.journals.map(
            (j) =>

              j.id === id

                ? {

                    ...j,

                    ...patch,

                    updatedAt:
                      Date.now(),
                  }

                : j
          ),
      }));

      // backend save
      await journalApi.update(

        Number(id),

        {

          title:
            patch.title,

          content:
            patch.content,

          mood:
            patch.mood,

          tags:
            patch.tags,
        }
      );
console.log(patch);
    } catch (err) {

      console.error(
        "UPDATE JOURNAL ERROR",
        err
      );
    }
  },

// =========================
// REMOVE JOURNAL
// =========================

removeJournal:
  async (id) => {

    try {

      await journalApi.remove(
        Number(id)
      );

      await get()
        .loadJournals();

    } catch (err) {

      console.error(
        "REMOVE JOURNAL ERROR",
        err
      );
    }
  },

  // =========================
// LOAD HABITS
// =========================

loadHabits: async () => {

  try {

    const data =
      await habitApi.getAll();

    const habits =
      data.map(
        (h: any) => ({

          id:
            String(h.id),

          title:
            h.title,

          emoji:
            h.emoji,

          color:
            h.color,

          frequency:
            h.frequency,

          target:
            h.target,

          archived:
            !!h.archived,

          createdAt:
            Date.now(),

          logs:
            (
              h.logs ?? []
            ).map(
              (
                log: any
              ) => ({

                id:
                  String(
                    log.id
                  ),

                date:
                  String(
                    log.date
                  ).slice(
                    0,
                    10
                  ),

                completed:
                  !!log.completed,

                completedAt:
                  log.completed_at
                    ? new Date(
                        log.completed_at
                      ).getTime()
                    : undefined,
                })
            ),
        })
      );

      const habitLogs = habits.flatMap((h: any) =>
      (h.logs ?? []).map((log: any) => ({
        ...log,
        habitId: h.id,
      }))
    );

    const xp =
      habits.reduce(
        (
          acc: number,
          h: any
        ) => {

          return (
            acc +
            (
              h.logs
                ?.length ??
              0
            ) *
              (h.xp_per_completion ?? 25)
          );
        },

        0
      );

    set({
      habits,
      habitLogs,
      xp,
    });

  } catch (err) {

    console.error(
      "LOAD HABITS ERROR",
      err
    );
  }
},

// =========================
// ADD HABIT
// =========================

addHabit: async (
  payload
) => {

  try {

    await habitApi.create(
      payload
    );

    await get()
      .loadHabits();

    toast.success(
      "Habit created"
    );
          new Audio(
        "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
      ).play();

  } catch (err) {

    console.error(
      "ADD HABIT ERROR",
      err
    );
  }
},

// =========================
// TOGGLE HABIT
// =========================

toggleHabit: async (id) => {
  try {

    const today = todayKey();

    const state = get();

    const existing = state.habitLogs.find(
      (l) =>
        Number(l.habitId) === Number(id) &&
        l.date === today
    );

    // =========================
    // OPTIMISTIC UPDATE
    // =========================

    if (existing) {

      set({
        habitLogs: state.habitLogs.filter(
          (l) => l.id !== existing.id
        ),
      });

    } else {

      set({
        habitLogs: [
          ...state.habitLogs,
          {
            id: `temp-${Date.now()}`,
            habitId: String(id),
            date: today,
            completed: true,
            completedAt: Date.now(),
          },
        ],
      });

    }

    // =========================
    // API
    // =========================

    await habitApi.toggle(Number(id));

    toast.success(
      "Keren, lanjutkan"
    );

    new Audio(
      "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
    ).play();

  } catch (err) {

    console.error(
      "TOGGLE HABIT ERROR",
      err
    );

    // kalau gagal sync ulang
    await get().loadHabits();
  }
},

// =========================
// UPDATE HABIT
// =========================

updateHabit: async (
  id,
  payload
) => {

  try {

    await habitApi.update(
      Number(id),
      payload
    );

    await get()
      .loadHabits();

    toast.success(
      "Habit updated"
    );

  } catch (err) {

    console.error(
      "UPDATE HABIT ERROR",
      err
    );
  }
},

// =========================
// REMOVE HABIT
// =========================

removeHabit: async (
  id
) => {

  try {

    await habitApi.archive(
      Number(id)
    );

    await get()
      .loadHabits();

    toast.success(
      "Habit removed"
    );

  } catch (err) {

    console.error(
      "REMOVE HABIT ERROR",
      err
    );
  }
},

archiveHabit: async (
  id
) => {

  try {

    await habitApi.archive(
      id
    );

    await get()
      .loadHabits();

  } catch (err) {

    console.error(
      err
    );
  }
},

  // =========================
  // LOAD BOARDS
  // =========================

  loadBoards: async () => {
    try {
      const data = await boardApi.getAll();

      set({
        boards: data.map((b: any) => ({
          id: String(b.id),

          name: b.name,

          emoji: b.emoji ?? "🚀",

          createdAt: Date.now(),
        })),
      });
    } catch (err) {
      console.error("LOAD BOARDS ERROR", err);
    }
  },

  // =========================
  // ADD BOARD
  // =========================

  addBoard: async (name, emoji) => {
    try {
      await boardApi.create({
        project_id: 1,

        name,

        emoji,

        position: get().boards.length,
      });

      await get().loadBoards();
      // =========================
      // SOUND EFFECT
      // =========================
      toast.success("Board added successfully");
      new Audio(
        "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
      ).play();
    } catch (err) {
      console.error("ADD BOARD ERROR", err);
    }
  },

  // =========================
  // SET TASKS
  // =========================

  setTasks: (tasks) =>
    set({
      tasks,
    }),

  // =========================
  // ACTIVE BOARD
  // =========================

  setActiveBoard: (id) =>
    set({
      activeBoardId: id,
    }),

  // =========================
  // ADD TASK
  // =========================

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
      // =========================
      // SOUND EFFECT
      // =========================
      toast.success("Task added successfully");
      new Audio(
        "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
      ).play();
      return data.task?.id ?? "";
    } catch (err) {
      console.error("ADD TASK ERROR", err);

      return "";
    }
  },

  // =========================
  // UPDATE TASK
  // =========================
updateTask: async (id, patch) => {
  try {

    // UPDATE UI DULU
    set({
      tasks: get().tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
            }
          : task,
      ),
    });

    await taskApi.update(id, {
      title: patch.title,
      description: patch.description,
      notes: patch.notes,
      column_key: patch.column,
      priority: patch.priority,
      tags: patch.tags,
      due_at: patch.dueAt
        ? new Date(patch.dueAt).toISOString()
        : null,
      reminder: patch.reminder,
      recurring: patch.recurring,
      completed_at: patch.completedAt
        ? new Date(patch.completedAt).toISOString()
        : null,
      position: patch.order,
    });

    toast.success("Task updated successfully");

    new Audio(
      "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
    ).play();

  } catch (err) {

    console.error("UPDATE TASK ERROR", err);

    await get().loadTasks();
  }
},

  // =========================
  // DELETE TASK
  // =========================
removeTask: async (id) => {

  const oldTasks = get().tasks;

  // HAPUS DARI UI DULU
  set({
    tasks: oldTasks.filter(
      (task) => task.id !== id
    ),
  });

  try {

    await taskApi.remove(id);

    toast.success(
      "Task deleted successfully"
    );

    new Audio(
      "https://public-assets.content-platform.envatousercontent.com/bb57cbaa-7c56-447b-a9ae-a6d964b90750/51a1b59a-e3e2-4e10-a68a-24ab89125826/preview.mp3",
    ).play();

  } catch (err) {

    console.error(
      "DELETE TASK ERROR",
      err,
    );

    // rollback kalau gagal
    set({
      tasks: oldTasks,
    });
  }
},

  // =========================
  // MOVE TASK
  // =========================

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

  // =========================
  // REORDER
  // =========================

  reorderInColumn: (boardId, column, ids) => {
    const tasks = get().tasks.map((t) =>
      t.boardId === boardId && t.column === column
        ? {
            ...t,

            order: ids.indexOf(t.id),
          }
        : t,
    );

    set({
      tasks,
    });
  },

  // =========================
  // SUBTASK
  // =========================

  toggleSubtask: (taskId, subId) => {
    const task = get().tasks.find((t) => t.id === taskId);

    if (!task) return;

    const subtask = task.subtasks.find((s) => s.id === subId);

    if (!subtask) return;

    const nextDone = !subtask.done;

    subtaskApi.toggle(subId, nextDone).catch((err) => {
      console.error("TOGGLE SUBTASK ERROR", err);
    });

    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,

              subtasks: t.subtasks.map((s) =>
                s.id === subId
                  ? {
                      ...s,
                      done: nextDone,
                    }
                  : s,
              ),
            }
          : t,
      ),
    });
  },

  // =========================
  // THEME
  // =========================

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";

      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", next === "light");
      }

      return {
        theme: next,
      };
    }),

  // =========================
  // TELEGRAM
  // =========================

  setTelegram: (patch) =>
    set((s) => ({
      telegram: {
        ...s.telegram,
        ...patch,
      },
    })),

  // =========================
  // STREAK
  // =========================
  bumpStreak: () =>
    set((s) => {
      const completedDays = Array.from(
        new Set(
          s.tasks

            .filter((t) => t.completedAt)

            .map((t) => {
              const d = new Date(t.completedAt!);

              d.setHours(0, 0, 0, 0);

              return d.getTime();
            }),
        ),
      )

        .sort((a, b) => b - a);

      if (completedDays.length === 0) {
        return {
          streak: {
            current: 0,

            lastDay: null,
          },
        };
      }

      let current = 1;

      for (let i = 0; i < completedDays.length - 1; i++) {
        const diff = completedDays[i] - completedDays[i + 1];

        if (diff === 86400000) {
          current++;
        } else {
          break;
        }
      }

      return {
        streak: {
          current,

          lastDay: new Date(completedDays[0]).toDateString(),
        },
      };
    }),

  // =========================
  // REMINDED
  // =========================

  markReminded: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              reminded: true,
            }
          : t,
      ),
    })),
}));
