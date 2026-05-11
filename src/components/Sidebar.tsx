import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, KanbanSquare, Calendar, BarChart3, Settings, BookOpen, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/board", label: "Boards", icon: KanbanSquare },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/docs", label: "Install & API", icon: BookOpen },
];

export function Sidebar() {
  const loc = useLocation();
  const { boards, activeBoardId, setActiveBoard, addBoard } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-[var(--gradient-neon)] neon-ring">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight">BayTasks</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Focus engine</div>
        </div>
      </div>

      <nav className="px-3 py-2 flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to || (to === "/board" && loc.pathname.startsWith("/board"));
          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-accent border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 mt-4 mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Boards</span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Add board"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addBoard(name.trim());
            setName(""); setAdding(false);
          }}
          className="px-3 mb-2"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New board name"
            className="w-full rounded-md bg-secondary px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      )}

      <div className="px-2 flex flex-col gap-0.5 overflow-y-auto">
        {boards.map((b) => (
          <Link
            key={b.id}
            to="/board"
            onClick={() => setActiveBoard(b.id)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              activeBoardId === b.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            }`}
          >
            <span className="text-base leading-none">{b.emoji}</span>
            <span className="truncate">{b.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto p-4">
        <div className="glass rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Streak</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold neon-text">{useStore.getState().streak.current}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
