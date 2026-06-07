/* eslint-disable prettier/prettier */
import { useState } from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PALETTE = [
  "oklch(0.72 0.16 230)",
  "oklch(0.75 0.18 160)",
  "oklch(0.80 0.14 80)",
  "oklch(0.72 0.22 300)",
  "oklch(0.70 0.17 20)",
  "oklch(0.78 0.12 200)",
];

export function IncomeSourceModal({
  open,
  onClose,
}: Props) {
  const sources = useFinanceStore(
    (s) => s.incomeSources
  );

  const addIncomeSource = useFinanceStore(
    (s) => s.addIncomeSource
  );

  const updateIncomeSource = useFinanceStore(
    (s) => s.updateIncomeSource
  );

  const removeIncomeSource = useFinanceStore(
    (s) => s.removeIncomeSource
  );

  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setColor(PALETTE[0]);
    setEditingId(null);
  };

  const save = async () => {
    if (!name.trim()) return;

    try {
      if (editingId) {
        await updateIncomeSource(editingId, {
          name: name.trim(),
          color,
        });
      } else {
        await addIncomeSource(
          name.trim(),
          color
        );
      }

      resetForm();
      toast.success(editingId ? "Income source updated" : "Income source added");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Unable to save income source");
    }
  };

  const loadIncomeSources = useFinanceStore(
    (s) => s.loadIncomeSources
  );

  useEffect(() => {
    if (!open) return;
    loadIncomeSources().catch((err) => {
      console.error(err);
      toast.error("Unable to load income sources");
    });
  }, [open, loadIncomeSources]);

  const startEdit = (source: (typeof sources)[number]) => {
    setEditingId(source.id);
    setName(source.name);
    setColor(source.color);
  };

  const remove = async (
    id: string,
    name: string
  ) => {
    if (
      !confirm(
        `Delete income source "${name}" ?`
      )
    )
      return;

    try {
      await removeIncomeSource(id);

      if (editingId === id) {
        resetForm();
      }
      toast.success("Income source deleted");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Unable to delete income source");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) =>
        !v && onClose()
      }
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Income Sources
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">

          <Input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Salary, Freelance, Trading..."
            onKeyDown={(e) =>
              e.key === "Enter" && save()
            }
          />

          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setColor(c)
                }
                className={`h-8 w-8 rounded-full border-2 transition ${
                  color === c
                    ? "border-foreground"
                    : "border-transparent"
                }`}
                style={{
                  background: c,
                }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={save}
            >
              {editingId
                ? "Save"
                : "Add"}
            </Button>

            {editingId && (
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      background:
                        source.color,
                    }}
                  />

                  <span className="text-sm font-medium">
                    {source.name}
                  </span>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      startEdit(source)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      remove(
                        source.id,
                        source.name
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {sources.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No income sources yet.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type IncomeSourceModalProps =
  Props;
