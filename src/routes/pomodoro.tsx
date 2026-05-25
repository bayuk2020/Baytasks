import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Sparkles,
} from "lucide-react";

export const Route =
  createFileRoute(
    "/pomodoro"
  )({

    head: () => ({

      meta: [
        {
          title:
            "Pomodoro — BayTasks",
        },
      ],
    }),

    component:
      PomodoroPage,
  });

function PomodoroPage() {

  // =========================
  // DEFAULTS
  // =========================

  const [
    focusMinutes,
    setFocusMinutes,
  ] = useState(25);

  const [
    shortBreak,
    setShortBreak,
  ] = useState(5);

  const [
    longBreak,
    setLongBreak,
  ] = useState(15);

  // =========================
  // MODE
  // =========================

  const [
    mode,
    setMode,
  ] = useState<
    "focus" |
    "short" |
    "long"
  >("focus");

  // =========================
  // TIMER
  // =========================

  const duration =
    useMemo(() => {

      switch (mode) {

        case "short":
          return shortBreak * 60;

        case "long":
          return longBreak * 60;

        default:
          return focusMinutes * 60;
      }

    }, [

      mode,

      focusMinutes,

      shortBreak,

      longBreak,
    ]);

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(duration);

  const [
    running,
    setRunning,
  ] = useState(false);

  // =========================
  // RESET WHEN MODE CHANGED
  // =========================

  useEffect(() => {

    setSecondsLeft(
      duration
    );

  }, [

    duration,
    mode,
  ]);

  // =========================
  // TIMER LOOP
  // =========================

  useEffect(() => {

    if (
      !running
    ) return;

    const interval =
      setInterval(() => {

        setSecondsLeft(
          (s) => {

            if (
              s <= 1
            ) {

              setRunning(false);

              // SOUND
              new Audio(
                "https://assets.mixkit.co/active_storage/sfx/2310/2310-preview.mp3"
              ).play();

              return 0;
            }

            return s - 1;
          }
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, [running]);

  // =========================
  // FORMAT
  // =========================

  const mm =
    String(

      Math.floor(
        secondsLeft / 60
      )

    ).padStart(2, "0");

  const ss =
    String(

      secondsLeft % 60

    ).padStart(2, "0");

  // =========================
  // PROGRESS
  // =========================

  const progress =

    (
      secondsLeft /
      duration
    ) * 100;

  return (

    <div className="space-y-6">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <motion.div

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

        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)]

            pointer-events-none
          "
        />

        <div className="relative z-10">

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
              Pomodoro
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
            Deep focus engine for productivity sessions.
          </p>

        </div>
      </motion.div>

      {/* ========================= */}
      {/* MODES */}
      {/* ========================= */}

      <div
        className="
          flex
          flex-wrap
          gap-3
        "
      >

        <ModeButton

          active={
            mode === "focus"
          }

          onClick={() =>
            setMode(
              "focus"
            )
          }

          icon={
            <Brain className="h-4 w-4" />
          }

          label="Focus"
        />

        <ModeButton

          active={
            mode === "short"
          }

          onClick={() =>
            setMode(
              "short"
            )
          }

          icon={
            <Coffee className="h-4 w-4" />
          }

          label="Short Break"
        />

        <ModeButton

          active={
            mode === "long"
          }

          onClick={() =>
            setMode(
              "long"
            )
          }

          icon={
            <Coffee className="h-4 w-4" />
          }

          label="Long Break"
        />

      </div>

      {/* ========================= */}
      {/* TIMER */}
      {/* ========================= */}

      <motion.div

        initial={{
          opacity: 0,
          scale: 0.96,
        }}

        animate={{
          opacity: 1,
          scale: 1,
        }}

        className="
          relative

          overflow-hidden

          glass

          rounded-[2rem]

          border
          border-cyan-400/10

          p-10

          flex
          flex-col
          items-center

          shadow-[0_0_80px_rgba(34,211,238,0.08)]
        "
      >

        {/* GLOW */}
        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_60%)]

            pointer-events-none
          "
        />

        {/* RING */}
        <div
          className="
            relative

            h-72
            w-72

            rounded-full

            flex
            items-center
            justify-center
          "
        >

          {/* BACK */}
          <div
            className="
              absolute
              inset-0

              rounded-full

              border-[10px]
              border-white/5
            "
          />

          {/* PROGRESS */}
          <motion.div

            animate={{
              background: `
                conic-gradient(
                  #06b6d4 ${progress}%,
                  rgba(255,255,255,0.06) ${progress}%
                )
              `,
            }}

            className="
              absolute
              inset-0

              rounded-full
            "
          />

          {/* CENTER */}
          <div
            className="
              absolute

              h-[88%]
              w-[88%]

              rounded-full

              bg-background/90

              backdrop-blur-xl

              border
              border-white/5

              flex
              flex-col
              items-center
              justify-center
            "
          >

            <div
              className="
                text-6xl
                font-black

                tracking-tight

                bg-gradient-to-r
                from-cyan-100
                via-cyan-300
                to-blue-400

                bg-clip-text
                text-transparent
              "
            >
              {mm}:{ss}
            </div>

            <div
              className="
                mt-2

                text-sm
                uppercase

                tracking-[0.2em]

                text-muted-foreground
              "
            >
              {mode}
            </div>

          </div>
        </div>

        {/* CONTROLS */}
        <div
          className="
            mt-8

            flex
            items-center
            gap-3
          "
        >

          <button

            onClick={() =>
              setRunning(
                !running
              )
            }

            className="
              h-14
              px-6

              rounded-2xl

              bg-cyan-500/15

              border
              border-cyan-400/20

              text-cyan-100

              flex
              items-center
              gap-2

              hover:bg-cyan-500/25

              transition
            "
          >

            {

              running

                ? (
                  <Pause className="h-5 w-5" />
                )

                : (
                  <Play className="h-5 w-5" />
                )
            }

            {
              running
                ? "Pause"
                : "Start"
            }

          </button>

          <button

            onClick={() => {

              setRunning(false);

              setSecondsLeft(
                duration
              );
            }}

            className="
              h-14
              px-6

              rounded-2xl

              bg-secondary/40

              border
              border-border

              flex
              items-center
              gap-2

              hover:border-cyan-400/20

              transition
            "
          >

            <RotateCcw
              className="
                h-5
                w-5
              "
            />

            Reset
          </button>
        </div>
      </motion.div>

      {/* ========================= */}
      {/* SETTINGS */}
      {/* ========================= */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3

          gap-4
        "
      >

        <SettingCard

          title="Focus"

          value={focusMinutes}

          onChange={
            setFocusMinutes
          }
        />

        <SettingCard

          title="Short Break"

          value={shortBreak}

          onChange={
            setShortBreak
          }
        />

        <SettingCard

          title="Long Break"

          value={longBreak}

          onChange={
            setLongBreak
          }
        />
      </div>
    </div>
  );
}

// =========================
// MODE BUTTON
// =========================

function ModeButton({

  active,
  onClick,
  icon,
  label,

}: any) {

  return (

    <button

      onClick={onClick}

      className={`
        px-4
        py-2

        rounded-2xl

        border

        flex
        items-center
        gap-2

        transition

        ${
          active

            ? `
              border-cyan-400/30
              bg-cyan-500/15
              text-cyan-100
            `

            : `
              border-border
              bg-secondary/30
              hover:border-cyan-400/20
            `
        }
      `}
    >

      {icon}

      {label}
    </button>
  );
}

// =========================
// SETTINGS CARD
// =========================

function SettingCard({

  title,
  value,
  onChange,

}: any) {

  return (

    <div
      className="
        glass

        rounded-3xl

        p-5

        border
        border-border/40
      "
    >

      <div
        className="
          text-sm
          text-muted-foreground
        "
      >
        {title}
      </div>

      <input

        type="number"

        min={1}

        value={value}

        onChange={(e) =>
          onChange(
            Number(
              e.target.value
            )
          )
        }

        className="
          mt-3

          w-full

          rounded-2xl

          border
          border-border

          bg-secondary/30

          px-4
          py-3

          outline-none

          focus:border-cyan-400/30
        "
      />

      <div
        className="
          mt-2

          text-xs
          text-muted-foreground
        "
      >
        Minutes
      </div>
    </div>
  );
}