/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  Minus,
  Pencil,
  Plus,
  Save,
  StickyNote,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  BOOK_STATUS_META,
  bookProgress,
  type BookNote,
  type BookStatus,
  useStore,
} from "@/lib/store";
import { BookCover } from "@/components/library/BookCover";
import { BookFormModal } from "@/components/library/BookFormModal";
import { ReadingNoteEditor } from "@/components/library/ReadingNoteEditor";

export const Route = createFileRoute("/book/$bookId")({
  head: () => ({
    meta: [
      { title: "Book — Reading Vault" },
      {
        name: "description",
        content: "Reading progress, sessions and notes inside BayTasks Reading Vault.",
      },
    ],
  }),
  component: BookDetails,
  errorComponent: ({ error }) => <Fallback message={error.message} />,
  notFoundComponent: () => <Fallback message="Book not found." />,
});

const STATUSES: BookStatus[] = ["reading", "completed", "paused", "wishlist"];

function BookDetails() {
  const { bookId } = Route.useParams();
  const router = useRouter();
  const books = useStore((s) => s.books);
  const bookNotes = useStore((s) => s.bookNotes);
  const readingSessions = useStore((s) => s.readingSessions);
  const { setBookProgress, updateBook, removeBook, addBookNote, updateBookNote, removeBookNote } =
    useStore();
    const loadBooks =
  useStore(
    (s) => s.loadBooks
  );

useEffect(() => {

  loadBooks();

}, [loadBooks]);
  const book = books.find(
  (b) => String(b.id) === String(bookId)
);
  const notes = bookNotes.filter(
  (n) => String(n.bookId) === String(bookId)
);

const sessions = readingSessions.filter(
  (r) => String(r.bookId) === String(bookId)
);

  const [editingBook, setEditingBook] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("");
  const [savedProgress, setSavedProgress] = useState<"idle" | "saved">("idle");

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.createdAt - a.createdAt), [notes]);
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt - a.createdAt),
    [sessions],
  );
  const [showPdf, setShowPdf] =
  useState(false);

  if (!book) return <Fallback message="Book not found." />;

  const pct = bookProgress(book);
  const meta = BOOK_STATUS_META[book.status];
  const remaining = Math.max(0, book.totalPages - book.currentPage);
  const activeNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) : undefined;

  const flashSaved = () => {
    setSavedProgress("saved");
    window.setTimeout(() => setSavedProgress("idle"), 1300);
  };
  const commitPage = () => {
    const n = parseInt(pageInput);
    if (!isNaN(n)) {
      setBookProgress(book.id, n);
      flashSaved();
    }
    setPageInput("");
  };
  const nudge = (delta: number) => {
    setBookProgress(book.id, book.currentPage + delta);
    flashSaved();
  };
