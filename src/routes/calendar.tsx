import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useStore,
} from "@/lib/store";

import {
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  TaskModal,
} from "@/components/TaskModal";

import {
  motion,
} from "framer-motion";

export const Route =
  createFileRoute(
    "/calendar"
  )({

    head: () => ({

      meta: [
        {
          title:
            "Calendar — BayTasks",
        },
      ],
    }),

    component:
      CalendarPage,
  });

function CalendarPage() {

  const {
    tasks,
    activeBoardId,
  } = useStore();

  const [
    cursor,
    setCursor,
  ] = useState(() => {

    const d =
      new Date();

    d.setDate(1);

    return d;
  });

  const [
    openId,
    setOpenId,
  ] = useState<
    string | null
  >(null);

  // =========================
  // CALENDAR CELLS
  // =========================

  const cells =
    useMemo(() => {

      const first =
        new Date(
          cursor
        );

      first.setDate(1);

      const startWeekday =
        first.getDay();

      const daysInMonth =
        new Date(

          cursor.getFullYear(),

          cursor.getMonth() + 1,

          0
        ).getDate();

      const cells:
        {
          date:
            Date | null;
        }[] = [];

      for (
        let i = 0;
        i < startWeekday;
        i++
      ) {

        cells.push({
          date: null,
        });
      }

      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        cells.push({

          date:
            new Date(

              cursor.getFullYear(),

              cursor.getMonth(),

              d
            ),
        });
      }

      while (
        cells.length % 7
      ) {

        cells.push({
          date: null,
        });
      }

      return cells;

    }, [cursor]);

  // =========================
  // TASKS BY DAY
  // =========================

  const tasksByDay =
    useMemo(() => {

      const m =
        new Map<
          string,
          typeof tasks
        >();

      for (

        const t of tasks.filter(

          (x) =>

            x.boardId ===
              activeBoardId &&

            x.dueAt
        )
      ) {

        const k =
          new Date(
            t.dueAt!
          ).toDateString();

        const arr =
          m.get(k) ?? [];

        arr.push(t);

        m.set(
          k,
          arr
        );
      }

      return m;

    }, [

      tasks,

      activeBoardId,
    ]);

  // =========================
  // MONTH LABEL
  // =========================

  const monthLabel =
    cursor.toLocaleString(

      undefined,

      {
        month:
          "long",

        year:
          "numeric",
      }
    );

  // =========================
  // PRIORITY COLORS
  // =========================

  const priorityClass =
    (
      priority?: string
    ) => {

      switch (
        priority
      ) {

        case "urgent":

          return `
            border-red-400/30
            bg-red-500/10
            text-red-200
          `;

        case "high":

          return `
            border-orange-400/30
            bg-orange-500/10
            text-orange-200
          `;

        case "med":

          return `
            border-cyan-400/30
            bg-cyan-500/10
            text-cyan-100
          `;

        default:

          return `
            border-border
            bg-secondary/50
            text-muted-foreground
          `;
      }
    };

  return (

    <div className="space-y-6">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <motion.header

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

        {/* AURA */}
        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)]

            pointer-events-none
          "
        />

        <div className="relative z-10 flex items-center justify-between">

          {/* LEFT */}
          <div>

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
                {monthLabel}
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
              Visualize deadlines,
              priorities,
              and productivity flow.
            </p>

          </div>

          {/* RIGHT */}
          <div className="flex gap-2">

            <button

              onClick={() =>

                setCursor(

                  new Date(

                    cursor.getFullYear(),

                    cursor.getMonth() - 1,

                    1
                  )
                )
              }

              className="
                h-10
                w-10

                grid
                place-items-center

                rounded-xl

                border
                border-border

                bg-secondary/40

                hover:border-cyan-400/30
                hover:bg-cyan-500/10

                transition
              "
            >

              <ChevronLeft
                className="
                  h-4
                  w-4
                "
              />

            </button>

            <button

              onClick={() => {

                const d =
                  new Date();

                d.setDate(1);

                setCursor(d);
              }}

              className="
                px-4

                rounded-xl

                border
                border-cyan-400/20

                bg-cyan-500/10

                text-cyan-100
                text-sm

                hover:bg-cyan-500/20

                transition
              "
            >
              Today
            </button>

            <button

              onClick={() =>

                setCursor(

                  new Date(

                    cursor.getFullYear(),

                    cursor.getMonth() + 1,

                    1
                  )
                )
              }

              className="
                h-10
                w-10

                grid
                place-items-center

                rounded-xl

                border
                border-border

                bg-secondary/40

                hover:border-cyan-400/30
                hover:bg-cyan-500/10

                transition
              "
            >

              <ChevronRight
                className="
                  h-4
                  w-4
                "
              />

            </button>
          </div>
        </div>
      </motion.header>

      {/* ========================= */}
      {/* CALENDAR */}
      {/* ========================= */}

      <motion.div

        initial={{
          opacity: 0,
        }}

        animate={{
          opacity: 1,
        }}

        className="
          glass

          rounded-3xl

          p-4

          border
          border-border/40
        "
      >

        {/* DAYS */}
        <div
          className="
            grid
            grid-cols-7

            text-[10px]
            uppercase

            tracking-[0.18em]

            text-muted-foreground

            mb-3
            px-1
          "
        >

          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((d) => (

            <div
              key={d}
              className="py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-7

            gap-2
          "
        >

          {cells.map((c, i) => {

            const today =

              c.date &&

              c.date.toDateString() ===

                new Date()
                  .toDateString();

            const items =

              c.date

                ? tasksByDay.get(
                    c.date.toDateString()
                  ) ?? []

                : [];

            return (

              <motion.div

                whileHover={{
                  y: -2,
                }}

                key={i}

                className={`
                  min-h-[120px]

                  rounded-2xl

                  p-2.5

                  border

                  transition-all

                  ${
                    c.date

                      ? today

                        ? `
                          border-cyan-400/40
                          bg-cyan-500/[0.06]

                          shadow-[0_0_30px_rgba(34,211,238,0.08)]
                        `

                        : `
                          border-border
                          bg-secondary/20

                          hover:border-cyan-400/20
                          hover:bg-cyan-500/[0.03]
                        `

                      : "border-transparent"
                  }
                `}
              >

                {c.date && (

                  <>

                    {/* DATE */}
                    <div
                      className={`
                        text-xs

                        ${
                          today

                            ? `
                              text-cyan-300
                              font-semibold
                            `

                            : `
                              text-muted-foreground
                            `
                        }
                      `}
                    >
                      {c.date.getDate()}
                    </div>

                    {/* TASKS */}
                    <div
                      className="
                        mt-2

                        space-y-1.5
                      "
                    >

                      {items
                        .slice(0, 3)
                        .map((t) => {

                          const overdue = t.dueAt && t.dueAt < Date.now() && t.column !== "done";

                          return (

                            <button

                              key={t.id}

                              onClick={() =>
                                setOpenId(
                                  t.id
                                )
                              }

                              className={`
                                block
                                w-full

                                text-left

                                text-[11px]

                                truncate

                                rounded-lg

                                border

                                px-2
                                py-1

                                transition-all

                                hover:scale-[1.02]

                                ${
                                  overdue

                                    ? `
                                      border-red-400/20
                                      bg-red-500/10
                                      text-red-200
                                    `

                                    : priorityClass(
                                        t.priority
                                      )
                                }
                              `}
                            >
                              {t.title}
                            </button>
                          );
                        })}

                      {items.length > 3 && (

                        <div
                          className="
                            text-[10px]
                            text-muted-foreground
                            px-1
                          "
                        >
                          +
                          {
                            items.length - 3
                          }{" "}
                          more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ========================= */}
      {/* TASK MODAL */}
      {/* ========================= */}

      {openId && (

        <TaskModal

          taskId={openId}

          onClose={() =>
            setOpenId(
              null
            )
          }
        />
      )}
    </div>
  );
}