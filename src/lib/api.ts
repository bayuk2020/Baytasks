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
// SUBTASKS (REVISI AMAN: DIJADIKAN SATU RUMAH)
// =========================
export const subtaskApi = {
  // Fungsi 1: Buat nyentang done / undone
  toggle: (id: string, done: boolean) =>
    request(`/subtasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        done,
      }),
    }),

  // Fungsi 2: Buat nge-delete subtask (Buka kunci yang ini 🔑)
  remove: (id: string) => 
    request(`/subtasks/${id}`, {
      method: "DELETE",
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
// =========================
  // REORDER (TAMBAHIN INI COK 👇)
  // =========================
  reorder: (payload: { boards: { id: string; position: number }[] }) =>
    request("/boards/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
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
// =========================
// READING VAULT
// =========================

export const bookApi = {

  getAll: () =>
    request("/books"),

  create: (
    payload: any
  ) =>
    request("/books", {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
    }),

  update: (
    id: string,
    payload: any
  ) =>
    request(
      `/books/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(
          payload
        ),
      }
    ),

  remove: (
    id: string
  ) =>
    request(
      `/books/${id}`,
      {
        method: "DELETE",
      }
    ),

  updateProgress: (
    id: string,
    currentPage: number
  ) =>
    request(
      `/books/${id}/progress`,
      {
        method: "POST",

        body: JSON.stringify({
          current_page:
            currentPage,
        }),
      }
    ),

  // =========================
  // UPLOAD COVER
  // =========================

  uploadCover: async (
    file: File
  ) => {

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const res =
      await fetch(
        `${API}/books/upload-cover`,
        {

          method: "POST",

          body:
            formData,
        }
      );

    return res.json();
  },

  // =========================
  // UPLOAD PDF
  // =========================

  uploadPdf: async (
    file: File
  ) => {

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const res =
      await fetch(
        `${API}/books/upload-pdf`,
        {

          method: "POST",

          body:
            formData,
        }
      );

    return res.json();
  },
};

// =========================
// Book Note API
// =========================

