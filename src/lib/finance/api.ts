/* eslint-disable prettier/prettier */
const API = "https://api.kabyra.my.id/api";

// Origin di balik Cloudflare Tunnel sesekali membalas 502/503/504 atau menggantung.
// Tanpa timeout, fetch() browser menunggu tanpa batas — itulah kenapa modul Finance
// bisa "loading" selamanya tanpa pesan error apa pun. Batas waktu + retry membuat
// kegagalan sesaat pulih sendiri, dan kegagalan nyata muncul sebagai error, bukan spinner.
const REQUEST_TIMEOUT_MS = 20_000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Error yang membawa status HTTP supaya pemanggil bisa membedakan 422 dari 502. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => "");

  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    const validationMessage = parsed.errors ? Object.values(parsed.errors).flat()[0] : undefined;
    return new ApiError(validationMessage || parsed.message || `API ERROR (${res.status})`, res.status);
  } catch {
    // Body bukan JSON — biasanya halaman error HTML dari Cloudflare/Apache.
    // Jangan tumpahkan HTML-nya ke toast; cukup status yang bisa dibaca manusia.
    const fallback =
      res.status === 502 || res.status === 503 || res.status === 504
        ? "Server API sedang tidak merespons. Coba lagi sebentar."
        : `API ERROR (${res.status})`;
    return new ApiError(text && text.length < 200 ? text : fallback, res.status);
  }
}

async function request(endpoint: string, options?: RequestInit) {
  const method = (options?.method || "GET").toUpperCase();
  // Hanya request baca yang di-retry otomatis. POST/PATCH/DELETE tidak idempoten,
  // mengulangnya berisiko membuat data ganda.
  const retries = method === "GET" ? MAX_RETRIES : 0;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      });

      if (!res.ok) {
        const error = await readError(res);
        if (attempt < retries && RETRYABLE_STATUS.has(res.status)) {
          lastError = error;
          await sleep(400 * 2 ** attempt);
          continue;
        }
        throw error;
      }

      return await res.json();
    } catch (error) {
      // Error aplikasi (4xx/validasi) jangan di-retry — langsung lempar.
      if (error instanceof ApiError && !RETRYABLE_STATUS.has(error.status ?? 0)) {
        throw error;
      }

      lastError = error;

      const isAbort = error instanceof DOMException && error.name === "AbortError";
      if (attempt >= retries) {
        if (isAbort) {
          throw new ApiError(`Request ke ${endpoint} timeout setelah ${REQUEST_TIMEOUT_MS / 1000}s.`);
        }
        throw error instanceof Error ? error : new ApiError("API ERROR");
      }

      await sleep(400 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("API ERROR");
}

function transactionPayload(payload: any) {
  // Ambil tanggal lokal tanpa peduli UTC Greenwich
  const localDate = new Date(payload.transactionDate);
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, "0");
  const d = String(localDate.getDate()).padStart(2, "0");

  return {
    ...payload,
    transactionDate: `${y}-${m}-${d}`, // Format murni YYYY-MM-DD lokal WIB
  };
}

