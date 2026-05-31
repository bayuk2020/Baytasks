/* eslint-disable prettier/prettier */
import { Search, Sun, Moon, Command } from "lucide-react";
import { useStore } from "@/lib/store";
import { NotificationBell } from "./NotificationCenter";

export function Topbar({ onSearch, search, onOpenPalette }: {
  onSearch?: (q: string) => void;
  search?: string;
  onOpenPalette?: () => void;
}) {
  const { theme, toggleTheme } = useStore();

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
          onClick={onOpenPalette}
          className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition text-xs text-muted-foreground"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Quick find</span>
          <kbd className="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </button>
        <button
          onClick={toggleTheme}
          className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}