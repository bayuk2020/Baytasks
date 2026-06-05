/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BookMarked, StickyNote } from "lucide-react";
import { useStore, bookProgress } from "@/lib/store";
import { BookCover } from "./BookCover";
import {
  useEffect
} from "react";
export function ContinueReading() {
  const books = useStore((s) => s.books);
  const bookNotes = useStore((s) => s.bookNotes);
  const loadBooks =
  useStore(
    (s) => s.loadBooks
  );
useEffect(() => {

  loadBooks();

}, [loadBooks]);
  const active = [...books]
    .filter((b) => b.status === "reading")
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center justify-between mb-4">
        <h2 className="font-medium inline-flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" /> Continue reading
        </h2>
        <Link to="/library" className="text-xs text-primary hover:underline">Library →</Link>
      </div>
      {!active ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No active book. <Link to="/library" className="text-primary hover:underline">Start one →</Link>
        </div>
      ) : (() => {
        const pct = bookProgress(active);
       const lastNote = bookNotes
  .filter(
    (n) =>
      String(n.bookId) ===
      String(active.id)
  )
  .sort(
    (a, b) =>
      b.createdAt - a.createdAt
  )[0];
        return (
          <div className="relative flex gap-4">
            <BookCover
            coverImage={active.coverImage}
            coverPath={active.coverPath}
            title={active.title}
            className="h-36 w-24 shrink-0 rounded-lg shadow-[0_8px_24px_-12px_rgb(0_0_0/0.7)]"
          /><div className="min-w-0 flex-1 flex flex-col">
              <h3 className="font-semibold leading-tight truncate">{active.title}</h3>
              <p className="text-xs text-muted-foreground">{active.author}</p>
              <div className="mt-1 flex flex-wrap gap-1">
              {active.format === "pdf" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  PDF
                </span>
              )}

              {active.format === "physical" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  Physical
                </span>
              )}

              {active.format === "both" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  PDF + Physical
                </span>
              )}

            </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-secondary/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Current page</div>
                  <div className="text-sm font-semibold">{active.currentPage} / {active.totalPages}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Progress</div>
                  <div className="text-sm font-semibold neon-text">{pct}%</div>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-[var(--gradient-neon)]" />
              </div>
              {lastNote && (
                <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-primary mb-1">
                    <StickyNote className="h-3 w-3" /> Latest note · p.{lastNote.pageNumber}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{stripHtml(lastNote.content)}</p>
                </div>
              )}
              {active.filePath && (
              <a
                href={active.filePath}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
              >
                Open PDF
              </a>
            )}
              <Link
              to="/book/$bookId"
              params={{
                bookId: String(active.id),
              }}
                className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
                Continue reading <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })()}
    </motion.section>
  );
}
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
