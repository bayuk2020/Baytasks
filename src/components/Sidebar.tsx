/* eslint-disable prettier/prettier */
import { Link, useLocation } from "@tanstack/react-router";

import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  BarChart3,
  Settings,
  BookOpen,
  Plus,
  Sparkles,
  Timer,
  NotebookPen,
  Library
} from "lucide-react";

import {
  Flame,
} from "lucide-react";

import { motion } from "framer-motion";

import { useStore } from "@/lib/store";

import { useState, useEffect } from "react";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    to: "/board",
    label: "Boards",
    icon: KanbanSquare,
  },

  {
  to: "/habits",
  label: "Habits",
  icon: Flame,
},

{
  to: "/journal",
  label: "Journal",
  icon: NotebookPen,
},
  { to: "/library", label: "Reading Vault", icon: Library },
  {
    to: "/calendar",
    label: "Calendar",
    icon: Calendar,
  },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer },

  {
    to: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },

  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },

  {
    to: "/docs",
    label: "Install & API",
    icon: BookOpen,
  },
];

export function Sidebar() {
  const loc = useLocation();

  const {
    boards,

    activeBoardId,

    streak,

    setActiveBoard,

    addBoard,

    loadBoards,
  } = useStore();

  const [adding, setAdding] = useState(false);

  const [name, setName] = useState("");

  const [emoji, setEmoji] = useState("🚀");

  // =========================
  // STREAK CALCULATION
  // =========================

  const completedDays = Array.from(
    new Set(
      useStore

        .getState()

        .tasks.filter((t) => t.completedAt)

        .map((t) => {
          const d = new Date(t.completedAt!);

          d.setHours(0, 0, 0, 0);

          return d.getTime();
        }),
    ),
  )

    .sort((a, b) => b - a);

  let streakCount = 0;

  for (let i = 0; i < completedDays.length; i++) {
    if (i === 0) {
      streakCount++;

      continue;
    }

    const diff = completedDays[i - 1] - completedDays[i];

    if (diff === 86400000) {
      streakCount++;
    } else {
      break;
    }
  }

  // =========================
  // LOAD BOARDS
  // =========================

  useEffect(() => {
    loadBoards();
  }, []);

  return (
    <aside
      className="
        hidden
        md:flex

        w-64
        shrink-0

        flex-col

        border-r
        border-sidebar-border

        bg-sidebar/80

        backdrop-blur-xl
      "
    >
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div
        className="
          px-5
          py-5

          flex
          items-center
          gap-2
        "
      >
        <div
          className="
            h-9
            w-9

            rounded-xl

            grid
            place-items-center

            bg-[var(--gradient-neon)]

            neon-ring
          "
        >
          <Sparkles
            className="
              h-5
              w-5

              text-primary-foreground
            "
          />
        </div>

        <div>
          <div
            className="
              text-base
              font-semibold
              tracking-tight
            "
          >
            BayTasks
          </div>

          <div
            className="
              text-[10px]
              uppercase

              tracking-[0.18em]

              text-muted-foreground
            "
          >
            Focus engine
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* NAVIGATION */}
      {/* ========================= */}

      <nav
        className="
          px-3
          py-2

          flex
          flex-col

          gap-0.5
        "
      >
        {navItems.map(({ to, label, icon: Icon }) => {
          const active =
            loc.pathname === to || (to === "/board" && loc.pathname.startsWith("/board"));

          return (
            <Link
              key={to}
              to={to}
              className={`
                group
                relative

                flex
                items-center
                gap-3

                rounded-lg

                px-3
                py-2

                text-sm

                transition-colors

                ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="
                    absolute
                    inset-0

                    rounded-lg

                    bg-accent

                    border
                    border-border
                  "
                  transition={{
                    type: "spring",

                    stiffness: 400,

                    damping: 32,
                  }}
                />
              )}

              <Icon
                className="
                  relative
                  h-4
                  w-4
                "
              />

              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ========================= */}
      {/* BOARDS HEADER */}
      {/* ========================= */}

      <div
        className="
          px-5
          mt-4
          mb-2

          flex
          items-center
          justify-between
        "
      >
        <span
          className="
            text-[10px]
            uppercase

            tracking-[0.18em]

            text-muted-foreground
          "
        >
          Boards
        </span>

        <button
          onClick={() => setAdding((v) => !v)}
          className="
            h-6
            w-6

            grid
            place-items-center

            rounded-md

            text-muted-foreground

            hover:text-foreground
            hover:bg-accent
          "
          aria-label="Add board"
        >
          <Plus
            className="
              h-3.5
              w-3.5
            "
          />
        </button>
      </div>

      {/* ========================= */}
      {/* ADD BOARD FORM */}
      {/* ========================= */}

      {adding && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!name.trim()) return;

            await addBoard(
              name.trim(),

              emoji,
            );

            setName("");

            setEmoji("🚀");

            setAdding(false);
          }}
          className="
            px-3
            mb-2
          "
        >
          <div className="flex gap-2 items-center">
            {/* EMOJI */}
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🚀"
              className="
                w-14

                rounded-md

                bg-secondary

                px-2
                py-1.5

                text-sm

                outline-none

                focus:ring-1
                focus:ring-ring
              "
            />

            {/* NAME */}
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New board name"
              className="
                flex-1

                rounded-md

                bg-secondary

                px-2.5
                py-1.5

                text-sm

                outline-none

                focus:ring-1
                focus:ring-ring
              "
            />
          </div>
          <button
            type="submit"
            className="
              mt-2
              w-full

              rounded-md

              bg-cyan-500/20

              border
              border-cyan-400/20

              px-3
              py-1.5

              text-sm
              text-cyan-200

              hover:bg-cyan-500/30
              transition
            "
          >
            Create Board
          </button>
        </form>
      )}

      {/* ========================= */}
      {/* BOARDS */}
      {/* ========================= */}

      <div
        className="
          px-2

          flex
          flex-col

          gap-0.5

          overflow-y-auto
        "
      >
        {boards.map((b) => (
          <Link
            key={b.id}
            to="/board"
            onClick={() => setActiveBoard(b.id)}
            className={`
              flex
              items-center
              gap-2.5

              rounded-lg

              px-3
              py-1.5

              text-sm

              transition-colors

              ${
                activeBoardId === b.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }
            `}
          >
            <span
              className="
                text-base
                leading-none
              "
            >
              {b.emoji}
            </span>

            <span className="truncate">{b.name}</span>
          </Link>
        ))}
      </div>

      {/* ========================= */}
      {/* STREAK */}
      {/* ========================= */}

      <div
        className="
          mt-auto
          p-4
        "
      >
        <div
          className="
            glass
            rounded-xl
            p-3
          "
        >
          <div
            className="
              text-xs
              text-muted-foreground
            "
          >
            Streak
          </div>

          <div
            className="
              mt-1

              flex
              items-baseline
              gap-1.5
            "
          >
            <span
              className="
                text-2xl
                font-semibold
                neon-text
              "
            >
              {streakCount}
            </span>

            <span
              className="
                text-xs
                text-muted-foreground
              "
            >
              days
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
