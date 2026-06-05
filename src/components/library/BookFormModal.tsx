import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type Book, type BookStatus, BOOK_STATUS_META, useStore } from "@/lib/store";
import { bookApi } from "@/lib/api";

const STATUSES: BookStatus[] = ["reading", "completed", "paused", "wishlist"];

export function BookFormModal({
  open,
  onClose,
  edit,
}: {
  open: boolean;
  onClose: () => void;
  edit?: Book;
}) {
  const { addBook, updateBook } = useStore();
  const [title, setTitle] = useState(edit?.title ?? "");
  const [author, setAuthor] = useState(edit?.author ?? "");
  const [coverImage, setCoverImage] = useState(edit?.coverImage ?? "");
  const [totalPages, setTotalPages] = useState(String(edit?.totalPages ?? 200));
  const [currentPage, setCurrentPage] = useState(String(edit?.currentPage ?? 0));
  const [status, setStatus] = useState<BookStatus>(edit?.status ?? "wishlist");
  const [format, setFormat] = useState<"pdf" | "physical" | "both">(
    (edit as any)?.format ?? "physical",
  );

  const [filePath, setFilePath] = useState((edit as any)?.filePath ?? "");

  const [coverPath, setCoverPath] = useState((edit as any)?.coverPath ?? "");

  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const res = await bookApi.uploadCover(file);

    setCoverPath(res.path);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const res = await bookApi.uploadPdf(file);

    setFilePath(res.path);
  };

  useEffect(() => {
    if (!open) return;

    setTitle(edit?.title ?? "");

    setAuthor(edit?.author ?? "");

    setCoverImage(edit?.coverImage ?? "");

    setTotalPages(String(edit?.totalPages ?? 200));

    setCurrentPage(String(edit?.currentPage ?? 0));

    setStatus(edit?.status ?? "wishlist");
    setFormat((edit as any)?.format ?? "physical");

    setFilePath((edit as any)?.filePath ?? "");

    setCoverPath((edit as any)?.coverPath ?? "");
  }, [edit, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim()) {
      return;
    }

    const payload = {
      title: title.trim(),

      author: author.trim(),

      cover_image: coverImage.trim(),

      cover_path: coverPath.trim(),

      format,

      file_path: filePath.trim(),

      total_pages: Math.max(1, parseInt(totalPages) || 1),

      current_page: Math.max(0, parseInt(currentPage) || 0),

      status,
    };

    try {
      if (edit) {
        await updateBook(edit.id, payload);
      } else {
        await addBook(payload);
      }

      onClose();
    } catch (err) {
      console.error("BOOK SUBMIT ERROR", err);
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
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-strong rounded-2xl p-5 neon-ring"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{edit ? "Edit book" : "Add a book"}</h2>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Title">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                  placeholder="Rich Dad Poor Dad"
                />
              </Field>
              <Field label="Author">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className={inputCls}
                  placeholder="Robert Kiyosaki"
                />
              </Field>
              <Field label="Cover Source">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`px-3 py-2 rounded-lg text-xs border transition ${
                      coverMode === "url" ? "bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    URL
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`px-3 py-2 rounded-lg text-xs border transition ${
                      coverMode === "upload"
                        ? "bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    Upload
                  </button>
                </div>
              </Field>

              {coverMode === "url" ? (
                <Field label="Cover image URL">
                  <input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </Field>
              ) : (
                <Field label="Upload Cover">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className={inputCls}
                  />
                </Field>
              )}
              <Field label="Format">
                {format === "pdf" || format === "both" ? (
                  <Field label="PDF File">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className={inputCls}
                    />
                  </Field>
                ) : null}
                <div className="flex gap-2">
                  {["pdf", "physical", "both"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f as "pdf" | "physical" | "both")}
                      className={`
          px-3 py-2 rounded-lg text-xs
          border transition
          ${format === f ? "bg-primary text-primary-foreground" : "border-border"}
        `}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Total pages">
                  <input
                    type="number"
                    min={1}
                    value={totalPages}
                    onChange={(e) => setTotalPages(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Current page">
                  <input
                    type="number"
                    min={0}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Status">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => {
                    const m = BOOK_STATUS_META[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
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
              </Field>
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
                {edit ? "Save changes" : "Add book"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
