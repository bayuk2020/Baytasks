import { Bell, Search, Sun, Moon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useReminders } from "@/lib/useReminders";
import { useState } from "react";

export function Topbar({ onSearch, search }: { onSearch?: (q: string) => void; search?: string }) {
  const { theme, toggleTheme } = useStore();
  const { active } = useReminders();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border">
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search tasks, tags, boards…"
            className="w-full rounded-lg bg-secondary/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={toggleTheme}
          className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {active.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center pulse-neon">
                {active.length}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 glass-strong rounded-xl p-3 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reminders</div>
              {active.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">All clear ✨</div>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {active.map((t) => (
                    <li key={t.id} className="rounded-lg p-2.5 bg-secondary/60 border border-border">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.dueAt ? new Date(t.dueAt).toLocaleString() : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
