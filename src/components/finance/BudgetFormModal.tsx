/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { type Budget, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Budget;
}

export function BudgetFormModal({ open, onClose, editing }: Props) {
  const categories = useFinanceStore((s) => s.categories.expense);
  const addBudget = useFinanceStore((s) => s.addBudget);
  const updateBudget = useFinanceStore((s) => s.updateBudget);

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory(editing?.category ?? categories[0] ?? "");
    setLimit(String(editing?.monthlyLimit ?? ""));
    setNotes(editing?.notes ?? "");
  }, [open, editing, categories]);

  const submit = () => {
    const n = Number(limit);
    if (!category || !n) return;
    if (editing) {
      updateBudget(editing.id, { category, monthlyLimit: n, notes: notes.trim() || undefined });
    } else {
      addBudget({ category, monthlyLimit: n, notes: notes.trim() || undefined });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Budget" : "New Budget"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monthly Limit</Label>
            <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
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
