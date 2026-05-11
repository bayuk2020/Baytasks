import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — BayTasks" }] }),
  component: Analytics,
});

function Analytics() {
  const { tasks, activeBoardId } = useStore();
  const my = tasks.filter((t) => t.boardId === activeBoardId);

  const last14 = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (13 - i));
      return d;
    });
    return days.map((d) => {
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const completed = my.filter((t) => t.completedAt && t.completedAt >= d.getTime() && t.completedAt < next.getTime()).length;
      const created = my.filter((t) => t.createdAt >= d.getTime() && t.createdAt < next.getTime()).length;
      return { day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), completed, created };
    });
  }, [my]);

  const byPriority = useMemo(() => {
    const counts: Record<string, number> = { low: 0, med: 0, high: 0, urgent: 0 };
    for (const t of my.filter((x) => x.column !== "done")) counts[t.priority]++;
    return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
  }, [my]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(my, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `baytasks-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <button onClick={exportJson}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/40 text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h2 className="font-medium mb-4">Weekly performance</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--neon)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="completed" stroke="var(--neon)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-medium mb-4">Open by priority</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byPriority}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="priority" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--neon)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
