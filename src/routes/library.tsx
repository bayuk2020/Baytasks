/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState,useEffect  } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, CheckCircle2, Layers, StickyNote, Flame } from "lucide-react";
import { useStore, bookProgress, type BookStatus, BOOK_STATUS_META } from "@/lib/store";
import { BookCard } from "@/components/library/BookCard";
import { BookFormModal } from "@/components/library/BookFormModal";
import GlowButton from "@/components/ui/GlowButton";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Reading Vault — BayTasks" },
      { name: "description", content: "Track books, reading progress and notes in a futuristic knowledge vault." },
    ],
  }),
  component: Library,
});

const FILTERS: { id: BookStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reading", label: "Reading" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
  { id: "wishlist", label: "Wishlist" },
];
const FORMAT_FILTERS: {
  id: "all" | "pdf" | "physical" | "both";
  label: string;
}[] = [
  {
    id: "all",
    label: "All Formats",
  },
  {
    id: "pdf",
    label: "PDF",
  },
  {
    id: "physical",
    label: "Physical",
  },
  {
    id: "both",
    label: "Both",
  },
];
  function Library() {

  const books = useStore(
    (s) => s.books
  );

  const bookNotes = useStore(
    (s) => s.bookNotes
  );

  const loadBooks = useStore(
    (s) => s.loadBooks
  );

  useEffect(() => {

    loadBooks();

  }, [loadBooks]);

  const [q, setQ] = useState("");

  const [filter, setFilter] =
    useState<BookStatus | "all">(
      "all"
    );
const [
  formatFilter,
  setFormatFilter
] = useState<
  "all" |
  "pdf" |
  "physical" |
  "both"
>("all");

  const [adding, setAdding] =
    useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return books
      .filter(
        (b) =>
          filter === "all" ||
          b.status === filter
      )

.filter((b) => {

  if (
    formatFilter ===
    "all"
  ) {
    return true;
  }

  if (
    formatFilter ===
    "pdf"
  ) {
    return (
      b.format ===
        "pdf" ||

      b.format ===
        "both"
    );
  }

  if (
    formatFilter ===
    "physical"
  ) {
    return (
      b.format ===
        "physical" ||

      b.format ===
        "both"
    );
  }

  return (
    b.format ===
    "both"
  );
})
      .filter((b) => !term || b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term))
      .sort((a, b) => b.updatedAt - a.updatedAt);
}, [
  books,
  q,
  filter,
  formatFilter
]);

  const stats = useMemo(() => {
    const completed = books.filter((b) => b.status === "completed").length;
    const reading = books.filter((b) => b.status === "reading").length;
    const pagesRead = books.reduce((acc, b) => acc + Math.min(b.currentPage, b.totalPages), 0);
    const pdfBooks =
    books.filter(
      (b) =>
        b.format ===
          "pdf" ||

        b.format ===
          "both"
    ).length;
    return { completed, reading, pagesRead, notes: bookNotes.length, pdfBooks };
  }, [books, bookNotes]);

  return (
    <div className="space-y-7 relative">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <header className="flex items-end justify-between flex-wrap gap-3 relative">
        <div>
          <p className="text-sm text-muted-foreground">Knowledge management</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">
            Reading <span className="neon-text">Vault</span>
          </h1>
        </div>
        <GlowButton onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          <span>Add book</span>
        </GlowButton>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
        <KPI icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} accent />
        <KPI icon={<BookOpen className="h-4 w-4" />} label="Reading now" value={stats.reading} />
        <KPI
          icon={<BookOpen />}
          label="PDF Library"
          value={stats.pdfBooks}
        />
        <KPI icon={<Layers className="h-4 w-4" />} label="Pages read" value={stats.pagesRead.toLocaleString()} />
      </div>

      <div className="flex items-center gap-3 flex-wrap relative">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or author…"
            className="w-full rounded-lg bg-secondary/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">

          {FILTERS.map((f) => {
            const active = filter === f.id;
            const color = f.id === "all" ? "var(--neon)" : BOOK_STATUS_META[f.id as BookStatus].color;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={{
                  color: active ? color : "var(--muted-foreground)",
                  background: active ? `color-mix(in oklab, ${color} 14%, transparent)` : "transparent",
                  border: `1px solid ${active ? `color-mix(in oklab, ${color} 35%, transparent)` : "var(--border)"}`,
                }}>
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">

        {FORMAT_FILTERS.map((f) => (

          <button
            key={f.id}
            onClick={() =>
              setFormatFilter(f.id)
            }
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            style={{
              color:
                formatFilter === f.id
                  ? "var(--neon)"
                  : "var(--muted-foreground)",

              background:
                formatFilter === f.id
                  ? "color-mix(in oklab, var(--neon) 14%, transparent)"
                  : "transparent",

              border: `1px solid ${
                formatFilter === f.id
                  ? "color-mix(in oklab, var(--neon) 35%, transparent)"
                  : "var(--border)"
              }`,
            }}
          >
            {f.label}
          </button>

        ))}

      </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center relative">
          <Flame className="h-7 w-7 text-primary mx-auto mb-3 opacity-70" />
          <p className="text-sm text-muted-foreground">No books here yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {filtered.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
        </div>
      )}

      <BookFormModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
      className={`glass rounded-2xl p-4 relative overflow-hidden ${accent ? "neon-ring" : ""}`}>
      {accent && <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />}
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`relative mt-2 text-2xl font-semibold ${accent ? "neon-text" : ""}`}>{value}</div>
    </motion.div>
  );
}
