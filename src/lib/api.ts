/* eslint-disable prettier/prettier */
const API = "https://api.kabyra.my.id/api";

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

  // Fungsi 3: Ganti judul subtask (dipakai edit dobel-klik di TaskModal)
  updateTitle: (id: string, title: string) =>
    request(`/subtasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
};

// =========================
// TELEGRAM
// =========================

export const telegramApi = {
  get: () => request("/telegram-settings"),

  /**
   * PERINGATAN: endpoint ini MENGIRIM pesan "Koneksi BayTasks Berhasil!" ke
   * Telegram setiap kali dipanggil (lihat TelegramSettingController@save).
   * Jangan dipakai untuk simpan-otomatis — halaman Setting memakai
   * appSettingApi.save() yang tidak punya efek samping itu.
   */
  save: (payload: any) =>
    request("/telegram-settings", {
      method: "POST",

      body: JSON.stringify(payload),
    }),
};

// =========================
// APP SETTINGS (halaman Setting)
// =========================

export type AppSettingItem = {
  key: string;
  value: boolean | number | string;
  type: "bool" | "int" | "time" | "string";
  default: boolean | number | string;
  label: string;
  group: string;
};

export type StatusPengirim = {
  key: string;
  label: string;
  enabled: boolean;
  time: string | null;
  last_sent_at: string | null;
  akan_terkirim: boolean;
  alasan: string;
  tertinggal: boolean;
};

export type KeadaanTidur = {
  active: boolean;
  since: string | null;
  auto_wake_at: string;
  wake_time: string | null;
};

export type AppSettingsResponse = {
  settings: AppSettingItem[];
  telegram: { chat_id: string; enabled: boolean };
  sleep: KeadaanTidur;
  status: StatusPengirim[];
};

export const appSettingApi = {
  get: (): Promise<AppSettingsResponse> => request("/app-settings"),

  save: (payload: {
    settings?: Record<string, boolean | number | string>;
    telegram?: { chat_id?: string; enabled?: boolean };
  }) =>
    request("/app-settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  sleep: (active: boolean) =>
    request("/app-settings/sleep", {
      method: "POST",
      body: JSON.stringify({ active }),
    }),

  // jenis: "morning-brief" | "nightly-summary" | "test"
  sendNow: (jenis: string) =>
    request(`/app-settings/send/${jenis}`, { method: "POST" }),

  /** Kirim ulang satu reminder habit (yang akan datang, atau yang terlewat). */
  testReminder: () =>
    request("/app-settings/test-reminder", { method: "POST" }),

  koneksi: (): Promise<{ koneksi: BarisKoneksi[]; diperiksa: string }> =>
    request("/app-settings/koneksi"),
};

export type BarisKoneksi = {
  nama: string;
  sehat: boolean;
  catatan: string;
};

/**
 * Mengukur domain publik DARI BROWSER, bukan dari server.
 *
 * Server tidak boleh memeriksa alamat publiknya sendiri: `php artisan serve`
 * melayani satu permintaan pada satu waktu, jadi panggilan yang keluar lewat
 * tunnel lalu kembali ke proses yang sama akan saling tunggu sampai batas
 * waktu habis — tunnel sehat pun dilaporkan mati. Browser tidak punya
 * masalah itu, dan yang diukurnya justru jalur yang benar-benar dipakai.
 */
export async function periksaDomainDariBrowser(): Promise<BarisKoneksi> {
  const mulai = performance.now();

  try {
    const res = await fetch(`${API}/boards`, { cache: "no-store" });
    const ms = Math.round(performance.now() - mulai);

    return res.ok
      ? { nama: "Domain publik", sehat: true, catatan: `${API} menjawab HTTP ${res.status} dalam ${ms} ms.` }
      : { nama: "Domain publik", sehat: false, catatan: `${API} menjawab HTTP ${res.status}.` };
  } catch (err) {
    return {
      nama: "Domain publik",
      sehat: false,
      catatan: `${API} tidak terjangkau: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

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

// =========================
// Book Bookmark API (penanda halaman)
// =========================

export type BookBookmark = {
  id: number;
  book_id: number;
  page_number: number;
  label: string | null;
  color: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Alamat berkas PDF sebuah buku.
 *
 * SENGAJA lewat rute API, bukan `books.file_path` yang menunjuk ke
 * /storage/... langsung: berkas di /storage disajikan tanpa melewati Laravel,
 * jadi tidak punya header CORS. <iframe> tidak peduli, tapi pdf.js yang
 * mengambilnya dengan fetch dari domain berbeda akan ditolak browser.
 */
export const bookFileUrl = (bookId: string | number) => `${API}/books/${bookId}/file`;

export const bookmarkApi = {
  list: (bookId: string | number): Promise<{ bookmarks: BookBookmark[] }> =>
    request(`/books/${bookId}/bookmarks`),

  /**
   * Satu alamat untuk menandai DAN melepas penanda: server yang memutuskan,
   * berdasarkan ada tidaknya penanda di halaman itu. Jawabannya memuat
   * `action` ("ditambah" / "dihapus") supaya UI tahu pesan apa yang pantas.
   */
  toggle: (
    bookId: string | number,
    payload: { page_number: number; label?: string | null; color?: string | null },
  ): Promise<{ success: boolean; action: "ditambah" | "dihapus"; bookmark: BookBookmark | null }> =>
    request(`/books/${bookId}/bookmarks/toggle`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: { label?: string | null; color?: string | null }) =>
    request(`/book-bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    request(`/book-bookmarks/${id}`, {
      method: "DELETE",
    }),
};

// =========================
// AI WEB CHAT (widget FloatingAiChat)
// =========================

export interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatResponse {
  success: boolean;
  reply: string;
  provider?: string | null;
}

export const aiApi = {
  chat: (payload: { message: string; history?: AiChatTurn[] }): Promise<AiChatResponse> =>
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// =========================
// POMODORO (rekaman tiap segmen fokus / istirahat)
// =========================

export type PomodoroMode = "focus" | "short" | "long";

export interface PomodoroSession {
  id: number;
  mode: PomodoroMode;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  completed: boolean;
  running: boolean;
}

export interface PomodoroToday {
  date: string;
  focusSeconds: number;
  shortBreakSeconds: number;
  longBreakSeconds: number;
  sessionCount: number;
}

export interface PomodoroStatRow {
  date: string;
  tasksAdded: number;
  tasksCompleted: number;
  focusSeconds: number;
  shortBreakSeconds: number;
  longBreakSeconds: number;
  score: number;
}

export const pomodoroApi = {
  record: (payload: {
    mode: PomodoroMode;
    startedAt: string;
    endedAt: string;
    completed?: boolean;
  }): Promise<{ success: boolean; skipped?: boolean; session?: PomodoroSession }> =>
    request("/pomodoro/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  today: (): Promise<PomodoroToday> => request("/pomodoro/today"),

  /** Sesi yang sedang berjalan di server (bisa dimulai dari web, Telegram, atau chat AI). */
  active: (): Promise<{ active: PomodoroSession | null; serverTime: string }> =>
    request("/pomodoro/active"),

  start: (mode: PomodoroMode): Promise<{ success: boolean; session: PomodoroSession }> =>
    request("/pomodoro/start", {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),

  stop: (): Promise<{ success: boolean; session?: PomodoroSession }> =>
    request("/pomodoro/stop", { method: "POST" }),

  sessions: (params?: { date?: string }): Promise<{ date: string; sessions: PomodoroSession[] }> => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/pomodoro/sessions${suffix}`);
  },

  stats: (days = 14): Promise<{ days: number; rows: PomodoroStatRow[] }> =>
    request(`/pomodoro/stats?days=${days}`),
};

// =========================
// ANALYTICS (rekap lintas modul + saran AI)
// =========================

export interface AnalyticsDailyRow {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  focusSeconds: number;
  focusMinutes: number;
  shortBreakSeconds: number;
  longBreakSeconds: number;
  habitsCompleted: number;
  journalEntries: number;
  income: number;
  expense: number;
  score: number;
}

export interface AnalyticsOverview {
  range: { days: number; from: string; to: string };
  daily: AnalyticsDailyRow[];
  tasks: {
    createdInRange: number;
    completedInRange: number;
    openTotal: number;
    overdue: number;
    completionRate: number;
    avgCompletionHours: number | null;
    byPriority: { low: number; med: number; high: number; urgent: number };
    byColumn: Record<string, number>;
    byBoard: { board: string; total: number; done: number }[];
  };
  focus: {
    focusSeconds: number;
    shortBreakSeconds: number;
    longBreakSeconds: number;
    sessionCount: number;
    activeDays: number;
    avgPerActiveDaySeconds: number;
    avgPerDaySeconds: number;
    focusRatio: number;
    bestDay: { date: string; seconds: number } | null;
  };
  habits: {
    activeCount: number;
    completionsInRange: number;
    possible: number;
    overallConsistency: number;
    breakdown: { title: string; completed: number; consistency: number }[];
  };
  finance: {
    income: number;
    expense: number;
    cashflow: number;
    transactionCount: number;
    savingRate: number;
    topExpenseCategories: { category: string; total: number }[];
  };
  journal: { entries: number; byMood: Record<string, number> };
  reading: { total: number; reading: number; completed: number; wishlist: number; pagesRead: number };
  goals: { total: number; completed: number; avgProgress: number };
}

export interface AnalyticsAdvice {
  success: boolean;
  provider?: string | null;
  days?: number;
  modules?: Record<string, string>;
  summary?: string;
  nextSteps?: string[];
  generatedAt?: string;
  message?: string;
}

export const analyticsApi = {
  overview: (days = 30): Promise<AnalyticsOverview> =>
    request(`/analytics/overview?days=${days}`),

  advice: (days = 30): Promise<AnalyticsAdvice> =>
    request("/analytics/advice", {
      method: "POST",
      body: JSON.stringify({ days }),
    }),
};

// =========================
// MEMORIES (Log aktivitas dari bot Telegram / AI)
// =========================

export interface Memory {
  id: number;
  type: string;
  source: string;
  title: string;
  content: string;
  tags: string[] | null;
  occurredAt: number | null;
}

export const memoryApi = {
  getAll: (params?: { date?: string }): Promise<Memory[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/memories${suffix}`);
  },
};

// =========================
// MIND MAP (pohon topik & task, opsional tertaut ke task papan)
// =========================

export type MindMapNodeType = "topic" | "task";

export interface MindMapNode {
  id: number;
  parentId: number | null;
  type: MindMapNodeType;
  title: string;
  done: boolean;
  collapsed: boolean;
  position: number;
  taskId: number | null;
  linkedTask: { id: number; title: string; column: string; boardId: number } | null;
  children: MindMapNode[];
}

export interface MindMapSummary {
  id: number;
  title: string;
  description: string | null;
  nodeCount: number;
  updatedAt: number | null;
}

export interface MindMapDetail {
  id: number;
  title: string;
  description: string | null;
  updatedAt: number | null;
  nodes: MindMapNode[];
}

export const mindMapApi = {
  list: (): Promise<MindMapSummary[]> => request("/mind-maps"),

  create: (payload: { title: string; description?: string }): Promise<MindMapDetail> =>
    request("/mind-maps", { method: "POST", body: JSON.stringify(payload) }),

  get: (id: number): Promise<MindMapDetail> => request(`/mind-maps/${id}`),

  update: (id: number, payload: { title?: string; description?: string }): Promise<MindMapDetail> =>
    request(`/mind-maps/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  remove: (id: number) => request(`/mind-maps/${id}`, { method: "DELETE" }),

  addNode: (payload: {
    mind_map_id: number;
    parent_id?: number | null;
    type: MindMapNodeType;
    title: string;
  }): Promise<{ success: boolean; node: MindMapNode }> =>
    request("/mind-map-nodes", { method: "POST", body: JSON.stringify(payload) }),

  updateNode: (
    id: number,
    payload: { title?: string; done?: boolean; collapsed?: boolean; type?: MindMapNodeType },
  ): Promise<{ success: boolean; node: MindMapNode }> =>
    request(`/mind-map-nodes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  removeNode: (id: number) => request(`/mind-map-nodes/${id}`, { method: "DELETE" }),

  /**
   * Pindahkan node (drag & drop). `position` = indeks 0-based di antara calon
   * saudaranya SETELAH node ini dikeluarkan dari posisi lamanya.
   */
  moveNode: (
    id: number,
    payload: { parent_id: number | null; position?: number },
  ): Promise<{ success: boolean; node: MindMapNode }> =>
    request(`/mind-map-nodes/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /** Tautkan ke task papan yang ada (task_id) ATAU buat task baru (board_id). */
  linkNode: (
    id: number,
    payload: { task_id?: number; board_id?: string | number },
  ): Promise<{ success: boolean; node: MindMapNode }> =>
    request(`/mind-map-nodes/${id}/link`, { method: "POST", body: JSON.stringify(payload) }),

  unlinkNode: (id: number): Promise<{ success: boolean; node: MindMapNode }> =>
    request(`/mind-map-nodes/${id}/link`, { method: "DELETE" }),
};

// =========================
// ACTIVITY LOG (timeline Task/Subtask lintas board -- seksi Calendar)
// =========================

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

/**
 * Satu baris di tabel "Activity Log" halaman Calendar = satu TASK yang pernah
 * dibuat (bukan baris audit trail). Task ber-`hidden` tetap ikut dikirim --
 * `hidden` cuma menyembunyikan dari papan Kanban.
 */
export interface ActivityTask {
  id: number;
  title: string;
  description: string | null;
  notes: string | null;
  boardId: number;
  boardName: string;
  boardEmoji: string | null;
  column: TaskStatus;
  priority: "low" | "med" | "high" | "urgent";
  hidden: boolean;
  createdAt: number | null;
  dueAt: number | null;
  completedAt: number | null;
  subtaskTotal: number;
  subtaskDone: number;
  subtasks: { id: number; title: string; done: boolean }[];
  attachments: { id: number; name: string; url: string }[];
}

export interface ActivityLogResponse {
  from: string;
  to: string;
  statuses: TaskStatus[];
  count: number;
  tasks: ActivityTask[];
}

export const activityLogApi = {
  /** Rentang mengacu ke TANGGAL TASK DIBUAT (bukan deadline). */
  list: (params: {
    from?: string;
    to?: string;
    statuses?: TaskStatus[];
  }): Promise<ActivityLogResponse> => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.statuses?.length) query.set("status", params.statuses.join(","));
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/activity-log${suffix}`);
  },
};

// =========================
// STORY (Personal Facebook Feed)
// =========================

export interface Story {
  id: number;
  imagePath: string | null;
  imageUrl: string | null;
  caption: string | null;
  createdAt: number;
}

export const storyApi = {
  getAll: (): Promise<Story[]> => request("/stories"),

  create: async (payload: { caption?: string; image?: File }): Promise<Story> => {
    const formData = new FormData();
    if (payload.caption) formData.append("caption", payload.caption);
    if (payload.image) formData.append("image", payload.image);

    const res = await fetch(`${API}/stories`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "API ERROR");
    }

    return res.json();
  },

  remove: (id: number) =>
    request(`/stories/${id}`, {
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

  /**
   * Simpan urutan baru hasil drag & drop.
   *
   * Seluruh daftar satu goal dikirim sekaligus, bukan satu PATCH per baris:
   * memindahkan satu tahapan menggeser posisi semua tahapan di bawahnya, jadi
   * kalau dikirim satu-satu dan ada yang gagal di tengah, urutan di layar dan
   * di database bisa berbeda. Backend menyimpannya dalam satu transaksi.
   */
  reorderMilestones: (goalId: string | number, ids: (string | number)[]) =>
    request("/milestones/reorder", {
      method: "POST",
      body: JSON.stringify({
        goal_id: Number(goalId),
        ids: ids.map((id) => Number(id)),
      }),
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