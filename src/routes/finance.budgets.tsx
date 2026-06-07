/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinanceStore, type Budget } from "@/lib/finance/store";
import { BudgetFormModal } from "@/components/finance/BudgetFormModal";
import { formatCurrency } from "@/components/finance/StatCard";
import { expenseByCategory, monthRange } from "@/lib/finance/selectors";

export const Route = createFileRoute("/finance/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const removeBudget = useFinanceStore((s) => s.removeBudget);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>();

  const spentByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenseByCategory(transactions, monthRange())) m.set(e.name, e.value);
    return m;
  }, [transactions]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Budgets</h2>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> New Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No budgets yet. Set a monthly cap per expense category.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const spent = spentByCat.get(b.category) ?? 0;
            const pct = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
            const over = spent > b.monthlyLimit;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{b.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(spent)} of {formatCurrency(b.monthlyLimit)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeBudget(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${over ? "bg-rose-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{pct}% used</span>
                  <span className={over ? "text-rose-400" : ""}>
                    {over ? `Over by ${formatCurrency(spent - b.monthlyLimit)}` :
                      `${formatCurrency(b.monthlyLimit - spent)} left`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <BudgetFormModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
