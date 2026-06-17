/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinanceStore, type Trade } from "@/lib/finance/store";
import { TradeFormModal } from "@/components/finance/TradeFormModal";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";
import { tradingPnL } from "@/lib/finance/selectors";

export const Route = createFileRoute("/finance/trading")({
  component: TradingPage,
});

function pnlOf(t: Trade) {
  if (t.status !== "closed" || t.exitPrice == null) return null;
  const gross = t.side === "buy"
    ? (t.exitPrice - t.entryPrice) * t.quantity
    : (t.entryPrice - t.exitPrice) * t.quantity;
  return gross - (t.fees ?? 0);
}

function TradingPage() {
  const trades = useFinanceStore((s) => s.trades);
  const removeTrade = useFinanceStore((s) => s.removeTrade);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | undefined>();

  const totalPnL = useMemo(() => tradingPnL(trades), [trades]);
  const openCount = trades.filter((t) => t.status === "open").length;
  const closedCount = trades.filter((t) => t.status === "closed").length;
  const winners = trades.filter((t) => (pnlOf(t) ?? 0) > 0).length;
  const winRate = closedCount ? Math.round((winners / closedCount) * 100) : 0;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total PnL" value={formatCurrency(totalPnL)} tone={totalPnL >= 0 ? "positive" : "negative"} />
        <StatCard label="Posisi Terbuka" value={openCount} />
        <StatCard label="Posisi Tertutup" value={closedCount} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaksi Trading</h2>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Trading Baru
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-card/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Simbol</th>
              <th className="px-4 py-3 text-left">Posisi</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3 text-right">Harga Masuk</th>
              <th className="px-4 py-3 text-right">Harga Keluar</th>
              <th className="px-4 py-3 text-right">PnL</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Belum ada transaksi trading.</td></tr>
            )}
            {[...trades].sort((a, b) => b.openedAt - a.openedAt).map((t) => {
              const pnl = pnlOf(t);
              return (
                <tr key={t.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium">{t.symbol}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.side === "buy" ? "Beli (Long)" : t.side === "sell" ? "Jual (Short)" : t.side}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.entryPrice}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.exitPrice ?? "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${
                    pnl == null ? "text-muted-foreground" : pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {pnl == null ? "—" : formatCurrency(pnl)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      t.status === "open" ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {t.status === "open" ? "Terbuka" : t.status === "closed" ? "Tertutup" : t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm(`Hapus transaksi trading "${t.symbol}"?`)) removeTrade(t.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TradeFormModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}