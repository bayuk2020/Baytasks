import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  Repeat,
  CheckCircle2,
  Sparkles,
  Flame,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore, type NotifType } from "@/lib/store";

const iconFor: Record<NotifType, React.ComponentType<{ className?: string }>> = {
  task_overdue: AlertTriangle,
  habit_missed: Flame,
  pomodoro_done: Clock,
  recurring_created: Repeat,
  task_completed: CheckCircle2,
  info: Sparkles,
};

const accentFor: Record<NotifType, string> = {
  task_overdue: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  habit_missed: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  pomodoro_done: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  recurring_created: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  task_completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  info: "text-primary bg-primary/10 border-primary/30",
};

function relative(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } =
    useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 grid place-items-center rounded-lg border border-border hover:border-primary/40 transition"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center pulse-neon"
          >
            {unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 z-40 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-2xl shadow-[0_0_50px_-16px_var(--primary)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-[11px] text-muted-foreground">{unread} unread</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllNotificationsRead}
                  title="Mark all read"
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearNotifications}
                  title="Clear all"
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">All clear ✨</div>
              ) : (
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => {
                      const Icon = iconFor[n.type];
                      return (
                        <motion.li
                          key={n.id}
                          layout
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          onClick={() => markNotificationRead(n.id)}
                          className={`relative rounded-xl p-3 border cursor-pointer transition-all ${
                            n.read
                              ? "border-border bg-secondary/30"
                              : "border-primary/30 bg-primary/5 shadow-[0_0_18px_-10px_var(--primary)]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-8 w-8 grid place-items-center rounded-lg border ${accentFor[n.type]}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{n.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {n.message}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {relative(n.createdAt)}
                              </div>
                            </div>
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-primary mt-1.5 pulse-neon" />
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
