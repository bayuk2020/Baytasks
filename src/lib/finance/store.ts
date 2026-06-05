/* eslint-disable prettier/prettier */
/**
 * Finance Hub — self-contained Zustand store.
 *
 * Designed as a drop-in addition to BayTasks. It does NOT extend the main
 * `useStore` so it can be copy-pasted without touching existing modules.
 * Persists to localStorage; swap calls for `financeApi` (see ./api.ts) when
 * you wire the Laravel backend.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ---------------- Types ---------------- */

export type AccountType = "bank" | "ewallet" | "cash" | "trading";
export type TransactionType = "income" | "expense" | "transfer";
export type DebtStatus = "active" | "paid" | "overdue";
export type TradeSide = "buy" | "sell";
export type TradeStatus = "open" | "closed";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;        // lucide icon name
  color: string;       // hsl/oklch/hex
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

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: string;
  amount: number;            // always positive
  description?: string;
  transactionDate: number;   // epoch ms
  incomeSourceId?: string;   // for income
  transferGroupId?: string;  // links paired transfer rows
  toAccountId?: string;      // convenience on the "out" leg
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
  accountId: string;     // a trading-type account
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
  bank:     { label: "Bank",      color: "oklch(0.72 0.16 230)" },
  ewallet:  { label: "E-Wallet",  color: "oklch(0.75 0.18 160)" },
  cash:     { label: "Cash",      color: "oklch(0.80 0.14 80)"  },
  trading:  { label: "Trading",   color: "oklch(0.72 0.22 300)" },
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food", "Transport", "Bills", "Shopping", "Health",
  "Entertainment", "Education", "Subscriptions", "Other",
];
export const DEFAULT_INCOME_CATEGORIES = [
  "Salary", "Bonus", "Freelance", "Investment", "Refund", "Other",
];

