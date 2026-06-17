/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Coins, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinanceStore, type Debt } from "@/lib/finance/store";
import { DebtFormModal } from "@/components/finance/DebtFormModal";
import { DebtPaymentModal } from "@/components/finance/DebtPaymentModal";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";

export const Route = createFileRoute("/finance/debt")({
  component: DebtPage,
});

function DebtPage() {
  const debts = useFinanceStore((s) => s.debts);
  const debtPayments = useFinanceStore((s) => s.debtPayments);
  const removeDebt = useFinanceStore((s) => s.removeDebt);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | undefined>();
  const [payDebt, setPayDebt] = useState<Debt | undefined>();

  const total = debts.reduce((s, d) => s + d.totalDebt, 0);
  const remaining = debts.reduce((s, d) => s + d.remainingDebt, 0);
  const monthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);

  const estPayoff = (d: Debt) => {
    if (!d.monthlyPayment) return "—";
    const months = Math.ceil(d.remainingDebt / d.monthlyPayment);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return `${months} bln · ${date.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`;
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Utang" value={formatCurrency(total)} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Sisa Utang" value={formatCurrency(remaining)} tone={remaining > 0 ? "warning" : "positive"} icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Kewajiban Bulanan" value={formatCurrency(monthly)} icon={<CalendarDays className="h-4 w-4" />} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Utang</h2>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Utang Baru
        </Button>
      </div>

      {debts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Belum ada utang yang dicatat. Tambahkan pemberi pinjaman untuk memulai.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {debts.map((d) => {
            const paid = Math.max(0, d.totalDebt - d.remainingDebt);
            const pct = Math.round((paid / d.totalDebt) * 100);
            const history = debtPayments.filter((p) => p.debtId === d.id).slice(-3).reverse();
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold">{d.creditor}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        d.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                        d.status === "overdue" ? "bg-rose-500/15 text-rose-400" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {d.status === "paid" ? "Lunas" : d.status === "overdue" ? "Jatuh Tempo" : d.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Sisa {formatCurrency(d.remainingDebt)} dari {formatCurrency(d.totalDebt)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      if (confirm(`Hapus utang "${d.creditor}"?`)) removeDebt(d.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>{pct}% dibayar</div>
                  <div>Bulanan {formatCurrency(d.monthlyPayment)}</div>
                  <div className="text-right">Estimasi {estPayoff(d)}</div>
                </div>

                {history.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Pembayaran terakhir</div>
                    <ul className="space-y-1 text-xs">
                      {history.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString("id-ID")}</span>
                          <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => setPayDebt(d)} disabled={d.remainingDebt <= 0}>
                    Catat Pembayaran
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <DebtFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <DebtPaymentModal open={!!payDebt} onClose={() => setPayDebt(undefined)} debt={payDebt} />
    </div>
  );
}