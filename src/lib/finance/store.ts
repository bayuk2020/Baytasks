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
/* ---------------- Types ---------------- */
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
  icon: string; // lucide icon name
  color: string; // hsl/oklch/hex
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
export interface ContactAnalyticsItem {
  contactId: string;
  name: string;
  type: ContactType;
  totalExpense: number;
  totalIncome: number;
  totalTransfer: number;
  transactionVolume: number;
  transactionCount: number;
}
export interface ContactAnalytics {
  contacts: ContactAnalyticsItem[];
  topContacts: ContactAnalyticsItem[];
  totalFamilyTransfers: number;
  totalEmployeeSalaries: number;
}
export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: string;
  amount: number; // always positive
  description?: string;
  transactionDate: number; // epoch ms
  incomeSourceId?: string; // for income
  contactId?: string;
  transferGroupId?: string; // links paired transfer rows
  toAccountId?: string; // convenience on the "out" leg
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
  accountId?: string; // optional: also create an expense from this account
  notes?: string;
}
export interface Trade {
  id: string;
  accountId: string; // a trading-type account
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
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Education",
  "Subscriptions",
  "Other",
];
export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investment",
  "Refund",
  "Other",
];
interface FinanceState {
  loadAccounts: () => Promise<void>;
  loadTransactions: (page?: number) => Promise<void>;
  loadIncomeSources: () => Promise<void>;
  loadContacts: () => Promise<void>;
  loadContactAnalytics: () => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadDebts: () => Promise<void>;
  loadTrades: () => Promise<void>;
  loadAll: () => Promise<void>;

  accounts: Account[];
  accountMap: Record<string, Account>;
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  contacts: Contact[];
  contactMap: Record<string, Contact>;
  contactAnalytics: ContactAnalytics | null;
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  trades: Trade[];
  transactionMeta: { current_page: number; last_page: number } | undefined;

  categories: {
    income: string[];
    expense: string[];
  };

  // accounts
  addAccount: (
    p: Omit<Account, "id" | "balance" | "createdAt" | "updatedAt"> & {
      balance?: number;
    },
  ) => Promise<Account>;

  updateAccount: (id: string, p: Partial<Account>) => Promise<void>;

  removeAccount: (id: string) => Promise<void>;

  // transactions
  addTransaction: (
    p: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "transferGroupId"> & {
      toAccountId?: string;
    },
  ) => Promise<void>;

  updateTransaction: (id: string, p: Partial<Transaction>) => Promise<void>;

  removeTransaction: (id: string) => Promise<void>;

  // income sources
  addIncomeSource: (name: string, color?: string) => Promise<IncomeSource>;
  updateIncomeSource: (id: string, payload: Pick<IncomeSource, "name" | "color">) => Promise<void>;

  removeIncomeSource: (id: string) => Promise<void>;

  addContact: (
    payload: Omit<Contact, "id" | "createdAt" | "updatedAt" | "transactionCount">,
  ) => Promise<Contact>;
  updateContact: (
    id: string,
    payload: Partial<Pick<Contact, "name" | "type" | "phone" | "notes">>,
  ) => Promise<void>;
  removeContact: (id: string) => Promise<void>;

  // budgets
  addBudget: (p: Omit<Budget, "id" | "createdAt" | "updatedAt">) => Promise<void>;

  updateBudget: (id: string, p: Partial<Budget>) => Promise<void>;

  removeBudget: (id: string) => Promise<void>;

  // debts
  addDebt: (
    p: Omit<Debt, "id" | "createdAt" | "updatedAt" | "status" | "remainingDebt"> & {
      remainingDebt?: number;
    },
  ) => Promise<void>;

  updateDebt: (id: string, p: Partial<Debt>) => Promise<void>;

  removeDebt: (id: string) => Promise<void>;

  addDebtPayment: (p: Omit<DebtPayment, "id">) => Promise<void>;

  removeDebtPayment: (id: string) => Promise<void>;

  // trades
  addTrade: (p: Omit<Trade, "id">) => Promise<void>;

  updateTrade: (id: string, p: Partial<Trade>) => Promise<void>;

