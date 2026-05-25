/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";

import { useStore } from "@/lib/store";

import { useMemo } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";

import { Download, Sparkles, CheckCircle2, AlertTriangle, Clock3, Activity } from "lucide-react";

import { motion } from "framer-motion";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      {
        title: "Analytics — BayTasks",
      },
    ],
  }),

  component: Analytics,
});

function Analytics() {
  const { tasks, activeBoardId } = useStore();

  const my = tasks.filter((t) => t.boardId === activeBoardId);

  // =========================
  // WEEKLY STATS
  // =========================

  const last14 = useMemo(() => {
    const days = Array.from(
      {
        length: 14,
      },

      (_, i) => {
        const d = new Date();

        d.setHours(0, 0, 0, 0);

        d.setDate(d.getDate() - (13 - i));

        return d;
      },
    );

    return days.map((d) => {
      const next = new Date(d);

      next.setDate(d.getDate() + 1);

      const completed = my.filter((t) => {
        if (t.column !== "done") return false;

        if (!t.completedAt) return false;

        return t.completedAt >= d.getTime() && t.completedAt < next.getTime();
      }).length;
      const created = my.filter(
        (t) => t.createdAt >= d.getTime() && t.createdAt < next.getTime(),
      ).length;

      return {
        day: d.toLocaleDateString(
          undefined,

          {
            month: "short",

            day: "numeric",
          },
        ),

        completed,

        created,
      };
    });
  }, [my]);

  // =========================
  // PRIORITY DATA
  // =========================

  const byPriority = useMemo(() => {
    const counts: Record<string, number> = {
      low: 0,

      med: 0,

      high: 0,

      urgent: 0,
    };

    for (const t of my.filter((x) => x.column !== "done")) {
      counts[t.priority]++;
    }

    return Object.entries(counts).map(([priority, count]) => ({
      priority,

      count,
    }));
  }, [my]);

  // =========================
  // KPI
  // =========================

  const completed = my.filter((t) => t.column === "done").length;

  const open = my.filter((t) => t.column !== "done").length;

  const overdue = my.filter((t) => t.dueAt && t.dueAt < Date.now() && t.column !== "done").length;

  const completionRate = my.length ? Math.round((completed / my.length) * 100) : 0;

  // =========================
  // EXPORT
  // =========================

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify(my, null, 2)],

      {
        type: "application/json",
      },
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `baytasks-${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // BAR COLORS
  // =========================

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "#ef4444";

      case "high":
        return "#f97316";

      case "med":
        return "#06b6d4";

      default:
        return "#06b6d4";
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <motion.header
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          relative

          overflow-hidden

          rounded-3xl

          border
          border-cyan-500/10

          bg-gradient-to-br
          from-cyan-500/[0.04]
          via-background
          to-blue-500/[0.03]

          p-6

          shadow-[0_0_50px_rgba(34,211,238,0.06)]
        "
      >
        {/* AURA */}
        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)]

            pointer-events-none
          "
        />

        <div className="relative z-10 flex items-center justify-between">
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight

                  bg-gradient-to-r
                  from-cyan-100
                  via-cyan-300
                  to-blue-400

                  bg-clip-text
                  text-transparent
                "
              >
                Analytics
              </h1>

              <Sparkles
                className="
                  h-5
                  w-5
                  text-cyan-300
                "
              />
            </div>

            <p
              className="
                text-sm
                text-muted-foreground
                mt-1
              "
            >
              Track productivity, performance, and workflow trends.
            </p>
          </div>

          {/* RIGHT */}
          <button
            onClick={exportJson}
            className="
              inline-flex
              items-center
              gap-2

              px-4
              py-2

              rounded-xl

              border
              border-cyan-400/20

              bg-cyan-500/10

              text-cyan-100
              text-sm

              hover:bg-cyan-500/20

              transition
            "
          >
            <Download
              className="
                h-4
                w-4
              "
            />
            Export
          </button>
        </div>
      </motion.header>

      {/* ========================= */}
      {/* KPI */}
      {/* ========================= */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4

          gap-4
        "
      >
        <KPI
          title="Open Tasks"
          value={open}
          icon={<Clock3 className="h-5 w-5" />}
          glow="
            from-cyan-500/40 via-cyan-400/20 to-blue-500/30
          "
        />

        <KPI
          title="Completed"
          value={completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          glow="
from-emerald-500/40 via-emerald-400/20 to-green-500/30
          "
        />

        <KPI
          title="Overdue"
          value={overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          glow="
from-red-500/40 via-rose-400/20 to-orange-500/30
          "
        />

        <KPI
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<Activity className="h-5 w-5" />}
          glow="
from-violet-500/40 via-fuchsia-400/20 to-indigo-500/30
          "
        />
      </div>

      {/* ========================= */}
      {/* CHARTS */}
      {/* ========================= */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-3

          gap-5
        "
      >
        {/* AREA */}
        <motion.div
          whileHover={{
            y: -2,
          }}
          className="
            xl:col-span-2

            glass

            rounded-3xl

            p-5

            border
            border-border/40
          "
        >
          <h2
            className="
              font-medium
              mb-4
            "
          >
            Weekly Performance
          </h2>

          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />

                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{
                    fontSize: 11,
                  }}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",

                    border: "1px solid rgba(255,255,255,0.08)",

                    borderRadius: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#06b6d4"
                  fill="url(#g1)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* BAR */}
        <motion.div
          whileHover={{
            y: -2,
          }}
          className="
            glass

            rounded-3xl

            p-5

            border
            border-border/40
          "
        >
          <h2
            className="
              font-medium
              mb-4
            "
          >
            Open by Priority
          </h2>

          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={byPriority}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="priority"
                  stroke="#94a3b8"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{
                    fontSize: 11,
                  }}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",

                    border: "1px solid rgba(255,255,255,0.08)",

                    borderRadius: 12,
                  }}
                />

                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {byPriority.map((entry, i) => (
                    <Cell key={i} fill={priorityColor(entry.priority)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =========================
// KPI CARD
// =========================

function KPI({
  title,
  value,
  icon,
  glow,
}: {
  title: string;

  value: string | number;

  icon: React.ReactNode;

  glow: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className={`
        relative

        overflow-hidden

        rounded-3xl

        border
        border-border/40

        bg-gradient-to-br
        ${glow}

        p-5

        shadow-[0_0_30px_rgba(0,0,0,0.15)]
      `}
    >
      {/* GLOW */}
      <div
        className="
          absolute
          inset-0

          bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]

          pointer-events-none
        "
      />

      <div
        className="
          relative
          z-10

          flex
          items-start
          justify-between
        "
      >
        <div>
          <div
            className="
              text-sm
              text-muted-foreground
            "
          >
            {title}
          </div>

          <div
            className="
              mt-2

              text-3xl
              font-bold
            "
          >
            {value}
          </div>
        </div>

        <div
          className="
            h-11
            w-11

            rounded-2xl

            bg-white/5

            border
            border-white/10

            flex
            items-center
            justify-center
          "
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
