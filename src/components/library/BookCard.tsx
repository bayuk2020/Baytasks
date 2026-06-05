/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { StickyNote, FileText } from "lucide-react";
import { type Book, BOOK_STATUS_META, bookProgress, useStore } from "@/lib/store";
import { BookCover } from "./BookCover";

export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const noteCount = useStore(
  (s) =>
    s.bookNotes.filter(
      (n) =>
        String(n.bookId) ===
        String(book.id)
    ).length
);
  const pct = bookProgress(book);
  const meta = BOOK_STATUS_META[book.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <Link
  to="/book/$bookId"
  params={{
    bookId: String(book.id),
  }}
        className="hover-lift group block glass rounded-2xl p-3.5 relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `color-mix(in oklab, ${meta.color} 35%, transparent)` }}
        />
        <div className="relative flex gap-3.5">
        <BookCover
          coverImage={book.coverImage}
          coverPath={book.coverPath}
          title={book.title}
          className="h-28 w-20 shrink-0 rounded-lg shadow-[0_8px_24px_-12px_rgb(0_0_0/0.7)]"
        />
        <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight truncate">{book.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
            <div className="mt-1 flex gap-1">
            {book.format === "pdf" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                PDF
              </span>
            )}

            {book.format === "physical" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                Physical
              </span>
            )}

            {book.format === "both" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                PDF + Physical
              </span>
            )}
          </div>
            <span
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                color: meta.color,
                background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
                border: `1px solid color-mix(in oklab, ${meta.color} 30%, transparent)`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </span>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Page {book.currentPage} / {book.totalPages}</span>
              <span className="font-semibold neon-text">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="relative mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-neon)", boxShadow: `0 0 14px -2px ${meta.color}` }}
          />
        </div>

<div className="relative mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">

  <div className="flex items-center gap-1.5">
    <StickyNote className="h-3.5 w-3.5" />
    {noteCount}
    {noteCount === 1
      ? " Note"
      : " Notes"}
  </div>

  {book.filePath && (
    <span className="flex items-center gap-1 text-primary">
      <FileText className="h-3 w-3" />
      PDF Attached
      
    </span>
    
  )}

</div>
      </Link>
    </motion.div>
  );
}
