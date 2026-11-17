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
  categoryApi,
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
  loadCategories: () => Promise<void>;
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

// Banyak fitur (filter & search transaksi, rekap total, export Excel, statistik
// Overview, "spent" di Budget) butuh SELURUH riwayat transaksi di client.
//
// Versi lama memenuhi itu dengan menembak page 1, lalu SEMUA halaman sisanya
// sekaligus lewat Promise.all — dengan 1100+ transaksi itu ~23 request HTTP paralel.
// Origin API (`php artisan serve`) hanya melayani satu request pada satu waktu,
// jadi ke-23 request itu mengantre: ~10 detik hanya untuk memuat transaksi, dan
// lewat Cloudflare Tunnel sebagian di antaranya kena timeout → 502.
//
// Sekarang: satu request borongan (`?all=1`). Jalur paginasi dipertahankan sebagai
// fallback kalau backend belum di-deploy, tapi dengan batas konkurensi supaya tidak
// pernah lagi membanjiri origin.
const PAGE_FETCH_CONCURRENCY = 4;

async function fetchPagesBounded(lastPage: number): Promise<any[]> {
  const items: any[] = [];
  let next = 2;

  const workers = Array.from({ length: Math.min(PAGE_FETCH_CONCURRENCY, Math.max(lastPage - 1, 0)) }, async () => {
    for (;;) {
      const page = next++;
      if (page > lastPage) return;
      const res = await transactionApi.getAll(page);
      items.push(...(Array.isArray(res) ? res : (res?.data || [])));
    }
  });

  await Promise.all(workers);
  return items;
}

async function fetchAllTransactionPages(): Promise<{ items: any[]; meta?: { current_page: number; last_page: number } }> {
  try {
    const bulk = await transactionApi.getAllBulk();

    if (Array.isArray(bulk)) {
      return { items: bulk, meta: undefined };
    }
    if (bulk?.data) {
      return {
        items: bulk.data,
        meta: { current_page: bulk.current_page ?? 1, last_page: bulk.last_page ?? 1 },
      };
    }
  } catch (error) {
    // Backend lama belum mengenal ?all=1 → turun ke jalur paginasi.
    console.warn("[finance] bulk transactions gagal, fallback ke paginasi:", error);
  }

  const first = await transactionApi.getAll(1);
  if (Array.isArray(first)) {
    return { items: first, meta: undefined };
  }

  const items: any[] = [...(first.data || [])];
  const lastPage: number = first.last_page || 1;

  if (lastPage > 1) {
    items.push(...(await fetchPagesBounded(lastPage)));
  }

  return { items, meta: { current_page: first.current_page ?? 1, last_page: lastPage } };
}

// Beberapa route Finance memanggil loadAll()/loadTransactions() pada mount yang
// hampir bersamaan (mis. Overview lalu langsung pindah tab). Tanpa penjaga ini,
// tiap mount memulai pengambilan penuh lagi. Satu promise in-flight dibagi ke
// semua pemanggil, dan hasil yang baru saja diambil dipakai ulang sebentar.
type TransactionsResult = { items: any[]; meta?: { current_page: number; last_page: number } };

let inflightTransactions: Promise<TransactionsResult> | null = null;
let cachedTransactions: TransactionsResult | null = null;
let lastTransactionsFetchAt = 0;
const TRANSACTIONS_TTL_MS = 15_000;

function fetchTransactionsShared(force = false): Promise<TransactionsResult> {
  if (!force) {
    if (inflightTransactions) return inflightTransactions;
    if (cachedTransactions && Date.now() - lastTransactionsFetchAt < TRANSACTIONS_TTL_MS) {
      return Promise.resolve(cachedTransactions);
    }
  }

  const promise = fetchAllTransactionPages()
    .then((result) => {
      cachedTransactions = result;
      lastTransactionsFetchAt = Date.now();
      return result;
    })
    .finally(() => {
      inflightTransactions = null;
    });

  inflightTransactions = promise;
  return promise;
}

