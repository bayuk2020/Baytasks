import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useStore,
} from "@/lib/store";

import {
  Send,
  Check,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  useEffect,
} from "react";

import {
  telegramApi,
} from "@/lib/api";

export const Route =
  createFileRoute(
    "/settings"
  )({

    head: () => ({

      meta: [
        {
          title:
            "Settings — BayTasks",
        },
      ],
    }),

    component:
      Settings,
  });

function Settings() {

  const { telegram, setTelegram, boards, loadBoards, } = useStore();

  // =========================
  // LOAD SETTINGS
  // =========================

  useEffect(() => {

    loadTelegram();

  }, []);

  const loadTelegram =
    async () => {

      try {

        const data =
          await telegramApi.get();

        if (
          data.setting
        ) {

          setTelegram({

            chatId:
              data.setting.chat_id ??
              "",

            enabled:
              !!data.setting.enabled,

            dailyBriefing:
              !!data.setting.daily_briefing,
          });
        }

      } catch (err) {

        console.error(
          "LOAD TELEGRAM ERROR",
          err
        );
      }
    };

  // =========================
  // SAVE SETTINGS
  // =========================

  const saveTelegram =
    async (
      patch?: Partial<
        typeof telegram
      >
    ) => {

      const next = {
        ...telegram,
        ...patch,
      };

      setTelegram(
        next
      );

      try {

        await telegramApi.save({

          chat_id:
            next.chatId,

          enabled:
            next.enabled,

          daily_briefing:
            next.dailyBriefing,
        });

      } catch (err) {

        console.error(
          "SAVE TELEGRAM ERROR",
          err
        );
      }
    };

  // =========================
  // TEST MESSAGE
  // =========================

  const sendTest =
    async () => {

      try {

        const data =
          await telegramApi.get();

        if (
          !data.setting
            ?.chat_id
        ) {

          toast.error(
            "Chat ID kosong"
          );

          return;
        }

        toast.success(
          "Telegram connected 😭🔥"
        );

      } catch {

        toast.error(
          "Telegram failed"
        );
      }
    };
// =========================
// UPDATE BOARD
// =========================

const updateBoard =
  async (
    id: string,
    name: string,
    emoji: string
  ) => {

    try {

      await fetch(

        `http://127.0.0.1:8000/api/boards/${id}`,

        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({

              project_id:
                1,

              name,

              emoji,

              position:
                0,
            }),
        }
      );

      await loadBoards();

      toast.success(
        "Board updated ✅"
      );

    } catch {

      toast.error(
        "Update failed ❌"
      );
    }
  };


// =========================
// DELETE BOARD
// =========================

const deleteBoard =
  async (
    id: string
  ) => {

    try {

      await fetch(

        `http://127.0.0.1:8000/api/boards/${id}`,

        {
          method:
            "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      await loadBoards();

      toast.success(
        "Board deleted ❤️‍🔥"
      );

    } catch {

      toast.error(
        "Delete failed ❌"
      );
    }
  };


  return (
    <div className="space-y-6 max-w-3xl">

      <h1 className="text-2xl font-semibold tracking-tight">
        Settings
      </h1>

      <section className="glass rounded-2xl p-5 space-y-4">

        <div>

          <h2 className="font-medium flex items-center gap-2">

            <Send className="h-4 w-4 text-primary" />

            Telegram integration

          </h2>

          <p className="text-sm text-muted-foreground mt-1">

            Receive deadline alerts,
            daily briefings,
            and completion celebrations
            in Telegram.

            See{" "}

            <a
              className="text-primary underline"
              href="/docs"
            >
              Install &amp; API
            </a>

            {" "}for the bot setup.

          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">

          <label className="text-sm">

            <span className="text-xs uppercase tracking-wider text-muted-foreground">

              Chat ID

            </span>

            <input
              value={
                telegram.chatId
              }

              onChange={(e) =>
                saveTelegram({
                  chatId:
                    e.target.value,
                })
              }

              placeholder="123456789"

              className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <div className="flex items-end gap-3">

            <Toggle
              label="Enabled"

              value={
                telegram.enabled
              }

              onChange={(v) =>
                saveTelegram({
                  enabled: v,
                })
              }
            />

            <Toggle
              label="Daily briefing"

              value={
                telegram.dailyBriefing
              }

              onChange={(v) =>
                saveTelegram({
                  dailyBriefing:
                    v,
                })
              }
            />
          </div>
        </div>

        <button

          onClick={sendTest}

          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          Send test message
        </button>
      </section>

      <section className="glass rounded-2xl p-5">

        <h2 className="font-medium mb-3">
          Boards
        </h2>
<ul className="divide-y divide-border">

  {boards.map((b) => (

<li

  key={b.id}

  className="
    py-2

    flex
    items-center
    gap-2
  "
>

  {/* EMOJI */}
  <input

    defaultValue={
      b.emoji
    }

    onBlur={(e) =>
      updateBoard(

        b.id,

        b.name,

        e.target.value
      )
    }

    className="
      w-14

      bg-secondary/40

      rounded-md

      px-2
      py-1

      text-sm

      outline-none
    "
  />

  {/* NAME */}
  <input

    defaultValue={
      b.name
    }

    onBlur={(e) =>
      updateBoard(

        b.id,

        e.target.value,

        b.emoji
      )
    }

    className="
      flex-1

      bg-transparent

      outline-none

      text-sm

      rounded-md

      px-2
      py-1

      focus:bg-secondary/60
    "
  />

  {/* DELETE */}
  <button

    onClick={() =>
      deleteBoard(
        b.id
      )
    }

    className="
      text-xs

      text-red-400

      hover:text-red-300
    "
  >
    Delete
  </button>

</li>

  ))}
</ul>

      </section>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (
    v: boolean
  ) => void;
}) {

  return (
    <button

      onClick={() =>
        onChange(
          !value
        )
      }

      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        value
          ? "border-primary text-primary bg-primary/10"
          : "border-border text-muted-foreground"
      }`}
    >

      <span
        className={`h-4 w-4 rounded grid place-items-center ${
          value
            ? "bg-primary"
            : "border border-border"
        }`}
      >

        {value && (
          <Check className="h-3 w-3 text-primary-foreground" />
        )}

      </span>

      {label}
    </button>
  );
}