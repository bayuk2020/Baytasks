/* eslint-disable prettier/prettier */
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
import { type Account, type AccountType, ACCOUNT_TYPE_META, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Account;
}

const PALETTE = [
  "oklch(0.72 0.16 230)",
  "oklch(0.75 0.18 160)",
  "oklch(0.80 0.14 80)",
  "oklch(0.72 0.22 300)",
  "oklch(0.70 0.17 20)",
  "oklch(0.78 0.12 200)",
];

export function AccountFormModal({ open, onClose, editing }: Props) {
  const addAccount = useFinanceStore((s) => s.addAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("0");
  const [color, setColor] = useState(PALETTE[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType(editing?.type ?? "bank");
      setBalance(String(editing?.balance ?? 0));
      setColor(editing?.color ?? PALETTE[0]);
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  const submit = () => {
    if (!name.trim()) return;
    if (editing) {
      updateAccount(editing.id, {
        name: name.trim(),
        type,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        balance: Number(balance) || 0,
        icon: "wallet",
        color,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Account" : "New Account"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="BCA 1, GoPay, Cash …" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{editing ? "Balance (auto)" : "Opening Balance"}</Label>
              <Input
                type="number"
                value={balance}
                disabled={!!editing}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