/** Dipanggil setelah mutasi: data di server sudah berubah, cache wajib basi. */
function invalidateTransactionsCache() {
  cachedTransactions = null;
  lastTransactionsFetchAt = 0;
  inflightTransactions = null;
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
  // Fallback statis dipakai sebelum loadCategories()/loadAll() selesai — begitu API
  // membalas, nilai ini ditimpa oleh isi tabel finance_categories yang sebenarnya.
  categories: {
    income: ["Salary", "Bonus", "Freelance", "Investment", "Refund", "Other"],
    expense: ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Education", "Subscriptions", "Other"]
  },

  loadAccounts: async () => {
    const data = await accountApi.getAll();
    set({ accounts: data, accountMap: Object.fromEntries(data.map((a: Account) => [a.id, a])) });
  },

  loadTransactions: async () => {
    const { items, meta } = await fetchTransactionsShared();
    const normalized = normalizeTransactions(items);
    set({
      transactions: normalized,
      allTransactions: normalized,
      transactionMeta: meta,
    });
  },

  loadIncomeSources: async () => {
    const data = await incomeSourceApi.getAll();
    set({ incomeSources: data });
  },

  loadAccountsAndAllTransactions: async () => {
    // Helper internal untuk refresh massal data transaksi & akun
    const [{ items, meta }, accountsRes] = await Promise.all([
      fetchTransactionsShared(),
      accountApi.getAll(),
    ]);

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

  loadCategories: async () => {
    const data = await categoryApi.getAll();
    const income = data.filter((c: any) => c.type === "income").map((c: any) => c.name);
    const expense = data.filter((c: any) => c.type === "expense").map((c: any) => c.name);
    set({ categories: { income, expense } });
  },

  loadAll: async () => {
    const [accounts, { items, meta }, incomeSources, contacts, budgets, debts, trades, categoriesRes] = await Promise.all([
      accountApi.getAll(),
      fetchTransactionsShared(),
      incomeSourceApi.getAll(),
      contactApi.getAll(),
      budgetApi.getAll(),
      debtApi.getAll(),
      tradeApi.getAll(),
      categoryApi.getAll(),
    ]);

    const contactData = Array.isArray(contacts) ? contacts : (contacts.data || []);
    const normalizedTx = normalizeTransactions(items);
    const categoriesData: any[] = categoriesRes || [];

    set({
      accounts,
      accountMap: Object.fromEntries(accounts.map((a: Account) => [a.id, a])),
      transactions: normalizedTx,
      allTransactions: normalizedTx, // KUNCI UTAMA ANALYTICS AMAN
      transactionMeta: meta,
      incomeSources,
      contacts: contactData,
      contactMap: Object.fromEntries(contactData.map((c: Contact) => [c.id, c])),
      budgets: budgets || [],
      debts: debts || [],
      trades: trades || [],
      categories: {
        income: categoriesData.filter((c) => c.type === "income").map((c) => c.name),
        expense: categoriesData.filter((c) => c.type === "expense").map((c) => c.name),
      },
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

  /* ---- transactions (SINKRON DENGAN GRAFIK ALLTRANSACTIONS) ----
   *
   * Dulu setiap mutasi menarik ULANG seluruh riwayat transaksi (~23 request) plus
   * daftar akun — jadi "simpan satu transaksi" berarti 24 request HTTP dan ~10 detik
   * menunggu. Padahal server sudah mengembalikan baris hasilnya di response mutasi.
   *
   * Sekarang state transaksi ditambal langsung dari response itu, dan satu-satunya
   * request tambahan adalah refresh akun (saldonya memang dihitung di server oleh
   * applyBalance/reverseBalance, jadi tidak boleh ditebak di client). Total: 2 request.
   */
  addTransaction: async (payload) => {
    const created = await transactionApi.create(payload);
    const accountsRes = await accountApi.getAll();
    const [normalizedNew] = normalizeTransactions([created]);
    invalidateTransactionsCache();

    set((s) => {
      // Backend memakai firstOrCreate, jadi id yang sama bisa dikirim ulang saat
      // import — pakai upsert, bukan push, supaya tidak muncul baris kembar.
      const exists = s.transactions.some((t) => t.id === normalizedNew.id);
      const merge = (list: Transaction[]) =>
        exists ? list.map((t) => (t.id === normalizedNew.id ? normalizedNew : t)) : [normalizedNew, ...list];

      return {
        transactions: merge(s.transactions),
        allTransactions: merge(s.allTransactions),
        accounts: accountsRes,
        accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a])),
      };
    });
  },

  updateTransaction: async (id, payload) => {
    const updated = await transactionApi.update(id, payload);
    const accountsRes = await accountApi.getAll();
    const [normalizedUpdated] = normalizeTransactions([updated]);
    invalidateTransactionsCache();

    set((s) => {
      // updateTransfer() di backend bisa mengembalikan baris dengan id berbeda dari
      // yang diminta (kaki "out" dari grup transfer), jadi cocokkan keduanya.
      const replace = (list: Transaction[]) =>
        list.map((t) => (t.id === id || t.id === normalizedUpdated.id ? normalizedUpdated : t));

      return {
        transactions: replace(s.transactions),
        allTransactions: replace(s.allTransactions),
        accounts: accountsRes,
        accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a])),
      };
    });
  },

  removeTransaction: async (id) => {
    const target =
      useFinanceStore.getState().allTransactions.find((t) => t.id === id) ??
      useFinanceStore.getState().transactions.find((t) => t.id === id);

    await transactionApi.remove(id);
    const accountsRes = await accountApi.getAll();
    invalidateTransactionsCache();

    set((s) => {
      // Menghapus satu kaki transfer menghapus SELURUH grupnya di backend,
      // jadi state lokal harus ikut membuang semua anggota grup itu.
      const groupId = target?.transferGroupId;
      const drop = (t: Transaction) => (groupId ? t.transferGroupId === groupId : t.id === id);
      const purge = (list: Transaction[]) => list.filter((t) => !drop(t));

      return {
        transactions: purge(s.transactions),
        allTransactions: purge(s.allTransactions),
        accounts: accountsRes,
        accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a])),
      };
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

  /* ---- debts (SINKRON KE BACKEND, sebelumnya cuma mutasi state lokal) ---- */
  addDebt: async (p) => {
    const debt = await debtApi.create(p);
    set((s) => ({ debts: [...s.debts, debt] }));
  },
  updateDebt: async (id, p) => {
    // DebtFormModal selalu mengirim payload lengkap (bukan partial patch),
    // jadi aman dikirim langsung — DebtController::update() tidak fallback ke nilai lama.
    const debt = await debtApi.update(id, p);
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? debt : d)) }));
  },
  removeDebt: async (id) => {
    await debtApi.remove(id);
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id), debtPayments: s.debtPayments.filter((p) => p.debtId !== id) }));
  },
  addDebtPayment: async (p) => {
    const result = await debtApi.pay(p.debtId, p);
    // Backend juga memotong saldo Account & mencatat Transaction "Debt Payment",
    // jadi refresh keduanya biar Kanban saldo & ledger tetap sinkron dengan server.
    invalidateTransactionsCache();
    const [{ items }, accountsRes] = await Promise.all([
      fetchTransactionsShared(true),
      accountApi.getAll(),
    ]);
    const normalized = normalizeTransactions(items);
    set((s) => ({
      debts: s.debts.map((d) => (d.id === p.debtId ? result.debt : d)),
      debtPayments: [...s.debtPayments, result.payment],
      transactions: normalized,
      allTransactions: normalized,
      accounts: accountsRes,
      accountMap: Object.fromEntries(accountsRes.map((a: Account) => [a.id, a])),
    }));
  },
  removeDebtPayment: async (id) => {
    // Belum ada endpoint hapus per-payment di backend (DebtController belum expose ini).
    throw new Error("Menghapus satu pembayaran utang belum didukung backend.");
  },

  /* ---- trades (SINKRON KE BACKEND, sebelumnya cuma mutasi state lokal) ---- */
  addTrade: async (p) => {
    const trade = await tradeApi.create(p);
    set((s) => ({ trades: [...s.trades, trade] }));
  },
  updateTrade: async (id, p) => {
    const trade = await tradeApi.update(id, p);
    set((s) => ({ trades: s.trades.map((t) => (t.id === id ? trade : t)) }));
  },
  removeTrade: async (id) => {
    await tradeApi.remove(id);
    set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }));
  },
}));

export { default as selectors } from "./selectors";