/* eslint-disable prettier/prettier */
import { create } from "zustand";
import {
  accountApi,
  transactionApi,
  incomeSourceApi,
  contactApi,
  budgetApi,
  debtApi,
  tradeApi,
} from "@/lib/finance/api";

/* ---------------- Tipe Data ---------------- */
export type AccountType = "bank" | "ewallet" | "cash" | "trading";
export type TransactionType = "income" | "expense" | "transfer";
export type DebtStatus = "active" | "paid" | "overdue";
export type TradeSide = "buy" | "sell";
export type TradeStatus = "open" | "closed";
export type ContactType = "person" | "family" | "employee" | "vendor" | "customer" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone?: string;
  notes?: string;
  transactionCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  transactionDate: number;
  incomeSourceId?: string;
  contactId?: string;
  transferGroupId?: string;
  toAccountId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Debt {
  id: string;
  creditor: string;
  totalDebt: number;
  remainingDebt: number;
  monthlyPayment: number;
  dueDate?: number;
  notes?: string;
  status: DebtStatus;
  createdAt: number;
  updatedAt: number;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paidAt: number;
  accountId?: string;
  notes?: string;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  fees?: number;
  status: TradeStatus;
  openedAt: number;
  closedAt?: number;
  notes?: string;
}

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; color: string }> = {
  bank: { label: "Bank", color: "oklch(0.72 0.16 230)" },
  ewallet: { label: "E-Wallet", color: "oklch(0.75 0.18 160)" },
  cash: { label: "Cash", color: "oklch(0.80 0.14 80)" },
  trading: { label: "Trading", color: "oklch(0.72 0.22 300)" },
};

interface FinanceState {
  loadAccounts: () => Promise<void>;
  loadTransactions: (page?: number) => Promise<void>;
  loadIncomeSources: () => Promise<void>;
  loadContacts: () => Promise<void>;
  loadAll: () => Promise<void>;
  allTransactions: Transaction[];

  accounts: Account[];
  accountMap: Record<string, Account>;
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  contacts: Contact[];
  contactMap: Record<string, Contact>;
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  trades: Trade[];
  transactionMeta: { current_page: number; last_page: number } | undefined;
  categories: { income: string[]; expense: string[] };

