/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Banknote,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
  Receipt,
  LineChart as LineChartIcon,
} from "lucide-react";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";
import { useFinanceSnapshot } from "@/lib/finance/selectors";
import { useFinanceStore } from "@/lib/finance/store";
import { useEffect } from "react";

export const Route = createFileRoute("/finance/")({
  component: Overview,
});

function Overview() {
  const s = useFinanceSnapshot();
  const loadAll = useFinanceStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kekayaan Bersih"
          value={formatCurrency(s.netWorth)}
          hint="Aset − Liabilitas"
          icon={<Wallet className="h-4 w-4" />}
          tone={s.netWorth >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Total Kas"
          value={formatCurrency(s.totalCash)}
          hint={`${s.accounts.length} akun`}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Arus Kas Bulanan"
          value={formatCurrency(s.monthlyCashflow)}
          hint={`Masuk ${formatCurrency(s.monthlyIncome)} · Keluar ${formatCurrency(s.monthlyExpense)}`}
          icon={s.monthlyCashflow >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          tone={s.monthlyCashflow >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Sisa Utang"
          value={formatCurrency(s.debtRemaining)}
          hint={`Kewajiban bulanan ${formatCurrency(s.monthlyDebtObligation)}`}
          icon={<Receipt className="h-4 w-4" />}
          tone={s.debtRemaining > 0 ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuickPanel
          title="Daftar Akun"
          to="/finance/accounts"
          icon={<Wallet className="h-4 w-4" />}
        >
          {s.accounts.length === 0 ? (
            <Empty text="Belum ada akun — tambahkan dompet atau bank pertama Anda." />
          ) : (
            <ul className="divide-y divide-border">
              {s.accounts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {a.type === "bank" ? "Bank" : a.type === "cash" ? "Tunai" : a.type === "ewallet" ? "E-Wallet" : a.type === "trading" ? "Trading" : a.type}
                    </span>
                  </div>
                  <span className="tabular-nums">{formatCurrency(a.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </QuickPanel>

        <QuickPanel
          title="Transaksi Terakhir"
          to="/finance/transactions"
          icon={<LineChartIcon className="h-4 w-4" />}
        >
          {s.transactions.length === 0 ? (
            <Empty text="Catat pemasukan atau pengeluaran pertama Anda." />
          ) : (
            <ul className="divide-y divide-border">
              {[...s.transactions]
                .sort((a, b) => b.transactionDate - a.transactionDate)
                .slice(0, 5)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.description || t.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.transactionDate).toLocaleDateString("id-ID")} · {t.category}
                      </div>
                    </div>
                    <span
                      className={`tabular-nums ${
                        t.type === "income"
                          ? "text-emerald-400"
                          : t.type === "expense"
                          ? "text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.type === "expense" ? "−" : t.type === "income" ? "+" : ""}
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </QuickPanel>
      </div>
    </motion.div>
  );
}

function QuickPanel({
  title,
  to,
  icon,
  children,
}: {
  title: string;
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <Link
          to={to as never}
          className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{text}</p>;
}