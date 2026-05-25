import { motion, AnimatePresence } from "framer-motion";

import { useEffect, useState } from "react";

import { X } from "lucide-react";

import { type Habit, useStore } from "@/lib/store";

const EMOJIS = [
  "🔥",
  "⚡",
  "🧠",
  "💪",
  "📚",
  "🧘",
  "💧",
  "🥗",
  "🏃",
  "✍️",
  "🎯",
  "🌙",
  "☀️",
  "🧹",
  "💻",
  "🎨",
  "🎧",
  "🧪",
  "🛏️",
  "🚫",
];

const COLORS = ["cyan", "violet", "emerald", "amber", "rose", "sky"];

const SWATCH: Record<string, string> = {
  cyan: "oklch(0.78 0.18 200)",

  violet: "oklch(0.72 0.18 295)",

  emerald: "oklch(0.74 0.16 160)",

  amber: "oklch(0.82 0.15 80)",

  rose: "oklch(0.72 0.2 18)",

  sky: "oklch(0.78 0.16 235)",
};

type Props = {
  habit?: Habit | null;

  onClose: () => void;
};

export function HabitFormModal({ habit, onClose }: Props) {
  const {
    addHabit,

    updateHabit,
  } = useStore();

  const [title, setTitle] = useState(habit?.title ?? "");

  const [description, setDescription] = useState(habit?.description ?? "");

  const [emoji, setEmoji] = useState(habit?.emoji ?? "🔥");

  const [color, setColor] = useState(habit?.color ?? "cyan");

  const [frequency, setFrequency] = useState<"daily" | "weekly">(habit?.frequency ?? "daily");

  const [xp, setXp] = useState(habit?.xp_per_completion ?? 25);

  const [target, setTarget] = useState(habit?.target ?? 1);

  // =========================
  // ESC CLOSE
  // =========================

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // =========================
  // SUBMIT
  // =========================

  async function submit() {
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),

      description,

      emoji,

      color,

      frequency,

      target,

      xp_per_completion: xp,
    };

    if (habit) {
      await updateHabit(Number(habit.id), payload);
    } else {
      await addHabit(payload);
    }

    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className="
          fixed
          inset-0

          z-50

          grid
          place-items-center

          bg-black/60

          backdrop-blur-sm

          p-4
        "
        onClick={onClose}
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.96,
            y: 8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 28,
          }}
          onClick={(e) => e.stopPropagation()}
          className="
            relative

            w-full
            max-w-lg

            rounded-2xl

            p-6

            glass-strong
          "
        >
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="
              absolute
              right-3
              top-3

              h-8
              w-8

              grid
              place-items-center

              rounded-md

              hover:bg-accent
            "
          >
            <X
              className="
                h-4
                w-4
              "
            />
          </button>

          {/* HEADER */}
          <h2
            className="
              text-lg
              font-semibold
              tracking-tight
            "
          >
            {habit ? "Edit Habit" : "New Habit"}
          </h2>

          <p
            className="
              mt-1

              text-xs
              text-muted-foreground
            "
          >
            Build your daily ritual.
          </p>

          {/* FORM */}
          <div
            className="
              mt-5
              space-y-4
            "
          >
            {/* TITLE */}
            <div>
              <label
                className="
                  text-[10px]
                  uppercase

                  tracking-[0.18em]

                  text-muted-foreground
                "
              >
                Title
              </label>

              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="
                  e.g. Read 10 pages
                "
                className="
                  mt-1.5

                  w-full

                  rounded-lg

                  bg-secondary

                  px-3
                  py-2.5

                  text-sm

                  outline-none

                  focus:ring-1
                  focus:ring-ring
                "
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                className="
                  text-[10px]
                  uppercase

                  tracking-[0.18em]

                  text-muted-foreground
                "
              >
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="
                  mt-1.5

                  w-full

                  rounded-lg

                  bg-secondary

                  px-3
                  py-2.5

                  text-sm

                  outline-none

                  focus:ring-1
                  focus:ring-ring
                "
              />
            </div>

            {/* EMOJI */}
            <div>
              <label
                className="
                  text-[10px]
                  uppercase

                  tracking-[0.18em]

                  text-muted-foreground
                "
              >
                Emoji
              </label>

              <div
                className="
                  mt-1.5

                  flex
                  flex-wrap

                  gap-1.5
                "
              >
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`
                        h-9
                        w-9

                        rounded-lg

                        border

                        grid
                        place-items-center

                        text-lg

                        transition

                        ${
                          emoji === e
                            ? `
                              border-[var(--neon)]

                              bg-accent
                            `
                            : `
                              border-border

                              hover:bg-accent
                            `
                        }
                      `}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* COLORS */}
            <div>
              <label
                className="
                  text-[10px]
                  uppercase

                  tracking-[0.18em]

                  text-muted-foreground
                "
              >
                Aura Color
              </label>

              <div
                className="
                  mt-1.5

                  flex
                  gap-2
                "
              >
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`
                        h-8
                        w-8

                        rounded-full

                        border-2

                        transition

                        ${
                          color === c
                            ? `
                              scale-110
                            `
                            : `
                              border-transparent
                            `
                        }
                      `}
                    style={{
                      background: SWATCH[c],

                      borderColor: color === c ? "white" : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* GRID */}
            <div
              className="
                grid
                grid-cols-2

                gap-3
              "
            >
              {/* FREQUENCY */}
              <div>
                <label
                  className="
                    text-[10px]
                    uppercase

                    tracking-[0.18em]

                    text-muted-foreground
                  "
                >
                  Frequency
                </label>

                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
                  className="
                    mt-1.5

                    w-full

                    rounded-lg

                    bg-secondary

                    px-3
                    py-2.5

                    text-sm

                    outline-none

                    focus:ring-1
                    focus:ring-ring
                  "
                >
                  <option value="daily">Daily</option>

                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* XP */}
              <div>
                <label
                  className="
                    text-[10px]
                    uppercase

                    tracking-[0.18em]

                    text-muted-foreground
                  "
                >
                  XP Reward
                </label>

                <input
                  type="number"
                  min={1}
                  max={200}
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                  className="
                    mt-1.5

                    w-full

                    rounded-lg

                    bg-secondary

                    px-3
                    py-2.5

                    text-sm

                    outline-none

                    focus:ring-1
                    focus:ring-ring
                  "
                />
              </div>
            </div>

            {/* TARGET */}
            <div>
              <label
                className="
                  text-[10px]
                  uppercase

                  tracking-[0.18em]

                  text-muted-foreground
                "
              >
                Daily Target
              </label>

              <input
                type="number"
                min={1}
                max={20}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="
                  mt-1.5

                  w-full

                  rounded-lg

                  bg-secondary

                  px-3
                  py-2.5

                  text-sm

                  outline-none

                  focus:ring-1
                  focus:ring-ring
                "
              />
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="
              mt-6

              flex
              items-center
              justify-end

              gap-2
            "
          >
            <button
              onClick={onClose}
              className="
                rounded-lg

                px-4
                py-2

                text-sm

                hover:bg-accent
              "
            >
              Cancel
            </button>

            <button
              onClick={submit}
              className="
                rounded-lg

                bg-[var(--gradient-neon)]

                px-4
                py-2

                text-sm
                font-medium

                text-primary-foreground

                transition

                hover:scale-[1.02]

                neon-ring
              "
            >
              {habit ? "Save" : "Create"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