// Backend controller Budget/Debt/Trade masih baca $request->snake_case langsung
// (bukan FormRequest camelCase seperti Transaction/Contact), jadi payload dari
// FormModal (camelCase) wajib dikonversi dulu di sini sebelum dikirim.
function toDateString(value: number | string | undefined | null) {
  if (!value) return undefined;
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function budgetPayload(payload: any) {
  return {
    category: payload.category,
    monthly_limit: payload.monthlyLimit,
    notes: payload.notes,
  };
}

function debtPayload(payload: any) {
  return {
    creditor: payload.creditor,
    total_debt: payload.totalDebt,
    remaining_debt: payload.remainingDebt,
    monthly_payment: payload.monthlyPayment,
    due_date: toDateString(payload.dueDate),
    notes: payload.notes,
    status: payload.status,
  };
}

function debtPaymentPayload(payload: any) {
  return {
    account_id: payload.accountId,
    amount: payload.amount,
    paid_at: toDateString(payload.paidAt),
    notes: payload.notes,
  };
}

function tradePayload(payload: any) {
  return {
    account_id: payload.accountId,
    symbol: payload.symbol,
    side: payload.side,
    quantity: payload.quantity,
    entry_price: payload.entryPrice,
    exit_price: payload.exitPrice,
    fees: payload.fees,
    status: payload.status,
    opened_at: toDateString(payload.openedAt),
    closed_at: toDateString(payload.closedAt),
    notes: payload.notes,
  };
}

export const accountApi = {
  getAll: () => request("/finance/accounts"),
  create: (payload: any) =>
    request("/finance/accounts", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    request(`/finance/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/accounts/${id}`, { method: "DELETE" }),
};

export const transactionApi = {
  getAll: (page: number = 1) => request(`/finance/transactions?page=${page}`),
  // Seluruh riwayat dalam SATU request. Menggantikan pola lama yang menembak
  // ~23 request paginasi sekaligus ke origin yang hanya melayani satu request
  // pada satu waktu (`php artisan serve`), jadi semuanya mengantre berurutan.
  getAllBulk: () => request(`/finance/transactions?all=1`),
  create: (payload: any) =>
    request("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(transactionPayload(payload)),
    }),
  update: (id: string, payload: any) =>
    request(`/finance/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(transactionPayload(payload)),
    }),
  remove: (id: string) => request(`/finance/transactions/${id}`, { method: "DELETE" }),
};

export const incomeSourceApi = {
  getAll: () => request("/finance/income-sources"),

  create: (payload: any) =>
    request("/finance/income-sources", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: any) =>
    request(`/finance/income-sources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request(`/finance/income-sources/${id}`, {
      method: "DELETE",
    }),
};

export const contactApi = {
  getAll: (params?: { search?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/finance/contacts${suffix}`);
  },
  get: (id: string) => request(`/finance/contacts/${id}`),
  create: (payload: any) =>
    request("/finance/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: any) =>
    request(`/finance/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request(`/finance/contacts/${id}`, {
      method: "DELETE",
    }),
  transactions: (id: string, params?: { type?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/finance/contacts/${id}/transactions${suffix}`);
  },
  analytics: (params?: { from?: string; to?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/finance/contacts/analytics${suffix}`);
  },
};

export const categoryApi = {
  getAll: () => request("/finance/categories"),
};

export const budgetApi = {
  getAll: () => request("/finance/budgets"),
  create: (payload: any) =>
    request("/finance/budgets", { method: "POST", body: JSON.stringify(budgetPayload(payload)) }),
  update: (id: string, payload: any) =>
    request(`/finance/budgets/${id}`, { method: "PATCH", body: JSON.stringify(budgetPayload(payload)) }),
  remove: (id: string) => request(`/finance/budgets/${id}`, { method: "DELETE" }),
};

export const debtApi = {
  getAll: () => request("/finance/debts"),
  create: (payload: any) =>
    request("/finance/debts", { method: "POST", body: JSON.stringify(debtPayload(payload)) }),
  update: (id: string, payload: any) =>
    request(`/finance/debts/${id}`, { method: "PATCH", body: JSON.stringify(debtPayload(payload)) }),
  remove: (id: string) => request(`/finance/debts/${id}`, { method: "DELETE" }),
  pay: (id: string, payload: any) =>
    request(`/finance/debts/${id}/payments`, { method: "POST", body: JSON.stringify(debtPaymentPayload(payload)) }),
};

export const tradeApi = {
  getAll: () => request("/finance/trades"),
  create: (payload: any) =>
    request("/finance/trades", { method: "POST", body: JSON.stringify(tradePayload(payload)) }),
  update: (id: string, payload: any) =>
    request(`/finance/trades/${id}`, { method: "PATCH", body: JSON.stringify(tradePayload(payload)) }),
  remove: (id: string) => request(`/finance/trades/${id}`, { method: "DELETE" }),
};

// =========================
// ANALYTICS ISOLATED PIPE
// =========================
export const analyticsApi = {
  getRawData: (filters: { tahun: string; bulan: string; tanggal: string; account_id: string; contact_id: string }) => {
    const q = new URLSearchParams();
    q.set("tahun", filters.tahun);
    q.set("bulan", filters.bulan);
    if (filters.tanggal) q.set("tanggal", filters.tanggal);
    q.set("account_id", filters.account_id);
    q.set("contact_id", filters.contact_id);
    
    return request(`/finance/analytics-data?${q.toString()}`);
  },
};