export const bookNoteApi = {
  create: (payload: any) =>
    request("/book-notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (
    id: string,
    payload: any
  ) =>
    request(`/book-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request(`/book-notes/${id}`, {
      method: "DELETE",
    }),
};

/* eslint-disable prettier/prettier */

// Helper untuk menerjemahkan string area dari Lovable menjadi area_id integer di MySQL kamu
const mapLifeAreaToId = (areaStr: string): number => {
  const mapping: Record<string, number> = {
    finance: 1,
    career: 2,
    health: 3,
    relationship: 4,
    learning: 5,
    spiritual: 6,
    business: 7
  };
  return mapping[String(areaStr).toLowerCase()] || 2; // Default fallback ke Career (ID: 2)
};

export const goalApi = {
  // 1. Ambil semua data target
  getAll: () => request("/goals"),

  // 2. Buat target baru (Translasi dari UI Lovable -> MySQL)
  create: (payload: any) => {
    const dbPayload = {
      user_id: payload.user_id || 1, // Fallback user default
      area_id: mapLifeAreaToId(payload.lifeArea || payload.area_id),
      title: payload.title || payload.name || "Target Tanpa Judul",
      description: payload.description || payload.notes || null,
      target_amount: payload.target_amount !== undefined ? payload.target_amount : (payload.targetValue || 0),
      current_amount: payload.current_amount !== undefined ? payload.current_amount : (payload.currentValue || 0),
      due_date: payload.targetDate ? new Date(payload.targetDate).toISOString().split('T')[0] : (payload.due_date || null),
      completed: payload.status === "completed" || payload.completed ? 1 : 0,
      progress_percent: payload.progress_percent || 0
    };

    return request("/goals", {
      method: "POST",
      body: JSON.stringify(dbPayload),
    });
  },

  // 3. Update target (Translasi dinamis untuk patch update)
  update: (id: string | number, payload: any) => {
    const dbPayload: any = {};
    if (payload.title !== undefined || payload.name !== undefined) dbPayload.title = payload.title || payload.name;
    if (payload.description !== undefined) dbPayload.description = payload.description;
    if (payload.lifeArea !== undefined) dbPayload.area_id = mapLifeAreaToId(payload.lifeArea);
    if (payload.targetValue !== undefined || payload.target_amount !== undefined) dbPayload.target_amount = payload.targetValue !== undefined ? payload.targetValue : payload.target_amount;
    if (payload.currentValue !== undefined || payload.current_amount !== undefined) dbPayload.current_amount = payload.currentValue !== undefined ? payload.currentValue : payload.current_amount;
    if (payload.targetDate !== undefined || payload.due_date !== undefined) dbPayload.due_date = payload.targetDate ? new Date(payload.targetDate).toISOString().split('T')[0] : payload.due_date;
    if (payload.status !== undefined) dbPayload.completed = payload.status === "completed" ? 1 : 0;
    if (payload.progress_percent !== undefined) dbPayload.progress_percent = payload.progress_percent;
    if (payload.completed !== undefined) dbPayload.completed = payload.completed ? 1 : 0;

    // 🌟 FIX UTAMA: Loloskan dan petakan array tautan links agar terkirim dalam HTTP Request Body ke Laravel
    if (payload.links !== undefined && Array.isArray(payload.links)) {
      dbPayload.links = payload.links.map((l: any) => ({
        type: l.type, 
        refId: String(l.refId || l.id) // Normalisasi ID string untuk dibaca morphMap Eloquent
      }));
    }

    return request(`/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dbPayload),
    });
  },

  // 4. Hapus target
  remove: (id: string | number) =>
    request(`/goals/${id}`, {
      method: "DELETE",
    }),

  // =========================
  // SUB-MODUL MILESTONES
  // =========================
  createMilestone: (payload: any) => {
    const dbPayload = {
      goal_id: payload.goal_id || payload.goalId,
      name: payload.name || payload.title || "Tahapan Baru",
      target_value: payload.target_value !== undefined ? payload.target_value : (payload.targetValue || 0),
      current_value: payload.current_value !== undefined ? payload.current_value : (payload.currentValue || 0),
      due_date: payload.dueAt ? new Date(payload.dueAt).toISOString().split('T')[0] : (payload.due_date || null),
      weight: payload.weight || 1,
      completed: payload.completed ? 1 : 0
    };

    return request("/milestones", {
      method: "POST",
      body: JSON.stringify(dbPayload),
    });
  },

  updateMilestone: (id: string | number, payload: any) => {
    const dbPayload: any = {};
    if (payload.name !== undefined || payload.title !== undefined) dbPayload.name = payload.name || payload.title;
    if (payload.targetValue !== undefined || payload.target_value !== undefined) dbPayload.target_value = payload.targetValue !== undefined ? payload.targetValue : payload.target_value;
    if (payload.currentValue !== undefined || payload.current_value !== undefined) dbPayload.current_value = payload.currentValue !== undefined ? payload.currentValue : payload.current_value;
    if (payload.dueAt !== undefined || payload.due_date !== undefined) dbPayload.due_date = payload.dueAt ? new Date(payload.dueAt).toISOString().split('T')[0] : payload.due_date;
    if (payload.completed !== undefined) dbPayload.completed = payload.completed ? 1 : 0;
    if (payload.weight !== undefined) dbPayload.weight = payload.weight;

    return request(`/milestones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dbPayload),
    });
  },

  removeMilestone: (id: string | number) =>
    request(`/milestones/${id}`, {
      method: "DELETE",
    }),

  // =========================
  // SUB-MODUL QUARTERLY PLANS
  // =========================
  createQuarterlyPlan: (payload: any) => {
    const dbPayload = {
      goal_id: payload.goal_id || payload.goalId,
      quarter: payload.quarter,
      year: payload.year,
      target_amount: payload.target !== undefined ? payload.target : (payload.target_amount || 0),
      current_amount: payload.current !== undefined ? payload.current : (payload.current_amount || 0),
      completed: payload.completed ? 1 : 0
    };

    return request("/quarterly-plans", {
      method: "POST",
      body: JSON.stringify(dbPayload),
    });
  },

  updateQuarterlyPlan: (id: string | number, payload: any) => {
    const dbPayload: any = {};
    if (payload.target !== undefined || payload.target_amount !== undefined) dbPayload.target_amount = payload.target !== undefined ? payload.target : payload.target_amount;
    if (payload.current !== undefined || payload.current_amount !== undefined) dbPayload.current_amount = payload.current !== undefined ? payload.current : payload.current_amount;
    if (payload.completed !== undefined) dbPayload.completed = payload.completed ? 1 : 0;

    return request(`/quarterly-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dbPayload),
    });
  }
};