const saveNote = async (
  payload: {
    pageNumber: number;
    chapter: string;
    title: string;
    content: string;
  }
) => {

  try {

    if (activeNote) {

      await updateBookNote(
        activeNote.id,
        payload
      );

    } else {

      const id =
        await addBookNote({
          ...payload,
          bookId: book.id,
        });

      setActiveNoteId(id);
    }

  } catch (err) {

    console.error(
      "SAVE NOTE ERROR",
      err
    );
  }
};

  return (
    <div className="space-y-6 relative">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="flex items-center justify-between relative gap-3">
        <Link
          from={Route.fullPath}
          to="/library"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Library
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingBook(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-accent transition"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => {
              removeBook(book.id);
              router.navigate({ to: "/library" });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border hover:border-destructive/50 hover:text-destructive transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full blur-3xl"
          style={{ background: `color-mix(in oklab, ${meta.color} 25%, transparent)` }}
        />
        <div className="relative grid gap-6 md:grid-cols-[150px_1fr]">
        <BookCover
          coverImage={book.coverImage}
          coverPath={book.coverPath}
          title={book.title}
          className="h-56 w-36 shrink-0 rounded-xl shadow-[0_18px_50px_-16px_rgb(0_0_0/0.85)]"
        />
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                color: meta.color,
                background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
                border: `1px solid color-mix(in oklab, ${meta.color} 30%, transparent)`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3">{book.title}</h1>
            <p className="text-muted-foreground mt-1">{book.author}</p>
            <div className="mt-2 flex flex-wrap gap-2">

            <span className="px-2 py-1 rounded-lg text-xs border border-border bg-secondary/40">
              {book.format === "pdf"
                ? "PDF"
                : book.format === "physical"
                ? "Physical"
                : "PDF + Physical"}
            </span>

            {book.filePath && (

              <button
                onClick={() =>
                  setShowPdf(
                    !showPdf
                  )
                }
                className="rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground"
              >
                {showPdf
                  ? "Hide PDF"
                  : "Open PDF"}
              </button>

            )}

          </div>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Current page"
                value={book.currentPage}
              />
              <Stat
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Total pages"
                value={book.totalPages}
              />
              <Stat
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Progress"
                value={`${pct}%`}
                accent
              />
              <Stat
                icon={<Clock3 className="h-3.5 w-3.5" />}
                label="Pages read"
                value={
                  sessions.reduce(
                    (sum, s) =>
                      sum + s.pagesRead,
                    0
                  )
                }
              />
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {book.currentPage} / {book.totalPages}
              </span>
              <span className="font-semibold neon-text text-lg">{pct}%</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="h-full rounded-full"
                style={{
                  background: "var(--gradient-neon)",
                  boxShadow: `0 0 18px -2px ${meta.color}`,
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {STATUSES.map((s) => {
                const m = BOOK_STATUS_META[s];
                const active = book.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateBook(book.id, { status: s })}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                    style={{
                      color: active ? m.color : "var(--muted-foreground)",
                      background: active
                        ? `color-mix(in oklab, ${m.color} 14%, transparent)`
                        : "var(--secondary)",
                      border: `1px solid ${active ? `color-mix(in oklab, ${m.color} 35%, transparent)` : "var(--border)"}`,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>
{showPdf &&
 book.filePath && (

  <section className="glass rounded-2xl p-4 mb-6">

    <h3 className="font-medium mb-3">
      PDF Reader
    </h3>

    <iframe
      src={book.filePath}
      className="w-full h-[800px] rounded-xl border border-border"
      title={book.title}
    />

  </section>

)}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 space-y-4"
          >
            <h2 className="font-medium inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Reading progress
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={<Minus className="h-3.5 w-3.5" />} label="Remaining" value={remaining} />
              <Stat
                icon={<Clock3 className="h-3.5 w-3.5" />}
                label="Sessions"
                value={sessions.length}
              />
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Reading session
                </div>
                <AnimatePresence>
                  {savedProgress === "saved" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] text-primary inline-flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => nudge(-10)}
                  className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent text-xs"
                >
                  -10
                </button>
                <input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitPage()}
                  placeholder={String(book.currentPage)}
                  className="flex-1 min-w-0 rounded-lg bg-secondary/60 border border-border px-3 py-2 text-sm text-center outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => nudge(10)}
                  className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent text-xs"
                >
                  +10
                </button>
              </div>
              <button
                onClick={commitPage}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--gradient-neon)] text-primary-foreground text-sm font-medium neon-ring hover:scale-[1.01] transition"
              >
                <Save className="h-4 w-4" /> Save progress
              </button>
              {pct >= 100 && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finished — marked completed
                </div>
              )}
            </div>
          </motion.section>
          <SessionList sessions={sortedSessions} />
        </div>

        <div className="space-y-5">
          <ReadingNoteEditor
            note={activeNote}
            defaultPage={book.currentPage}
            onSave={saveNote}
            onCancel={activeNote ? () => setActiveNoteId(null) : undefined}
          />
          <NotesTimeline
            notes={sortedNotes}
            activeNoteId={activeNoteId}
            onNew={() => setActiveNoteId(null)}
            onEdit={setActiveNoteId}
            onDelete={(id) => {
              removeBookNote(id);
              if (activeNoteId === id) setActiveNoteId(null);
            }}
          />
        </div>
      </div>

      <BookFormModal open={editingBook} onClose={() => setEditingBook(false)} edit={book} />
    </div>
  );
}

function Fallback({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link to="/library" className="text-primary hover:underline text-sm mt-2 inline-block">
        Back to library →
      </Link>
    </div>
  );
}

function NotesTimeline({
  notes,
  activeNoteId,
  onNew,
  onEdit,
  onDelete,
}: {
  notes: BookNote[];
  activeNoteId: string | null;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium">Notes timeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Newest insights first.</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border hover:border-primary/40 hover:text-primary transition"
        >
          <Plus className="h-3.5 w-3.5" /> New note
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No notes yet. Start writing above.
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-border">
          <AnimatePresence>
            {notes.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="relative pl-7 group"
              >
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-[var(--gradient-neon)] neon-ring" />
                <div
                  className={`rounded-xl border p-3.5 transition ${activeNoteId === n.id ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/30"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                        p.{n.pageNumber}
                      </span>
                      {n.chapter && <span>{n.chapter}</span>}
                      <span>·</span>
                      <span>
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEdit(n.id)}
                        className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(n.id)}
                        className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {n.title && <div className="mt-1.5 font-medium text-sm">{n.title}</div>}
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {stripHtml(n.content)}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </motion.section>
  );
}

function SessionList({
  sessions,
}: {
  sessions: {
    id: string;
    previousPage: number;
    newPage: number;
    pagesRead: number;
    createdAt: number;
  }[];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="font-medium mb-3 inline-flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" /> Recent sessions
      </h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Progress changes will appear here.</p>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 5).map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>
                  p.{s.previousPage} → p.{s.newPage}
                </span>
                <span className="neon-text font-semibold">+{s.pagesRead}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {new Date(s.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-secondary/40 p-3 ${accent ? "neon-ring" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold ${accent ? "neon-text" : ""}`}>{value}</div>
    </div>
  );
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
