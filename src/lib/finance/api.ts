/* eslint-disable prettier/prettier */
/**
 * Finance Hub — backend stub.
 *
 * Mirrors the request() pattern used in BayTasks `src/lib/api.ts`.
 * Wire these endpoints to your Laravel backend when ready. The Zustand
 * store in ./store.ts works fully offline via localStorage in the meantime.
 */
const API = "http://127.0.0.1:8000/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API ERROR");
  }
  return res.json();
}

export const accountApi = {
  getAll: () => request("/finance/accounts"),
  create: (payload: any) => request("/finance/accounts", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request(`/finance/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/accounts/${id}`, { method: "DELETE" }),
};

export const transactionApi = {
  getAll: () => request("/finance/transactions"),
  create: (payload: any) => request("/finance/transactions", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request(`/finance/transactions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/transactions/${id}`, { method: "DELETE" }),
};

export const incomeSourceApi = {
  getAll: () => request("/finance/income-sources"),
  create: (payload: any) => request("/finance/income-sources", { method: "POST", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/income-sources/${id}`, { method: "DELETE" }),
};

export const budgetApi = {
  getAll: () => request("/finance/budgets"),
  create: (payload: any) => request("/finance/budgets", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request(`/finance/budgets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/budgets/${id}`, { method: "DELETE" }),
};

export const debtApi = {
  getAll: () => request("/finance/debts"),
  create: (payload: any) => request("/finance/debts", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request(`/finance/debts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/debts/${id}`, { method: "DELETE" }),
  pay: (id: string, payload: any) => request(`/finance/debts/${id}/payments`, { method: "POST", body: JSON.stringify(payload) }),
};

export const tradeApi = {
  getAll: () => request("/finance/trades"),
  create: (payload: any) => request("/finance/trades", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request(`/finance/trades/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request(`/finance/trades/${id}`, { method: "DELETE" }),
};
