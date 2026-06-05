/* eslint-disable prettier/prettier */
import {
  useFinanceStore,
  type Transaction,
  type Account,
  type Debt,
  type Trade,
} from "./store";

export interface MonthRange { start: number; end: number; }

export function monthRange(date = new Date()): MonthRange {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
  return { start, end };
}

export function netWorth(accounts: Account[], debts: Debt[]) {
  const assets = accounts.reduce((s, a) => s + a.balance, 0);
  const liab = debts.reduce((s, d) => s + d.remainingDebt, 0);
  return assets - liab;
}

export function totalCash(accounts: Account[]) {
  return accounts
    .filter((a) => a.type !== "trading")
    .reduce((s, a) => s + a.balance, 0);
}

export function monthlyIncome(txs: Transaction[], range = monthRange()) {
  return txs
    .filter(
      (t) =>
        t.type === "income" &&
        !t.transferGroupId &&
        t.transactionDate >= range.start &&
        t.transactionDate < range.end
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function monthlyExpense(txs: Transaction[], range = monthRange()) {
  return txs
    .filter(
      (t) =>
        t.type === "expense" &&
        t.transactionDate >= range.start &&
        t.transactionDate < range.end
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function monthlyCashflow(txs: Transaction[], range = monthRange()) {
  return monthlyIncome(txs, range) - monthlyExpense(txs, range);
}

export function tradingPnL(trades: Trade[]) {
  return trades.reduce((s, t) => {
    if (t.status !== "closed" || t.exitPrice == null) return s;
    const gross =
      t.side === "buy"
        ? (t.exitPrice - t.entryPrice) * t.quantity
        : (t.entryPrice - t.exitPrice) * t.quantity;
    return s + gross - (t.fees ?? 0);
  }, 0);
}

export function incomeBySource(txs: Transaction[], sources: { id: string; name: string; color: string }[], range = monthRange()) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "income" || t.transferGroupId) continue;
    if (t.transactionDate < range.start || t.transactionDate >= range.end) continue;
    const key = t.incomeSourceId ?? "unassigned";
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return sources
    .map((s) => ({ name: s.name, value: map.get(s.id) ?? 0, color: s.color }))
    .concat(
      map.has("unassigned")
        ? [{ name: "Unassigned", value: map.get("unassigned") ?? 0, color: "oklch(0.6 0.02 250)" }]
        : []
    )
    .filter((x) => x.value > 0);
}

export function expenseByCategory(txs: Transaction[], range = monthRange()) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    if (t.transactionDate < range.start || t.transactionDate >= range.end) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function cashflowTrend(txs: Transaction[], months = 6) {
  const out: { month: string; income: number; expense: number; net: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const r = monthRange(d);
    const inc = monthlyIncome(txs, r);
    const exp = monthlyExpense(txs, r);
    out.push({
      month: d.toLocaleString(undefined, { month: "short" }),
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }
  return out;
}

export function debtProgress(debts: Debt[]) {
  return debts
    .map((d) => ({
      name: d.creditor,
      total: d.totalDebt,
      remaining: d.remainingDebt,
      paid: Math.max(0, d.totalDebt - d.remainingDebt),
    }))
    .sort((a, b) => b.remaining - a.remaining);
}

export function useFinanceSnapshot() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const debts = useFinanceStore((s) => s.debts);
  const trades = useFinanceStore((s) => s.trades);
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const range = monthRange();
  return {
    accounts,
    transactions,
    debts,
    trades,
    incomeSources,
    netWorth: netWorth(accounts, debts),
    totalCash: totalCash(accounts),
    monthlyIncome: monthlyIncome(transactions, range),
    monthlyExpense: monthlyExpense(transactions, range),
    monthlyCashflow: monthlyCashflow(transactions, range),
    debtRemaining: debts.reduce((s, d) => s + d.remainingDebt, 0),
    monthlyDebtObligation: debts.reduce((s, d) => s + d.monthlyPayment, 0),
    tradingPnL: tradingPnL(trades),
  };
}

const selectors = {
  netWorth, totalCash, monthlyIncome, monthlyExpense, monthlyCashflow,
  tradingPnL, incomeBySource, expenseByCategory, cashflowTrend, debtProgress,
  monthRange,
};
export default selectors;
