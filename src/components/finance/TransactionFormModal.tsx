import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ContactCombobox } from "@/components/finance/ContactCombobox";
import { type Transaction, type TransactionType, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Transaction;
  defaultType?: TransactionType;
}

export function TransactionFormModal({ open, onClose, editing, defaultType = "expense" }: Props) {
  const accounts = useFinanceStore((s) => s.accounts);
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const contacts = useFinanceStore((s) => s.contacts);
  const loadContacts = useFinanceStore((s) => s.loadContacts);
  const categories = useFinanceStore((s) => s.categories);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);

  const [type, setType] = useState<TransactionType>(defaultType);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAccountId(editing.accountId);
      setToAccountId(editing.toAccountId ?? "");
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setDescription(editing.description ?? "");
      setIncomeSourceId(editing.incomeSourceId ?? "");
      setContactId(editing.contactId ?? "");
      setDate(new Date(editing.transactionDate).toISOString().slice(0, 10));
    } else {
      setType(defaultType);
      setAccountId(accounts[0]?.id ?? "");
      setToAccountId("");
      setCategory("");
      setAmount("");
      setDescription("");
      setIncomeSourceId("");
      setContactId("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, editing, defaultType, accounts]);

  useEffect(() => {
    if (!open || contacts.length > 0) return;
    loadContacts().catch((error) => {
      console.error(error);
      toast.error("Unable to load contacts");
    });
  }, [contacts.length, loadContacts, open]);

  const cats =
    type === "income" ? categories.income : type === "expense" ? categories.expense : ["Transfer"];

  const submit = async () => {
    const amt = Number(amount);
    if (!accountId || !amt || amt <= 0) {
      toast.error("Choose an account and enter a valid amount");
      return;
    }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      toast.error("Choose a different destination account");
      return;
    }

    const payload = {
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      type,
      category: type === "transfer" ? "Transfer" : category || cats[0] || "Other",
      amount: amt,
      description: description.trim() || undefined,
      transactionDate: new Date(date).getTime(),
      incomeSourceId: type === "income" ? incomeSourceId || undefined : undefined,
      contactId: contactId || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
      } else {
        await addTransaction(payload);
      }
      toast.success(editing ? "Transaction updated" : "Transaction created");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Unable to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-2">
            {(["income", "expense", "transfer"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={!!editing}
                onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                  type === t
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                } ${editing ? "opacity-60" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <Label>{type === "transfer" ? "From Account" : "Account"}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "transfer" && (
            <div>
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "transfer" && (
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "income" && (
            <div>
              <Label>Income Source</Label>
              <Select value={incomeSourceId} onValueChange={setIncomeSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{type === "transfer" ? "Recipient / Party" : "Contact / Party"}</Label>
            <ContactCombobox
              contacts={contacts}
              value={contactId || undefined}
              onChange={(value) => setContactId(value ?? "")}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