/* ---------------- State / actions ---------------- */

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  trades: Trade[];
  categories: { income: string[]; expense: string[] };

  // accounts
  addAccount: (p: Omit<Account, "id" | "balance" | "createdAt" | "updatedAt"> & { balance?: number }) => Account;
  updateAccount: (id: string, p: Partial<Account>) => void;
  removeAccount: (id: string) => void;

  // transactions
  addTransaction: (
    p: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "transferGroupId"> & { toAccountId?: string }
  ) => void;
  updateTransaction: (id: string, p: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // income sources
  addIncomeSource: (name: string, color?: string) => IncomeSource;
  removeIncomeSource: (id: string) => void;

  // budgets
  addBudget: (p: Omit<Budget, "id" | "createdAt" | "updatedAt">) => void;
  updateBudget: (id: string, p: Partial<Budget>) => void;
  removeBudget: (id: string) => void;

  // debts
  addDebt: (p: Omit<Debt, "id" | "createdAt" | "updatedAt" | "status" | "remainingDebt"> & { remainingDebt?: number }) => void;
  updateDebt: (id: string, p: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  addDebtPayment: (p: Omit<DebtPayment, "id">) => void;
  removeDebtPayment: (id: string) => void;

  // trades
  addTrade: (p: Omit<Trade, "id">) => void;
  updateTrade: (id: string, p: Partial<Trade>) => void;
  removeTrade: (id: string) => void;
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
function rebuildBalances(accounts: Account[], transactions: Transaction[], openings: Record<string, number>) {
  return accounts.map((a) => ({
    ...a,
    balance: recomputeBalance(a.id, transactions, openings[a.id] ?? 0),
    updatedAt: now(),
  }));
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      incomeSources: [
        { id: uid(), name: "Salary",        color: "oklch(0.72 0.16 230)", createdAt: now() },
        { id: uid(), name: "Freelance",     color: "oklch(0.75 0.18 160)", createdAt: now() },
        { id: uid(), name: "Trading",       color: "oklch(0.72 0.22 300)", createdAt: now() },
        { id: uid(), name: "Family Business", color: "oklch(0.80 0.14 80)", createdAt: now() },
        { id: uid(), name: "Affiliate",     color: "oklch(0.70 0.17 20)",  createdAt: now() },
      ],
      budgets: [],
      debts: [],
      debtPayments: [],
      trades: [],
      categories: {
        income: [...DEFAULT_INCOME_CATEGORIES],
        expense: [...DEFAULT_EXPENSE_CATEGORIES],
      },

      /* ---- accounts ---- */
      addAccount: (p) => {
        const acc: Account = {
          id: uid(),
          name: p.name,
          type: p.type,
          icon: p.icon,
          color: p.color,
          notes: p.notes,
          balance: p.balance ?? 0,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ accounts: [...s.accounts, acc] }));
        return acc;
      },
      updateAccount: (id, p) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...p, updatedAt: now() } : a
          ),
        })),
      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter(
            (t) => t.accountId !== id && t.toAccountId !== id
          ),
          trades: s.trades.filter((t) => t.accountId !== id),
        })),

      /* ---- transactions ---- */
      addTransaction: (p) => {
        const ts = now();
        const baseId = uid();
        const acc = get().accounts.find((a) => a.id === p.accountId);
        if (!acc) return;

        if (p.type === "transfer") {
          if (!p.toAccountId || p.toAccountId === p.accountId) return;
          const groupId = uid();
          const outLeg: Transaction = {
            id: baseId,
            accountId: p.accountId,
            toAccountId: p.toAccountId,
            type: "transfer",
            category: "Transfer Out",
            amount: p.amount,
            description: p.description,
            transactionDate: p.transactionDate,
            transferGroupId: groupId,
            createdAt: ts,
            updatedAt: ts,
          };
          const inLeg: Transaction = {
            ...outLeg,
            id: uid(),
            accountId: p.toAccountId,
            toAccountId: p.accountId,
            category: "Transfer In",
            // store as a positive income-style row on the receiving account
            type: "income",
            transferGroupId: groupId,
          };
          set((s) => {
            const transactions = [...s.transactions, outLeg, inLeg];
            return {
              transactions,
              accounts: s.accounts.map((a) => {
                if (a.id === outLeg.accountId)
                  return { ...a, balance: a.balance - p.amount, updatedAt: ts };
                if (a.id === inLeg.accountId)
                  return { ...a, balance: a.balance + p.amount, updatedAt: ts };
                return a;
              }),
            };
          });
          return;
        }

        const tx: Transaction = {
          id: baseId,
          accountId: p.accountId,
          type: p.type,
          category: p.category,
          amount: p.amount,
          description: p.description,
          transactionDate: p.transactionDate,
          incomeSourceId: p.incomeSourceId,
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({
          transactions: [...s.transactions, tx],
          accounts: s.accounts.map((a) =>
            a.id === tx.accountId
              ? {
                  ...a,
                  balance:
                    a.balance + (tx.type === "income" ? tx.amount : -tx.amount),
                  updatedAt: ts,
                }
              : a
          ),
        }));
      },
      updateTransaction: (id, p) => {
        set((s) => {
          const next = s.transactions.map((t) =>
            t.id === id ? { ...t, ...p, updatedAt: now() } : t
          );
          // recompute balances from scratch using current balances as openings
          // (simpler: derive openings as current - applied effect).
          const openings: Record<string, number> = {};
          for (const a of s.accounts) openings[a.id] = 0;
          // walk both old & new ledger using openings=0 then offset:
          const recompute = (ledger: Transaction[]) => {
            const map: Record<string, number> = { ...openings };
            for (const t of ledger) {
              if (t.type === "income") map[t.accountId] = (map[t.accountId] ?? 0) + t.amount;
              else if (t.type === "expense") map[t.accountId] = (map[t.accountId] ?? 0) - t.amount;
              else if (t.type === "transfer") map[t.accountId] = (map[t.accountId] ?? 0) - t.amount;
            }
            return map;
          };
          const before = recompute(s.transactions);
          const after = recompute(next);
          const accounts = s.accounts.map((a) => ({
            ...a,
            balance: a.balance - (before[a.id] ?? 0) + (after[a.id] ?? 0),
            updatedAt: now(),
          }));
          return { transactions: next, accounts };
        });
      },
      removeTransaction: (id) => {
        set((s) => {
          const tx = s.transactions.find((t) => t.id === id);
          if (!tx) return s;
          let toRemoveIds = [id];
          if (tx.transferGroupId) {
            toRemoveIds = s.transactions
              .filter((t) => t.transferGroupId === tx.transferGroupId)
              .map((t) => t.id);
          }
          const removed = s.transactions.filter((t) => toRemoveIds.includes(t.id));
          const accounts = s.accounts.map((a) => {
            let delta = 0;
            for (const t of removed) {
              if (t.accountId !== a.id) continue;
              if (t.type === "income") delta -= t.amount;
              else if (t.type === "expense") delta += t.amount;
              else if (t.type === "transfer") delta += t.amount;
            }
            return delta === 0 ? a : { ...a, balance: a.balance + delta, updatedAt: now() };
          });
          return {
            transactions: s.transactions.filter((t) => !toRemoveIds.includes(t.id)),
            accounts,
          };
        });
      },

      /* ---- income sources ---- */
      addIncomeSource: (name, color = "oklch(0.72 0.16 230)") => {
        const src: IncomeSource = { id: uid(), name, color, createdAt: now() };
        set((s) => ({ incomeSources: [...s.incomeSources, src] }));
        return src;
      },
      removeIncomeSource: (id) =>
        set((s) => ({
          incomeSources: s.incomeSources.filter((x) => x.id !== id),
          transactions: s.transactions.map((t) =>
            t.incomeSourceId === id ? { ...t, incomeSourceId: undefined } : t
          ),
        })),

      /* ---- budgets ---- */
      addBudget: (p) =>
        set((s) => ({
          budgets: [
            ...s.budgets,
            { ...p, id: uid(), createdAt: now(), updatedAt: now() },
          ],
        })),
      updateBudget: (id, p) =>
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, ...p, updatedAt: now() } : b
          ),
        })),
      removeBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      /* ---- debts ---- */
      addDebt: (p) =>
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
      updateDebt: (id, p) =>
        set((s) => ({
          debts: s.debts.map((d) =>
            d.id === id ? { ...d, ...p, updatedAt: now() } : d
          ),
        })),
      removeDebt: (id) =>
        set((s) => ({
          debts: s.debts.filter((d) => d.id !== id),
          debtPayments: s.debtPayments.filter((p) => p.debtId !== id),
        })),
      addDebtPayment: (p) => {
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
              a.id === p.accountId
                ? { ...a, balance: a.balance - p.amount, updatedAt: now() }
                : a
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
      removeDebtPayment: (id) =>
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
                : d
            ),
          };
        }),

      /* ---- trades ---- */
      addTrade: (p) =>
        set((s) => ({ trades: [...s.trades, { ...p, id: uid() }] })),
      updateTrade: (id, p) =>
        set((s) => ({
          trades: s.trades.map((t) => (t.id === id ? { ...t, ...p } : t)),
        })),
      removeTrade: (id) =>
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
    }),
    {
      name: "baytasks-finance-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          const noop: Storage = {
            length: 0,
            clear: () => {},
            getItem: () => null,
            key: () => null,
            removeItem: () => {},
            setItem: () => {},
          };
          return noop;
        }
        return localStorage;
      }),
    }
  )
);

/* Re-export selectors for convenience */
export { default as selectors } from "./selectors";

// referenced by rebuildBalances() helper (kept for callers that prefer it)
export { rebuildBalances };
