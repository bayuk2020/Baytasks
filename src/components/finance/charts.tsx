/* eslint-disable prettier/prettier */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "oklch(0.72 0.16 230)",
  "oklch(0.75 0.18 160)",
  "oklch(0.80 0.14 80)",
  "oklch(0.72 0.22 300)",
  "oklch(0.70 0.17 20)",
  "oklch(0.78 0.12 200)",
  "oklch(0.68 0.18 350)",
];

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
};

export function IncomeBySourceChart({ data }: { data: { name: string; value: number; color?: string }[] }) {
  if (data.length === 0) return <Empty label="No income recorded this month." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ExpenseByCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <Empty label="No expenses this month." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CashflowTrendChart({ data }: { data: { month: string; income: number; expense: number; net: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.75 0.18 160)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="oklch(0.75 0.18 160)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.70 0.17 20)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="oklch(0.70 0.17 20)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="income" stroke="oklch(0.75 0.18 160)" fill="url(#incFill)" />
        <Area type="monotone" dataKey="expense" stroke="oklch(0.70 0.17 20)" fill="url(#expFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DebtProgressChart({ data }: { data: { name: string; remaining: number; paid: number }[] }) {
  if (data.length === 0) return <Empty label="No debts tracked." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={100} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="paid" stackId="d" fill="oklch(0.75 0.18 160)" radius={[8, 0, 0, 8]} />
        <Bar dataKey="remaining" stackId="d" fill="oklch(0.70 0.17 20)" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="grid h-[280px] place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {label}
    </div>
  );
}