  // accounts
  addAccount: (p: Omit<Account, "id" | "balance" | "createdAt" | "updatedAt"> & { balance?: number }) => Promise<Account>;
  updateAccount: (id: string, p: Partial<Account>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;

  // transactions
  addTransaction: (p: any) => Promise<void>;
  updateTransaction: (id: string, p: any) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  // income sources
  addIncomeSource: (name: string, color?: string) => Promise<IncomeSource>;
  updateIncomeSource: (id: string, payload: Pick<IncomeSource, "name" | "color">) => Promise<void>;
  removeIncomeSource: (id: string) => Promise<void>;

  // contacts
  addContact: (payload: Omit<Contact, "id" | "createdAt" | "updatedAt" | "transactionCount">) => Promise<Contact>;
  updateContact: (id: string, payload: Partial<Pick<Contact, "name" | "type" | "phone" | "notes" | "transactionCount">>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;

  // budgets
  addBudget: (p: Omit<Budget, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateBudget: (id: string, p: Partial<Budget>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;

  // debts
  addDebt: (p: Omit<Debt, "id" | "createdAt" | "updatedAt" | "status" | "remainingDebt"> & { remainingDebt?: number }) => Promise<void>;
  updateDebt: (id: string, p: Partial<Debt>) => Promise<void>;
  removeDebt: (id: string) => Promise<void>;
  addDebtPayment: (p: Omit<DebtPayment, "id">) => Promise<void>;
  removeDebtPayment: (id: string) => Promise<void>;

  // trades
  addTrade: (p: Omit<Trade, "id">) => Promise<void>;
  updateTrade: (id: string, p: Partial<Trade>) => Promise<void>;
  removeTrade: (id: string) => Promise<void>;
}

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => Date.now();

function normalizeTransactions(items: any[]): Transaction[] {
  return items.map((t) => ({
    id: t.id,
    accountId: t.accountId ?? t.account_id,
    type: t.type,
    category: t.category,
    amount: Number(t.amount),
    description: t.description,
    transactionDate: typeof t.transactionDate === "string" ? new Date(t.transactionDate).getTime() : (typeof t.transaction_date === "string" ? new Date(t.transaction_date).getTime() : Number(t.transactionDate || Date.now())),
    incomeSourceId: t.incomeSourceId ?? t.income_source_id,
    contactId: t.contactId ?? t.contact_id,
    transferGroupId: t.transferGroupId ?? t.transfer_group_id,
    toAccountId: t.toAccountId ?? t.to_account_id,
    createdAt: t.createdAt ?? t.created_at,
    updatedAt: t.updatedAt ?? t.updated_at,
  }));
}

export const useFinanceStore = create<FinanceState>((set) => ({
  accounts: [],
  accountMap: {},
  transactions: [],
  allTransactions: [], // State untuk analisis total
  incomeSources: [],
  contacts: [],
  contactMap: {},
  budgets: [],
  debts: [],
  debtPayments: [],
  trades: [],
  transactionMeta: undefined,
  categories: { 
    income: ["Salary", "Bonus", "Freelance", "Investment", "Refund", "Other"], 
    expense: ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Education", "Subscriptions", "Other"] 
  },

  loadAccounts: async () => {
    const data = await accountApi.getAll();
    set({ accounts: data, accountMap: Object.fromEntries(data.map((a: Account) => [a.id, a])) });
  },

loadTransactions: async (page = 1) => {
    const res = await transactionApi.getAll();
    const items = Array.isArray(res) ? res : (res.data || []);
    
    // Langsung set tanpa mikirin meta page dari backend lagi
    set({ 
      transactions: normalizeTransactions(items),
      allTransactions: normalizeTransactions(items)
    });
  },

  loadIncomeSources: async () => {
    const data = await incomeSourceApi.getAll();
    set({ incomeSources: data });
  },

  loadAccountsAndAllTransactions: async () => {
    // Helper internal untuk refresh massal data transaksi & akun
    const [transactionsRes, accountsRes] = await Promise.all([
      transactionApi.getAll(), // Ini memanggil data total / ter-filter
      accountApi.getAll(),
    ]);
    const items = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes.data || []);
    const meta = Array.isArray(transactionsRes) ? undefined : { current_page: transactionsRes.current_page, last_page: transactionsRes.last_page };
    
    const normalized = normalizeTransactions(items);
    set({
      transactions: normalized,
      allTransactions: normalized, // Amankan reaktivitas grafik analitik
      transactionMeta: meta,
      accounts: accountsRes,
      accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a]))
    });
  },

  loadContacts: async () => {
    const res = await contactApi.getAll();
    const data = Array.isArray(res) ? res : (res.data || []);
    set({ contacts: data, contactMap: Object.fromEntries(data.map((c: Contact) => [c.id, c])) });
  },

  loadAll: async () => {
    const [accounts, transactionsRes, incomeSources, contacts, budgets, debts, trades] = await Promise.all([
      accountApi.getAll(),
      transactionApi.getAll(), 
      incomeSourceApi.getAll(),
      contactApi.getAll(),
      budgetApi.getAll(),
      debtApi.getAll(),
      tradeApi.getAll(),
    ]);

    const items = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes.data || []);
    const contactData = Array.isArray(contacts) ? contacts : (contacts.data || []);
    const normalizedTx = normalizeTransactions(items);

    set({
      accounts,
      accountMap: Object.fromEntries(accounts.map((a: Account) => [a.id, a])),
      transactions: normalizedTx, 
      allTransactions: normalizedTx, // KUNCI UTAMA ANALYTICS AMAN
      incomeSources,
      contacts: contactData,
      contactMap: Object.fromEntries(contactData.map((c: Contact) => [c.id, c])),
      budgets: budgets || [],
      debts: debts || [],
      trades: trades || [],
    });
  },

  /* ---- accounts ---- */
  addAccount: async (p) => {
    const account = await accountApi.create({ ...p, balance: p.balance ?? 0 });
    set((s) => {
      const next = [...s.accounts, account];
      return { accounts: next, accountMap: { ...s.accountMap, [account.id]: account } };
    });
    return account;
  },

  updateAccount: async (id, p) => {
    const account = await accountApi.update(id, p);
    set((s) => {
      const next = s.accounts.map((a) => (a.id === id ? account : a));
      return { accounts: next, accountMap: { ...s.accountMap, [id]: account } };
    });
  },

  removeAccount: async (id) => {
    await accountApi.remove(id);
    set((s) => {
      const next = s.accounts.filter((a) => a.id !== id);
      const nextMap = { ...s.accountMap };
      delete nextMap[id];
      return { accounts: next, accountMap: nextMap };
    });
  },

  /* ---- transactions (SINKRON DENGAN GRAFIK ALLTRANSACTIONS) ---- */
  addTransaction: async (payload) => {
    await transactionApi.create(payload);
    // Refresh massal agar balance akun ikut ter-update instan
    const [transactionsRes, accountsRes] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    const items = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes.data || []);
    const meta = Array.isArray(transactionsRes) ? undefined : { current_page: transactionsRes.current_page, last_page: transactionsRes.last_page };
    const normalized = normalizeTransactions(items);

    set({ 
      transactions: normalized, 
      allTransactions: normalized, // REAKTIF KE GRAFIK ANALISIS
      transactionMeta: meta,
      accounts: accountsRes,
      accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a]))
    });
  },

  updateTransaction: async (id, payload) => {
    await transactionApi.update(id, payload);
    const [transactionsRes, accountsRes] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    const items = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes.data || []);
    const meta = Array.isArray(transactionsRes) ? undefined : { current_page: transactionsRes.current_page, last_page: transactionsRes.last_page };
    const normalized = normalizeTransactions(items);

    set({ 
      transactions: normalized, 
      allTransactions: normalized, // REAKTIF KE GRAFIK ANALISIS
      transactionMeta: meta,
      accounts: accountsRes,
      accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a]))
    });
  },

  removeTransaction: async (id) => {
    await transactionApi.remove(id);
    const [transactionsRes, accountsRes] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    const items = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes.data || []);
    const meta = Array.isArray(transactionsRes) ? undefined : { current_page: transactionsRes.current_page, last_page: transactionsRes.last_page };
    const normalized = normalizeTransactions(items);

    set({ 
      transactions: normalized, 
      allTransactions: normalized, // REAKTIF KE GRAFIK ANALISIS
      transactionMeta: meta,
      accounts: accountsRes,
      accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a]))
    });
  },

  /* ---- income sources ---- */
  addIncomeSource: async (name, color = "oklch(0.72 0.16 230)") => {
    const source = await incomeSourceApi.create({ name, color });
    set((s) => ({ incomeSources: [...s.incomeSources, source] }));
    return source;
  },

  updateIncomeSource: async (id, payload) => {
    const source = await incomeSourceApi.update(id, payload);
    set((s) => ({ incomeSources: s.incomeSources.map((x) => (x.id === id ? source : x)) }));
  },

  removeIncomeSource: async (id) => {
    await incomeSourceApi.remove(id);
    set((s) => ({ incomeSources: s.incomeSources.filter((x) => x.id !== id) }));
  },

  /* ---- contacts ---- */
  addContact: async (payload) => {
    const contact = await contactApi.create(payload);
    set((state) => {
      const next = [...state.contacts, contact].sort((a, b) => a.name.localeCompare(b.name));
      return { contacts: next, contactMap: { ...state.contactMap, [contact.id]: contact } };
    });
    return contact;
  },

  updateContact: async (id, payload) => {
    const contact = await contactApi.update(id, payload);
    set((state) => {
      const next = state.contacts.map((item) => (item.id === id ? contact : item)).sort((a, b) => a.name.localeCompare(b.name));
      return { contacts: next, contactMap: { ...state.contactMap, [id]: contact } };
    });
  },

  removeContact: async (id) => {
    await contactApi.remove(id);
    set((state) => {
      const nextMap = { ...state.contactMap };
      delete nextMap[id];
      return {
        contacts: state.contacts.filter((contact) => contact.id !== id),
        contactMap: nextMap,
        transactions: state.transactions.map((t) => t.contactId === id ? { ...t, contactId: undefined } : t),
        allTransactions: state.allTransactions.map((t) => t.contactId === id ? { ...t, contactId: undefined } : t),
      };
    });
  },

  /* ---- budgets ---- */
  addBudget: async (p) => {
    const budget = await budgetApi.create(p);
    set((s) => ({ budgets: [...s.budgets, budget] }));
  },
  updateBudget: async (id, p) => {
    const budget = await budgetApi.update(id, p);
    set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? budget : b)) }));
  },
  removeBudget: async (id) => {
    await budgetApi.remove(id);
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
  },

  /* ---- debts ---- */
  addDebt: async (p) => set((s) => ({ debts: [...s.debts, { ...p, id: uid(), remainingDebt: p.remainingDebt ?? p.totalDebt, status: "active", createdAt: now(), updatedAt: now() }] })),
  updateDebt: async (id, p) => set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...p, updatedAt: now() } : d)) })),
  removeDebt: async (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id), debtPayments: s.debtPayments.filter((p) => p.debtId !== id) })),
  addDebtPayment: async (p) => {
    const payment: DebtPayment = { ...p, id: uid() };
    set((s) => {
      const debts = s.debts.map((d) => {
        if (d.id !== p.debtId) return d;
        const remaining = Math.max(0, d.remainingDebt - p.amount);
        return { ...d, remainingDebt: remaining, status: remaining === 0 ? ("paid" as DebtStatus) : d.status, updatedAt: now() };
      });
      let accounts = s.accounts;
      let transactions = s.transactions;
      let allTransactions = s.allTransactions;
      if (p.accountId) {
        const tx: Transaction = { id: uid(), accountId: p.accountId, type: "expense", category: "Debt Payment", amount: p.amount, description: p.notes ?? `Debt payment`, transactionDate: p.paidAt, createdAt: now(), updatedAt: now() };
        transactions = [...s.transactions, tx];
        allTransactions = [...s.allTransactions, tx];
        accounts = s.accounts.map((a) => a.id === p.accountId ? { ...a, balance: a.balance - p.amount, updatedAt: now() } : a);
      }
      return { debts, debtPayments: [...s.debtPayments, payment], transactions, allTransactions, accounts, accountMap: Object.fromEntries(accounts.map((a: Account) => [a.id, a])) };
    });
  },
  removeDebtPayment: async (id) => set((s) => {
    const pay = s.debtPayments.find((p) => p.id === id);
    if (!pay) return s;
    return {
      debtPayments: s.debtPayments.filter((p) => p.id !== id),
      debts: s.debts.map((d) => d.id === pay.debtId ? { ...d, remainingDebt: Math.min(d.totalDebt, d.remainingDebt + pay.amount), status: "active", updatedAt: now() } : d),
    };
  }),

  /* ---- trades ---- */
  addTrade: async (p) => set((s) => ({ trades: [...s.trades, { ...p, id: uid() }] })),
  updateTrade: async (id, p) => set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  removeTrade: async (id) => set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
}));

export { default as selectors } from "./selectors";