/* eslint-disable prettier/prettier */
const API = "http://127.0.0.1:8000/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",

      ...(options?.headers || {}),
    },

    ...options,
  });

  if (!res.ok) {
    const text = await res.text();

    throw new Error(text || "API ERROR");
  }

  return res.json();
}

// =========================
// TASKS
// =========================

export const taskApi = {
  getAll: () => request("/tasks"),

  create: (payload: any) =>
    request("/tasks", {
      method: "POST",

      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: any) =>
    request(`/tasks/${id}`, {
      method: "PATCH",

      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request(`/tasks/${id}`, {
      method: "DELETE",
    }),
      // =========================
  // REORDER
  // =========================

  reorder: (
    tasks: {
      id: string;
      position: number;
    }[],
  ) =>
    request("/tasks/reorder", {
      method: "POST",

      body: JSON.stringify({
        tasks,
      }),
    }), 
};

// =========================
// SUBTASKS
// =========================

export const subtaskApi = {
  toggle: (id: string, done: boolean) =>
    request(`/subtasks/${id}`, {
      method: "PATCH",

      body: JSON.stringify({
        done,
      }),
    }),
};

// =========================
// TELEGRAM
// =========================

export const telegramApi = {
  get: () => request("/telegram-settings"),

  save: (payload: any) =>
    request("/telegram-settings", {
      method: "POST",

      body: JSON.stringify(payload),
    }),
};

// =========================
// ATTACHMENTS
// =========================

export const attachmentApi = {
  upload: (form: FormData) =>
    fetch("http://127.0.0.1:8000/api/attachments", {
      method: "POST",

      body: form,
    }).then((r) => r.json()),
};

// =========================
// SUBTASK CREATE
// =========================

export const subtaskCreateApi = {
  create: (payload: any) =>
    request("/subtasks", {
      method: "POST",

      body: JSON.stringify(payload),
    }),
};

// =========================
// BOARDS
// =========================

export const boardApi = {
  // =========================
  // GET ALL
  // =========================

  getAll: () => request("/boards"),

  // =========================
  // CREATE
  // =========================

  create: (payload: any) =>
    request("/boards", {
      method: "POST",

      body: JSON.stringify(payload),
    }),

  // =========================
  // UPDATE
  // =========================

  update: (id: string, payload: any) =>
    request(`/boards/${id}`, {
      method: "PATCH",

      body: JSON.stringify(payload),
    }),

  // =========================
  // DELETE
  // =========================

  remove: (id: string) =>
    request(`/boards/${id}`, {
      method: "DELETE",
    }),

   
};

// =========================
// HABITS
// =========================

export type HabitPayload = {
  title: string;

  description?: string;

  emoji?: string;

  color?: string;

  frequency?: "daily" | "weekly";

  target?: number;

  xp_per_completion?: number;

  archived?: boolean;
};

export const habitApi = {

  // =========================
  // GET ALL
  // =========================

  getAll: () =>
    request("/habits"),

  // =========================
  // CREATE
  // =========================

  create: (
    payload: HabitPayload
  ) =>
    request(
      "/habits",
      {
        method: "POST",

        body: JSON.stringify(
          payload
        ),
      }
    ),

  // =========================
  // UPDATE
  // =========================

  update: (
    id: number,
    payload: Partial<HabitPayload>
  ) =>
    request(
      `/habits/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          payload
        ),
      }
    ),

  // =========================
  // TOGGLE
  // =========================

  toggle: (
    id: number
  ) =>
    request(
      `/habits/${id}/toggle`,
      {
        method: "POST",
      }
    ),

// =========================
// ARCHIVE
// =========================

archive: (
  id: number
) =>
  request(
    `/habits/${id}/archive`,
    {
      method: "POST",
    }
  ),

// =========================
// DELETE
// =========================

remove: (
  id: number
) =>
  request(
    `/habits/${id}`,
    {
      method: "DELETE",
    }
  ),
};

// =========================
// JOURNALS
// =========================

export type JournalPayload = {

  title: string;

  content?: string;

  mood?:
    | "great"
    | "good"
    | "neutral"
    | "low"
    | "bad";

  tags?: string[];
};

export const journalApi = {

  // =========================
  // GET ALL
  // =========================

  getAll: () =>
    request(
      "/journals"
    ),

  // =========================
  // CREATE
  // =========================

  create: (
    payload: JournalPayload
  ) =>

    request(

      "/journals",

      {

        method: "POST",

        body: JSON.stringify(
          payload
        ),
      }
    ),

  // =========================
  // UPDATE
  // =========================

  update: (

    id: number,

    payload: Partial<JournalPayload>

  ) =>

    request(

      `/journals/${id}`,

      {

        method: "PATCH",

        body: JSON.stringify(
          payload
        ),
      }
    ),

  // =========================
  // DELETE
  // =========================

  remove: (
    id: number
  ) =>

    request(

      `/journals/${id}`,

      {
        method: "DELETE",
      }
    ),
};