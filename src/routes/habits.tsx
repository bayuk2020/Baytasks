/* eslint-disable prettier/prettier */
import GlowButton from "@/components/ui/GlowButton";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore, type Habit } from "@/lib/store";
import { XPBar } from "@/components/habits/XPBar";
import { StatsWidgets } from "@/components/habits/StatsWidgets";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { Heatmap } from "@/components/habits/Heatmap";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Habits — BayTasks" },
      {
        name: "description",
        content: "Daily habit engine with XP, streaks and consistency heatmap.",
      },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const store = useStore();

const habits = store?.habits ?? [];
const loadHabits = store?.loadHabits;
  const [editing, setEditing] = useState<Habit | null | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);
  const visible = (habits ?? []).filter((h) => (showArchived ? h.archived : !h.archived));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Discipline engine</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Forge your <span className="neon-text">daily ritual</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent border border-border"
          >
            <Archive className="h-4 w-4" /> {showArchived ? "Active" : "Archived"}
          </button>
            <GlowButton
            onClick={() => setEditing(null)}
            >
            <Plus className="h-4 w-4" />

            <span>New Habit</span>
            </GlowButton>
        </div>
      </header>

      <StatsWidgets />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <XPBar />
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tip</div>
          <p className="mt-2 text-sm leading-relaxed">
            Complete a habit to gain XP and extend your streak. Levels unlock new ranks — from{" "}
            <span className="neon-text">Awakened</span> to{" "}
            <span className="neon-text">Shadow Monarch</span>.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {showArchived ? "Archived" : "Today"}
          </h2>
          <span className="text-xs text-muted-foreground">{visible.length} habits</span>
        </div>

        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-muted-foreground">No habits yet. Forge your first ritual.</p>
            <button
              onClick={() => setEditing(null)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--gradient-neon)] text-primary-foreground text-sm font-medium neon-ring"
            >
              <Plus className="h-4 w-4" /> Create habit
            </button>
          </div>
        ) : (
          <motion.div
  layout
  className="
    grid
    sm:grid-cols-2
    xl:grid-cols-3
    gap-3

    relative
    z-0
  "
>
            <AnimatePresence>
              {visible.map((h) => (
                <HabitCard key={h.id} habit={h} onEdit={(habit) => setEditing(habit)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    <div className="mt-20">
      <Heatmap />
    </div>
      <AnimatePresence>
        {editing !== undefined && (
          <HabitFormModal habit={editing ?? undefined} onClose={() => setEditing(undefined)} />
        )}
      </AnimatePresence>
    </div>
  );
}
