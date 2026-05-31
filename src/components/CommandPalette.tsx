/* eslint-disable prettier/prettier */
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Search, KanbanSquare, Flame, BookOpen, NotebookPen, ArrowRight, Command } from "lucide-react";

type Item = {
  id: string;
  label: string;
  hint?: string;
  category: "Tasks" | "Habits" | "Journal" | "Boards" | "Pages";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { tasks, habits, journals, boards, setActiveBoard } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) { setQ(""); setActive(0); }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];
    for (const t of tasks) {
      list.push({
        id: `t-${t.id}`, label: t.title,
        hint: `${t.column.replace("_", " ")} · ${t.priority}`,
        category: "Tasks", icon: KanbanSquare,
        action: () => { setActiveBoard(t.boardId); navigate({ to: "/board" }); },
      });
    }
    for (const h of habits.filter((x) => !x.archived)) {
      list.push({
        id: `h-${h.id}`, label: h.title, hint: `${h.emoji} ${h.frequency}`,
        category: "Habits", icon: Flame,
        action: () => navigate({ to: "/habits" }),
      });
    }
    for (const j of journals) {
      list.push({
        id: `j-${j.id}`, label: j.title || "Untitled entry",
        hint: j.tags.map((t) => `#${t}`).join(" ") || "journal",
        category: "Journal", icon: NotebookPen,
        action: () => navigate({ to: "/journal" }),
      });
    }
    for (const b of boards) {
      list.push({
        id: `b-${b.id}`, label: b.name, hint: `${b.emoji} board`,
        category: "Boards", icon: KanbanSquare,
        action: () => { setActiveBoard(b.id); navigate({ to: "/board" }); },
      });
    }
    const pages: Array<[string, string, Item["category"]]> = [
      ["/", "Dashboard", "Pages"],
      ["/board", "Boards", "Pages"],
      ["/habits", "Habits", "Pages"],
      ["/journal", "Journal", "Pages"],
      ["/calendar", "Calendar", "Pages"],
      ["/pomodoro", "Pomodoro", "Pages"],
      ["/analytics", "Analytics", "Pages"],
      ["/settings", "Settings", "Pages"],
    ];
    for (const [to, label] of pages) {
      list.push({
        id: `p-${to}`, label, hint: to, category: "Pages", icon: BookOpen,
        action: () => navigate({ to: to as never }),
      });
    }
    return list;
  }, [tasks, habits, journals, boards, navigate, setActiveBoard]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return items.slice(0, 30);
    return items.filter((i) =>
      i.label.toLowerCase().includes(needle) || i.hint?.toLowerCase().includes(needle)
    ).slice(0, 40);
  }, [items, q]);

  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    filtered.forEach((i) => { (g[i.category] ||= []).push(i); });
    return g;
  }, [filtered]);

  const flatOrder = useMemo(() => Object.values(grouped).flat(), [grouped]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flatOrder.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatOrder[active];
        if (item) { item.action(); onClose(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, active, flatOrder, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-start pt-[14vh] bg-background/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[92vw] max-w-2xl rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-2xl shadow-[0_0_60px_-12px_var(--primary)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-primary" />
              <input
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                placeholder="Search tasks, habits, journal, boards…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">ESC</kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto py-2">
              {flatOrder.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">No results</div>
              ) : (
                Object.entries(grouped).map(([cat, list]) => (
                  <div key={cat} className="px-2 mb-2">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{cat}</div>
                    {list.map((it) => {
                      const idx = flatOrder.indexOf(it);
                      const isActive = idx === active;
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.id}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => { it.action(); onClose(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                            isActive
                              ? "bg-primary/10 border border-primary/40 shadow-[0_0_18px_-8px_var(--primary)]"
                              : "border border-transparent hover:bg-accent"
                          }`}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{it.label}</div>
                            {it.hint && <div className="text-[11px] text-muted-foreground truncate">{it.hint}</div>}
                          </div>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[11px] text-muted-foreground bg-secondary/40">
              <span className="inline-flex items-center gap-1.5"><Command className="h-3 w-3" /> Command Palette</span>
              <span>↑↓ navigate · ↵ select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
