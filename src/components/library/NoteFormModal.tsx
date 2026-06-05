import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type BookNote, useStore } from "@/lib/store";

export function NoteFormModal({
  bookId,
  open,
  onClose,
  edit,
  defaultPage,
}: {
  bookId: string;
  open: boolean;
  onClose: () => void;
  edit?: BookNote;
  defaultPage?: number;
}) {
  const { addBookNote, updateBookNote } = useStore();
  const [pageNumber, setPageNumber] = useState(String(edit?.pageNumber ?? defaultPage ?? 1));
  const [chapter, setChapter] = useState(edit?.chapter ?? "");
  const [title, setTitle] = useState(edit?.title ?? "");
  const [content, setContent] = useState(edit?.content ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    const payload = {
      bookId,

      pageNumber: Math.max(0, parseInt(pageNumber) || 0),

      chapter: chapter.trim(),

      title: title.trim(),

      content: content.trim(),
    };

    try {
      if (edit) {
        await updateBookNote(edit.id, payload);
      } else {
        await addBookNote(payload);
      }

      onClose();
    } catch (err) {
      console.error("SAVE BOOK NOTE ERROR", err);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            className="relative w-full max-w-lg glass-strong rounded-2xl p-5 neon-ring"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{edit ? "Edit note" : "Add reading note"}</h2>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Page
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    className={`mt-1 ${inputCls}`}
                  />
                </label>
                <label className="block col-span-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Chapter
                  </span>
                  <input
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className={`mt-1 ${inputCls}`}
                    placeholder="Rich Dad vs Poor Dad"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                  placeholder="Key insight"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Note
                </span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className={`mt-1 ${inputCls} resize-none`}
                  placeholder="The rich do not work for money…"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--gradient-neon)] text-primary-foreground neon-ring hover:scale-[1.02] transition"
              >
                {edit ? "Save note" : "Add note"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full rounded-lg bg-secondary/60 border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";
