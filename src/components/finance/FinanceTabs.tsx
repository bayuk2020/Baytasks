import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Receipt,
  LineChart,
  BarChart3,
  ContactRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/finance", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/finance/accounts", label: "Accounts", icon: Wallet },
  { to: "/finance/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/finance/contacts", label: "Contacts", icon: ContactRound },
  { to: "/finance/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/finance/debt", label: "Debt", icon: Receipt },
  { to: "/finance/trading", label: "Trading", icon: LineChart },
  { to: "/finance/analytics", label: "Analytics", icon: BarChart3 },
];

export function FinanceTabs() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card/50 p-1 backdrop-blur">
      {TABS.map((t) => {
        const active = t.exact ? path === t.to : path.startsWith(t.to);
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to as never}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
