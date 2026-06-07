/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFinanceStore, type Account } from "@/lib/finance/store";
import { AccountCard } from "@/components/finance/AccountCard";
import { AccountFormModal } from "@/components/finance/AccountFormModal";

export const Route = createFileRoute("/finance/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const accounts = useFinanceStore((s) => s.accounts);

  const loadAccounts = useFinanceStore(
    (s) => s.loadAccounts
  );

  const removeAccount = useFinanceStore(
    (s) => s.removeAccount
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();

  useEffect(() => {
    loadAccounts().catch(console.error);
  }, []);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Accounts
        </h2>

        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No accounts yet. Create your first one —
          BCA, GoPay, Cash, anything.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onEdit={() => {
                  setEditing(a);
                  setOpen(true);
                }}
                onDelete={() => {
                  if (
                    confirm(
                      `Delete "${a.name}"? This removes its transactions too.`
                    )
                  ) {
                    removeAccount(a.id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AccountFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
    </div>
  );
}