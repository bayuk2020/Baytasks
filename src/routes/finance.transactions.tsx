/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore, type Transaction, type TransactionType } from "@/lib/finance/store";
import { TransactionFormModal } from "@/components/finance/TransactionFormModal";
import { IncomeSourceModal } from "@/components/finance/IncomeSourceModal";
import { formatCurrency } from "@/components/finance/StatCard";

export const Route = createFileRoute("/finance/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const transactions = useFinanceStore((state) => state.transactions);
  const accountMap = useFinanceStore((state) => state.accountMap);
  const contactMap = useFinanceStore((state) => state.contactMap);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const loadAccounts = useFinanceStore((state) => state.loadAccounts);
  const loadTransactions = useFinanceStore((state) => state.loadTransactions);
  const loadIncomeSources = useFinanceStore((state) => state.loadIncomeSources);
  const loadContacts = useFinanceStore((state) => state.loadContacts);
  const transactionMeta = useFinanceStore((state) => state.transactionMeta);

  const [open, setOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("expense");
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([loadAccounts(), loadTransactions(), loadIncomeSources(), loadContacts()]).catch(
      (error) => {
        console.error(error);
        toast.error("Unable to load finance data");
      },
    );
  }, [loadAccounts, loadContacts, loadIncomeSources, loadTransactions]);

  useEffect(() => {
    loadTransactions(page);
  }, [page, loadTransactions]);

  const accountName = (id: string) => accountMap?.[id]?.name ?? "—";
  const contactName = (id?: string) => (id ? (contactMap?.[id]?.name ?? "—") : "—");

  const list = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...transactions]
      .filter((transaction) => typeFilter === "all" || transaction.type === typeFilter)
      .filter((transaction) => accountFilter === "all" || transaction.accountId === accountFilter)
      .filter((transaction) => {
        if (!search) return true;
        return (
          transaction.category.toLowerCase().includes(search) ||
          (transaction.description ?? "").toLowerCase().includes(search) ||
          (contactMap?.[transaction.contactId ?? ""]?.name ?? "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.transactionDate - a.transactionDate);
  }, [accountFilter, contactMap, query, transactions, typeFilter]);

  const openCreate = () => {
    setEditing(undefined);
    setDefaultType("expense");
    setOpen(true);
  };

  const remove = async (transaction: Transaction) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await removeTransaction(transaction.id);
      toast.success("Transaction deleted");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to delete transaction");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSourcesOpen(true)}>
            <Tag className="mr-1 h-4 w-4" /> Income Sources
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions or contacts..."
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {Object.values(accountMap || {}).map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-card/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No transactions.
                </td>
              </tr>
            )}
            {list.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-accent/40">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {transaction.description || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{transaction.category}</td>
                <td className="px-4 py-3">
                  {accountName(transaction.accountId)}
                  {transaction.toAccountId && (
                    <span className="text-muted-foreground">
                      {" "}
                      → {accountName(transaction.toAccountId)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {contactName(transaction.contactId)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    transaction.type === "income"
                      ? "text-emerald-400"
                      : transaction.type === "expense"
                        ? "text-rose-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {transaction.type === "expense" ? "−" : transaction.type === "income" ? "+" : ""}
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(transaction);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(transaction)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactionMeta && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="btn-primary"
            >
              Previous
            </Button>
            <span className="px-3">
              Page {page} of {transactionMeta.last_page}
            </span>
            <Button
              onClick={() => setPage(prev => Math.min(prev + 1, transactionMeta.last_page))}
              disabled={page >= transactionMeta.last_page}
              className="btn-primary"
            >
              Next
            </Button>
          </div>
        )}
        </div>

      <TransactionFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        defaultType={defaultType}
      />
      <IncomeSourceModal open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </div>
  );
}
