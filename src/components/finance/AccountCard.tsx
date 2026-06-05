/* eslint-disable prettier/prettier */
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { type Account, ACCOUNT_TYPE_META } from "@/lib/finance/store";
import { formatCurrency } from "./StatCard";
import { Button } from "@/components/ui/button";

interface Props {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, onEdit, onDelete }: Props) {
  const meta = ACCOUNT_TYPE_META[account.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-5 backdrop-blur"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: account.color || meta.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold text-background"
              style={{ background: account.color || meta.color }}
            >
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{account.name}</div>
              <div className="text-xs text-muted-foreground">{meta.label}</div>
            </div>
          </div>
          <div className="mt-4 text-2xl font-semibold tabular-nums">
            {formatCurrency(account.balance)}
          </div>
          {account.notes && (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{account.notes}</div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
