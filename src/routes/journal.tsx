import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type Journal, type Mood } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import GlowButton from "@/components/ui/GlowButton";
import {
  Plus,
  Search,
  Trash2,
  Save,
  Bold,
  Italic,
  List,
  Heading2,
  Hash,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — BayTasks" },
      {
        name: "description",
        content: "Your second brain: write, tag, and track mood with a futuristic editor.",
      },
    ],
  }),
  component: JournalPage,
});

const MOODS: { id: Mood; label: string; emoji: string; color: string }[] = [
  { id: "great", label: "Great", emoji: "🚀", color: "from-cyan-400 to-sky-500" },
  { id: "good", label: "Good", emoji: "✨", color: "from-emerald-400 to-teal-500" },
  { id: "neutral", label: "Neutral", emoji: "🌙", color: "from-zinc-400 to-zinc-500" },
  { id: "low", label: "Low", emoji: "🌧", color: "from-violet-400 to-indigo-500" },
  { id: "bad", label: "Bad", emoji: "⚡", color: "from-rose-400 to-pink-500" },
];

function JournalPage() {
  const { journals, addJournal, updateJournal, removeJournal, loadJournals } = useStore();
  const [activeId, setActiveId] = useState<string | null>(journals[0]?.id ?? null);
  const [q, setQ] = useState("");
  useEffect(() => {
    loadJournals();
  }, []);

  useEffect(() => {
    if (!activeId && journals[0]) setActiveId(journals[0].id);
  }, [activeId, journals]);

  const list = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return journals;
    return journals.filter(
      (j) =>
        j.title.toLowerCase().includes(needle) ||
        j.content.toLowerCase().includes(needle) ||
        j.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }, [journals, q]);

  const active = journals.find((j) => j.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Second brain</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Your <span className="neon-text">journal</span>
          </h1>
        </div>
        <GlowButton
          onClick={async () => {
            const id = await addJournal({
              title: "New entry",
              content: "<p></p>",
              mood: "neutral",
              tags: [],
            });

            setActiveId(id);
          }}
        >
          <Plus className="h-4 w-4" />

          <span>What's on your mind?</span>
        </GlowButton>
      </header>

      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        <aside className="glass rounded-2xl p-3 h-fit lg:sticky lg:top-20">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search entries…"
              className="w-full rounded-lg bg-secondary/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {list.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">No entries.</div>
            )}
            {list.map((j) => {
              const mood =
                MOODS.find((m) => m.id === j.mood) ?? MOODS.find((m) => m.id === "neutral")!;
              return (
                <button
                  key={j.id}
                  onClick={() => setActiveId(j.id)}
                  className={`w-full text-left rounded-xl p-3 border transition-all ${
                    activeId === j.id
                      ? "border-primary/50 bg-primary/5 shadow-[0_0_24px_-12px_var(--primary)]"
                      : "border-border bg-secondary/40 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{j.title || "Untitled"}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(j.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span
                      className={`text-lg shrink-0 bg-gradient-to-br ${mood.color} bg-clip-text`}
                    >
                      {mood.emoji}
                    </span>
                  </div>
                  {j.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {j.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <AnimatePresence mode="wait">
          {active ? (
            <Editor
              journal={active}
              onChange={async (patch) => {
                await updateJournal(active.id, patch);
              }}
              onDelete={() => {
                removeJournal(active.id);
                setActiveId(null);
              }}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-16 text-center"
            >
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <p className="text-muted-foreground">Select or create an entry to start writing.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
function Editor({
  journal,
  onChange,
  onDelete,
}: {
  journal: Journal;

  onChange: (patch: Partial<Journal>) => Promise<void>;

  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const saveTimeout = useRef<number | null>(null);

  // =========================
  // LOCAL UI STATE
  // =========================

  const [title, setTitle] = useState(journal.title);

  const [mood, setMood] = useState<Mood>(journal.mood);

  const [tags, setTags] = useState<string[]>(journal.tags);

  const [tagInput, setTagInput] = useState("");

  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  // =========================
  // SYNC WHEN SWITCH JOURNAL
  // =========================

  useEffect(() => {
    setTitle(journal.title);

    setMood(journal.mood);

    setTags(journal.tags);

    if (ref.current) {
      ref.current.innerHTML = journal.content || "<p></p>";
    }
  }, [journal.id]);

  // =========================
  // DEBOUNCED SAVE
  // =========================

  const debouncedSave = (patch: Partial<Journal>) => {
    setSaving("saving");

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(async () => {
      await onChange(patch);

      setSaving("saved");

      window.setTimeout(() => {
        setSaving("idle");
      }, 1200);
    }, 700);
  };

  // =========================
  // EDITOR COMMANDS
  // =========================

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);

    if (ref.current) {
      debouncedSave({
        content: ref.current.innerHTML,
      });
    }
  };

  // =========================
  // TAGS
  // =========================

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, "").toLowerCase();

    if (!t || tags.includes(t)) return;

    const next = [...tags, t];

    setTags(next);

    debouncedSave({
      tags: next,
    });
  };

  // =========================
  // UI
  // =========================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      className="
        glass
        rounded-2xl
        p-6
        relative
        overflow-hidden
      "
    >
      <div
        className="
          pointer-events-none

          absolute
          -top-24
          -right-24

          h-64
          w-64

          rounded-full

          bg-primary/15

          blur-3xl
        "
      />

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div
        className="
          flex
          items-center
          justify-between
          flex-wrap
          gap-3
          mb-4
          relative
        "
      >
        <input
          value={title}
          onChange={(e) => {
            const v = e.target.value;

            setTitle(v);

            debouncedSave({
              title: v,
            });
          }}
          placeholder="Title…"
          className="
            bg-transparent

            text-2xl
            font-semibold
            tracking-tight

            outline-none

            flex-1
            min-w-[200px]
          "
        />

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <AnimatePresence>
            {saving !== "idle" && (
              <motion.span
                key={saving}
                initial={{
                  opacity: 0,
                  y: -4,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                }}
                className="
                  text-[11px]
                  text-muted-foreground

                  inline-flex
                  items-center
                  gap-1
                "
              >
                <Save
                  className="
                    h-3
                    w-3
                  "
                />

                {saving === "saving" ? "Saving..." : "Saved"}
              </motion.span>
            )}
          </AnimatePresence>

          <button
            onClick={onDelete}
            className="
              h-9
              w-9

              grid
              place-items-center

              rounded-lg

              border
              border-border

              hover:border-rose-500/50
              hover:text-rose-400

              transition
            "
          >
            <Trash2
              className="
                h-4
                w-4
              "
            />
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* MOOD */}
      {/* ========================= */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-2

          mb-3
          relative
        "
      >
        <span
          className="
            text-[10px]
            uppercase
            tracking-[0.18em]

            text-muted-foreground
            mr-1
          "
        >
          Mood
        </span>

        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMood(m.id);

              debouncedSave({
                mood: m.id,
              });
            }}
            className={`
              h-8
              px-2.5

              rounded-lg

              text-xs

              inline-flex
              items-center
              gap-1.5

              border

              transition-all

              ${
                mood === m.id
                  ? "border-primary/60 bg-primary/10 shadow-[0_0_18px_-6px_var(--primary)]"
                  : "border-border bg-secondary/40 hover:border-primary/30"
              }
            `}
          >
            <span>{m.emoji}</span>

            {m.label}
          </button>
        ))}
      </div>

      {/* ========================= */}
      {/* TAGS */}
      {/* ========================= */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-1.5

          mb-4
          relative
        "
      >
        <Hash
          className="
            h-3.5
            w-3.5

            text-muted-foreground
          "
        />

        {tags.map((t) => (
          <button
            key={t}
            onClick={() => {
              const next = tags.filter((x) => x !== t);

              setTags(next);

              debouncedSave({
                tags: next,
              });
            }}
            className="
              text-xs

              px-2
              py-0.5

              rounded-md

              bg-primary/10

              border
              border-primary/30

              text-primary

              hover:bg-primary/20
            "
          >
            #{t}
          </button>
        ))}

        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();

              addTag(tagInput);

              setTagInput("");
            }
          }}
          placeholder="add tag…"
          className="
            bg-transparent

            text-xs

            outline-none

            placeholder:text-muted-foreground

            w-24
          "
        />
      </div>

      {/* ========================= */}
      {/* TOOLBAR */}
      {/* ========================= */}

      <div
        className="
          flex
          items-center
          gap-1

          p-1
          mb-3

          rounded-xl

          border
          border-border

          bg-secondary/40

          relative
          w-fit

          shadow-[0_0_24px_-12px_var(--primary)]
        "
      >
        <TbBtn onClick={() => exec("bold")}>
          <Bold
            className="
              h-3.5
              w-3.5
            "
          />
        </TbBtn>

        <TbBtn onClick={() => exec("italic")}>
          <Italic
            className="
              h-3.5
              w-3.5
            "
          />
        </TbBtn>

        <TbBtn onClick={() => exec("formatBlock", "H2")}>
          <Heading2
            className="
              h-3.5
              w-3.5
            "
          />
        </TbBtn>

        <TbBtn onClick={() => exec("insertUnorderedList")}>
          <List
            className="
              h-3.5
              w-3.5
            "
          />
        </TbBtn>
      </div>

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => {
          const html = (e.target as HTMLDivElement).innerHTML;

          debouncedSave({
            content: html,
          });
        }}
        className="
          prose
          prose-invert

          max-w-none

          min-h-[40vh]

          outline-none

          text-sm
          leading-relaxed

          [&_h2]:text-xl
          [&_h2]:font-semibold
          [&_h2]:mt-4
          [&_h2]:mb-2

          [&_p]:my-2

          [&_ul]:list-disc
          [&_ul]:pl-5

          [&_strong]:text-foreground
        "
      />
    </motion.div>
  );
}

function TbBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
    >
      {children}
    </button>
  );
}