  removeTrade: (id: string) => Promise<void>;
}
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => Date.now();
/** Recompute a single account balance from the transaction ledger. */
function recomputeBalance(accountId: string, txs: Transaction[], opening: number) {
  let bal = opening;
  for (const t of txs) {
    if (t.accountId !== accountId) continue;
    if (t.type === "income") bal += t.amount;
    else if (t.type === "expense") bal -= t.amount;
    else if (t.type === "transfer") bal -= t.amount; // the negative leg lives on accountId
  }
  return bal;
}
/** Recompute every account's balance from openingBalance + ledger. */
function rebuildBalances(
  accounts: Account[],
  transactions: Transaction[],
  openings: Record<string, number>,
) {
  return accounts.map((a) => ({
    ...a,
    balance: recomputeBalance(a.id, transactions, openings[a.id] ?? 0),
    updatedAt: now(),
  }));
}
export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  accountMap: {},
  transactions: [],

  incomeSources: [],
  contacts: [],
  contactMap: {},
  contactAnalytics: null,

  budgets: [],
  debts: [],
  debtPayments: [],
  trades: [],

  transactionMeta: undefined,

  categories: {
    income: [...DEFAULT_INCOME_CATEGORIES],
    expense: [...DEFAULT_EXPENSE_CATEGORIES],
  },

  loadAccounts: async () => {
    const data = await accountApi.getAll();
    set({ accounts: data, accountMap: Object.fromEntries(data.map((a: Account) => [a.id, a])) });
  },

  loadTransactions: async (page: number = 1) => {
    const data = await transactionApi.getAll(page);
    // Jika backend menggunakan paginate(), data berbentuk { data: [...], meta: {...} }
    const items = Array.isArray(data) ? data : (data.data || []);
    const meta = Array.isArray(data) ? undefined : { current_page: data.meta?.current_page, last_page: data.meta?.last_page };
    set({ transactions: items, transactionMeta: meta });
  },

  loadIncomeSources: async () => {
    const data = await incomeSourceApi.getAll();
    set({ incomeSources: data });
  },

  loadContacts: async () => {
    const res = await contactApi.getAll();
    const data = Array.isArray(res) ? res : res.data;
    set({
      contacts: data,
      contactMap: Object.fromEntries(data.map((c: Contact) => [c.id, c])),
    });
  },

  loadContactAnalytics: async () => {
    const data = await contactApi.analytics();
    set({ contactAnalytics: data });
  },

  loadBudgets: async () => {
    const data = await budgetApi.getAll();
    set({ budgets: data });
  },

  loadDebts: async () => {
    const data = await debtApi.getAll();
    set({ debts: data });
  },

  loadTrades: async () => {
    const data = await tradeApi.getAll();
    set({ trades: data });
  },

  loadAll: async () => {
    const [accounts, transactions, incomeSources, contacts, budgets, debts, trades] = await Promise.all([
      accountApi.getAll(),
      transactionApi.getAll(),
      incomeSourceApi.getAll(),
      contactApi.getAll(),
      budgetApi.getAll(),
      debtApi.getAll(),
      tradeApi.getAll(),
    ]);

    set({
      accounts,
      transactions,
      incomeSources,
      contacts,
      budgets,
      debts,
      trades,
    });
  },

  /* ---- accounts ---- */

  addAccount: async (p) => {
    const account = await accountApi.create({
      name: p.name,
      type: p.type,
      balance: p.balance ?? 0,
      icon: p.icon,
      color: p.color,
      notes: p.notes,
    });

    set((s) => ({
      accounts: [...s.accounts, account],
    }));

    return account;
  },

  updateAccount: async (id, p) => {
    const account = await accountApi.update(id, p);

    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? account : a)),
    }));
  },

  removeAccount: async (id) => {
    await accountApi.remove(id);

    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
    }));
  },

  /* ---- transactions ---- */

  addTransaction: async (p) => {
    await transactionApi.create(p);
    const [transactions, accounts] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    set({ transactions, accounts });
  },

  updateTransaction: async (id, p) => {
    await transactionApi.update(id, p);
    const [transactions, accounts] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    set({ transactions, accounts });
  },

  removeTransaction: async (id) => {
    await transactionApi.remove(id);
    const [transactions, accounts] = await Promise.all([
      transactionApi.getAll(),
      accountApi.getAll(),
    ]);
    set({ transactions, accounts });
  },
  /* ---- income sources ---- */

  addIncomeSource: async (name, color = "oklch(0.72 0.16 230)") => {
    const source = await incomeSourceApi.create({
      name,
      color,
    });

    set((s) => ({
      incomeSources: [...s.incomeSources, source],
    }));

    return source;
  },

  updateIncomeSource: async (id, payload) => {
    const source = await incomeSourceApi.update(id, payload);

    set((s) => ({
      incomeSources: s.incomeSources.map((x) => (x.id === id ? source : x)),
    }));
  },

  removeIncomeSource: async (id) => {
    await incomeSourceApi.remove(id);

    set((s) => ({
      incomeSources: s.incomeSources.filter((x) => x.id !== id),
    }));
  },

  /* ---- contacts ---- */

  addContact: async (payload) => {
    const contact = await contactApi.create(payload);
    set((state) => ({
      contacts: [...state.contacts, contact].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return contact;
  },

  updateContact: async (id, payload) => {
    const contact = await contactApi.update(id, payload);
    set((state) => ({
      contacts: state.contacts
        .map((item) => (item.id === id ? contact : item))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  removeContact: async (id) => {
    await contactApi.remove(id);
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
      transactions: state.transactions.map((transaction) =>
        transaction.contactId === id ? { ...transaction, contactId: undefined } : transaction,
      ),
    }));
  },

  /* ---- budgets ---- */

  addBudget: async (p) => {
    const budget = await budgetApi.create(p);

    set((s) => ({
      budgets: [...s.budgets, budget],
    }));
  },

  updateBudget: async (id, p) => {
    const budget = await budgetApi.update(id, p);

    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? budget : b)),
    }));
  },

  removeBudget: async (id) => {
    await budgetApi.remove(id);

    set((s) => ({
      budgets: s.budgets.filter((b) => b.id !== id),
    }));
  },

  /* ---- debts ---- */
  /* BIARKAN PUNYA MU SEKARANG */

  /* ---- trades ---- */
  /* BIARKAN PUNYA MU SEKARANG */
  /* ---- debts ---- */
  addDebt: async (p) =>
    set((s) => ({
      debts: [
        ...s.debts,
        {
          ...p,
          id: uid(),
          remainingDebt: p.remainingDebt ?? p.totalDebt,
          status: "active",
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    })),
  updateDebt: async (id, p) =>
    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? { ...d, ...p, updatedAt: now() } : d)),
    })),
  removeDebt: async (id) =>
    set((s) => ({
      debts: s.debts.filter((d) => d.id !== id),
      debtPayments: s.debtPayments.filter((p) => p.debtId !== id),
    })),
  addDebtPayment: async (p) => {
    const payment: DebtPayment = { ...p, id: uid() };
    set((s) => {
      const debts = s.debts.map((d) => {
        if (d.id !== p.debtId) return d;
        const remaining = Math.max(0, d.remainingDebt - p.amount);
        return {
          ...d,
          remainingDebt: remaining,
          status: remaining === 0 ? ("paid" as DebtStatus) : d.status,
          updatedAt: now(),
        };
      });
      let accounts = s.accounts;
      let transactions = s.transactions;
      if (p.accountId) {
        const tx: Transaction = {
          id: uid(),
          accountId: p.accountId,
          type: "expense",
          category: "Debt Payment",
          amount: p.amount,
          description: p.notes ?? `Debt payment`,
          transactionDate: p.paidAt,
          createdAt: now(),
          updatedAt: now(),
        };
        transactions = [...s.transactions, tx];
        accounts = s.accounts.map((a) =>
          a.id === p.accountId ? { ...a, balance: a.balance - p.amount, updatedAt: now() } : a,
        );
      }
      return {
        debts,
        debtPayments: [...s.debtPayments, payment],
        transactions,
        accounts,
      };
    });
  },
  removeDebtPayment: async (id) =>
    set((s) => {
      const pay = s.debtPayments.find((p) => p.id === id);
      if (!pay) return s;
      return {
        debtPayments: s.debtPayments.filter((p) => p.id !== id),
        debts: s.debts.map((d) =>
          d.id === pay.debtId
            ? {
                ...d,
                remainingDebt: Math.min(d.totalDebt, d.remainingDebt + pay.amount),
                status: "active",
                updatedAt: now(),
              }
            : d,
        ),
      };
    }),
  /* ---- trades ---- */
  addTrade: async (p) => set((s) => ({ trades: [...s.trades, { ...p, id: uid() }] })),
  updateTrade: async (id, p) =>
    set((s) => ({
      trades: s.trades.map((t) => (t.id === id ? { ...t, ...p } : t)),
    })),
  removeTrade: async (id) => set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
}));

/* Re-export selectors for convenience */
export { default as selectors } from "./selectors";
// referenced by rebuildBalances() helper (kept for callers that prefer it)
export { rebuildBalances };
