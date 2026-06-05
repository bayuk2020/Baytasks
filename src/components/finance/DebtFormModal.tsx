/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type Debt, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Debt;
}

export function DebtFormModal({ open, onClose, editing }: Props) {
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);

  const [creditor, setCreditor] = useState("");
  const [total, setTotal] = useState("");
  const [remaining, setRemaining] = useState("");
  const [monthly, setMonthly] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setCreditor(editing?.creditor ?? "");
    setTotal(String(editing?.totalDebt ?? ""));
    setRemaining(String(editing?.remainingDebt ?? ""));
    setMonthly(String(editing?.monthlyPayment ?? ""));
    setDueDate(editing?.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "");
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  const submit = () => {
    const t = Number(total);
    if (!creditor.trim() || !t) return;
    const payload = {
      creditor: creditor.trim(),
      totalDebt: t,
      remainingDebt: Number(remaining) || t,
      monthlyPayment: Number(monthly) || 0,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      notes: notes.trim() || undefined,
    };
    if (editing) updateDebt(editing.id, payload);
    else addDebt(payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Debt" : "New Debt"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Creditor</Label>
            <Input value={creditor} onChange={(e) => setCreditor(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Total Debt</Label>
              <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div>
              <Label>Remaining</Label>
              <Input type="number" value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="Defaults to total" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Payment</Label>
              <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
