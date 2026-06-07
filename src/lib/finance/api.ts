const API = "http://127.0.0.1:8000/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const error = JSON.parse(text) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      const validationMessage = error.errors ? Object.values(error.errors).flat()[0] : undefined;
      throw new Error(validationMessage || error.message || "API ERROR");
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(text || "API ERROR");
      }
      throw error;
    }
  }
  return res.json();
}

function transactionPayload(payload: any) {
  return {
    ...payload,
    transactionDate: new Date(payload.transactionDate).toISOString().slice(0, 10),
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

export const budgetApi = {
  getAll: () => request("/finance/budgets"),
  create: (payload: any) =>
    request("/finance/budgets", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    request(`/finance/budgets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/budgets/${id}`, { method: "DELETE" }),
};

export const debtApi = {
  getAll: () => request("/finance/debts"),
  create: (payload: any) =>
    request("/finance/debts", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    request(`/finance/debts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/debts/${id}`, { method: "DELETE" }),
  pay: (id: string, payload: any) =>
    request(`/finance/debts/${id}/payments`, { method: "POST", body: JSON.stringify(payload) }),
};

export const tradeApi = {
  getAll: () => request("/finance/trades"),
  create: (payload: any) =>
    request("/finance/trades", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    request(`/finance/trades/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/trades/${id}`, { method: "DELETE" }),
};
