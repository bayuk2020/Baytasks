/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";
import {
  CashflowTrendChart,
  DebtProgressChart,
  ExpenseByCategoryChart,
  IncomeBySourceChart,
} from "@/components/finance/charts";
import { useFinanceStore } from "@/lib/finance/store";
import {
  cashflowTrend,
  debtProgress,
  expenseByCategory,
  incomeBySource,
  monthRange,
  monthlyCashflow,
  monthlyExpense,
  monthlyIncome,
  netWorth,
  totalCash,
  tradingPnL,
} from "@/lib/finance/selectors";

export const Route = createFileRoute("/finance/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const debts = useFinanceStore((s) => s.debts);
  const trades = useFinanceStore((s) => s.trades);
  const incomeSources = useFinanceStore((s) => s.incomeSources);

  const m = monthRange();
  const data = useMemo(() => ({
    netWorth: netWorth(accounts, debts),
    totalCash: totalCash(accounts),
    income: monthlyIncome(transactions, m),
    expense: monthlyExpense(transactions, m),
    cashflow: monthlyCashflow(transactions, m),
    debtRemaining: debts.reduce((s, d) => s + d.remainingDebt, 0),
    pnl: tradingPnL(trades),
    bySource: incomeBySource(transactions, incomeSources, m),
    byCategory: expenseByCategory(transactions, m),
    trend: cashflowTrend(transactions, 6),
    debt: debtProgress(debts),
  }), [accounts, transactions, debts, trades, incomeSources, m]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Net Worth" value={formatCurrency(data.netWorth)} tone={data.netWorth >= 0 ? "positive" : "negative"} />
        <StatCard label="Total Cash" value={formatCurrency(data.totalCash)} />
        <StatCard label="Monthly Income" value={formatCurrency(data.income)} tone="positive" />
        <StatCard label="Monthly Expense" value={formatCurrency(data.expense)} tone="negative" />
        <StatCard label="Cashflow" value={formatCurrency(data.cashflow)} tone={data.cashflow >= 0 ? "positive" : "negative"} />
        <StatCard label="Debt Remaining" value={formatCurrency(data.debtRemaining)} tone={data.debtRemaining > 0 ? "warning" : "positive"} />
        <StatCard label="Trading PnL" value={formatCurrency(data.pnl)} tone={data.pnl >= 0 ? "positive" : "negative"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Income by Source">
          <IncomeBySourceChart data={data.bySource} />
        </Panel>
        <Panel title="Expense by Category">
          <ExpenseByCategoryChart data={data.byCategory} />
        </Panel>
        <Panel title="Cashflow Trend (6 mo)">
          <CashflowTrendChart data={data.trend} />
        </Panel>
        <Panel title="Debt Reduction Progress">
          <DebtProgressChart data={data.debt} />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
