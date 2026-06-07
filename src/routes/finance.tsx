/* eslint-disable prettier/prettier */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FinanceTabs } from "@/components/finance/FinanceTabs";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance Hub — BayTasks" },
      { name: "description", content: "Personal financial operating system: accounts, transactions, budgets, debt, trading and analytics." },
    ],
  }),
  component: FinanceLayout,
});

function FinanceLayout() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Finance Hub</h1>
        <p className="text-sm text-muted-foreground">
          Your personal financial operating system.
        </p>
      </header>
      <FinanceTabs />
      <Outlet />
    </div>
  );
}
