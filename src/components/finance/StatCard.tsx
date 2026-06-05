/* eslint-disable prettier/prettier */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
  className?: string;
}

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-400",
};

export function StatCard({ label, value, hint, icon, tone = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/60 p-5 backdrop-blur",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tabular-nums", toneClass[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function formatCurrency(n: number, currency = "IDR") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}
