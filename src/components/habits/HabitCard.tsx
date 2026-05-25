import { motion } from "framer-motion";

import { Check, Flame, MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";

import { useMemo, useState } from "react";

import { type Habit, useStore, todayKey } from "@/lib/store";

const COLOR_VAR: Record<string, string> = {
  cyan: "oklch(0.78 0.18 200)",

  violet: "oklch(0.72 0.18 295)",

  emerald: "oklch(0.74 0.16 160)",

  amber: "oklch(0.82 0.15 80)",

  rose: "oklch(0.72 0.2 18)",

  sky: "oklch(0.78 0.16 235)",
};

type Props = {
  habit: Habit;

  onEdit: (h: Habit) => void;
};

export function HabitCard({ habit, onEdit }: Props) {
  const {
    habitLogs,

    toggleHabit,

    archiveHabit,

    removeHabit,
  } = useStore();

  const [menu, setMenu] = useState(false);

  const today = todayKey();

  // =========================
  // DONE TODAY
  // =========================

  const done = useMemo(() => {
    return habitLogs.some((l) => Number(l.habitId) === Number(habit.id) && l.date === today);
  }, [habitLogs, habit.id, today]);

  // =========================
  // STREAK
  // =========================

  const streak = useMemo(() => {
    let total = 0;

    for (let i = 0; i < 365; i++) {
      const d = new Date();

      d.setDate(d.getDate() - i);

      const key = todayKey(d);

      const exists = habitLogs.some(
        (l) => Number(l.habitId) === Number(habit.id) && l.date === key,
      );

      if (exists) {
        total++;
      } else if (i !== 0) {
        break;
      }
    }

    return total;
  }, [habitLogs, habit.id]);

  // =========================
  // COLOR
  // =========================

  const accent = COLOR_VAR[habit.color] ?? COLOR_VAR.cyan;

  return (
    <motion.div
      layout
      whileHover={{
        y: -3,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      className={`
        relative

        overflow-visible
        z-[9999]
        rounded-2xl

        border

        p-4

        glass
        hover-lift
        group

        transition-all
      `}
      style={{
        zIndex: menu ? 999 : 1,

        borderColor: done ? `color-mix(in oklab, ${accent} 40%, transparent)` : undefined,

        boxShadow: done
          ? `
            0 0 0 1px color-mix(in oklab, ${accent} 30%, transparent),
            0 0 40px color-mix(in oklab, ${accent} 18%, transparent)
          `
          : undefined,
      }}
    >
      {/* BG GLOW */}
      <div
        className="
          absolute
          inset-0

          pointer-events-none

          bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]
        "
      />

      <div
        className="
          relative
          z-10

          flex
          items-start
          gap-3
        "
      >
        {/* CHECK */}
        <button
          onClick={() => toggleHabit(Number(habit.id))}
          aria-pressed={done}
          className="
            relative

            h-11
            w-11

            shrink-0

            rounded-xl

            border

            grid
            place-items-center

            transition-all
          "
          style={{
            background: done
              ? `color-mix(in oklab, ${accent} 20%, transparent)`
              : "var(--secondary)",

            borderColor: done ? accent : "var(--border)",

            boxShadow: done
              ? `0 0 25px color-mix(in oklab, ${accent} 45%, transparent)`
              : undefined,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: done ? 1 : 0,

              opacity: done ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20,
            }}
          >
            <Check
              className="
                h-5
                w-5
              "
              style={{
                color: accent,
              }}
            />
          </motion.div>

          {!done && (
            <span
              className="
                text-lg
              "
            >
              {habit.emoji}
            </span>
          )}
        </button>

        {/* CONTENT */}
        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                truncate

                text-base
                font-medium
              "
            >
              {habit.title}
            </span>

            {streak > 1 && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1

                  rounded-md

                  bg-secondary

                  px-1.5
                  py-0.5

                  text-[11px]
                  text-muted-foreground
                "
              >
                <Flame
                  className="
                    h-3
                    w-3
                  "
                  style={{
                    color: accent,
                  }}
                />

                {streak}
              </span>
            )}
          </div>

          <div
            className="
              mt-1

              flex
              items-center
              gap-2

              text-xs
              text-muted-foreground
            "
          >
            <span
              className="
                capitalize
              "
            >
              {habit.frequency}
            </span>

            <span>·</span>

            <span>
              +{habit.xp_per_completion}
              XP
            </span>
          </div>
        </div>

        {/* MENU */}
        <div
          className="
            relative
          "
        >
          <button
            onClick={() => setMenu((v) => !v)}
            className="
              h-8
              w-8

              grid
              place-items-center

              rounded-md

              text-muted-foreground

              transition

              hover:bg-accent
              hover:text-foreground

              opacity-0
              group-hover:opacity-100
            "
          >
            <MoreHorizontal
              className="
                h-4
                w-4
              "
            />
          </button>

          {menu && (
            <div
              onMouseLeave={() => setMenu(false)}
              className="
                absolute
                right-0
                top-9

                z-9999

                w-40

                rounded-lg

                p-1

                text-sm

                glass-strong

                shadow-xl
              "
            >
              {/* EDIT */}
              <button
                onClick={() => {
                  setMenu(false);

                  onEdit(habit);
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2

                  rounded-md

                  px-2
                  py-1.5

                  hover:bg-accent
                "
              >
                <Pencil
                  className="
                    h-3.5
                    w-3.5
                  "
                />
                Edit
              </button>

              {/* ARCHIVE */}
              <button
                onClick={() => {
                  setMenu(false);

                  archiveHabit(Number(habit.id));
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2

                  rounded-md

                  px-2
                  py-1.5

                  hover:bg-accent
                "
              >
                <Archive
                  className="
                    h-3.5
                    w-3.5
                  "
                />
                Archive
              </button>

              {/* DELETE */}
              <button
                onClick={() => {
                  setMenu(false);

                  removeHabit(Number(habit.id));
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2

                  rounded-md

                  px-2
                  py-1.5

                  text-destructive

                  hover:bg-accent
                "
              >
                <Trash2
                  className="
                    h-3.5
                    w-3.5
                  "
                />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
