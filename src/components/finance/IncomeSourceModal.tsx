/* eslint-disable prettier/prettier */
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function IncomeSourceModal({ open, onClose }: Props) {
  const sources = useFinanceStore((s) => s.incomeSources);
  const addIncomeSource = useFinanceStore((s) => s.addIncomeSource);
  const removeIncomeSource = useFinanceStore((s) => s.removeIncomeSource);
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    addIncomeSource(name.trim());
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Income Sources</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add source…"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add}>Add</Button>
          </div>
          <div className="grid gap-1">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm">{s.name}</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeIncomeSource(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {sources.length === 0 && (
              <p className="text-sm text-muted-foreground">No sources yet.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LabelProps { children: React.ReactNode }
// fallthrough export so this file is treated as a module
export { type Props as IncomeSourceModalProps };
