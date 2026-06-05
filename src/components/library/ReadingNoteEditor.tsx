/* eslint-disable prettier/prettier */
import { AnimatePresence, motion } from "framer-motion";
import { Bold, Heading2, Italic, List, Save, StickyNote, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type BookNote } from "@/lib/store";

export function ReadingNoteEditor({ note, defaultPage, onSave, onCancel }: {
  note?: BookNote;
  defaultPage: number;
  onSave: (payload: { pageNumber: number; chapter: string; title: string; content: string }) => void;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pageNumber, setPageNumber] = useState(String(note?.pageNumber ?? defaultPage ?? 1));
  const [chapter, setChapter] = useState(note?.chapter ?? "");
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "<p></p>");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
const saveTimeout =
  useRef<number | null>(
    null
  );
  useEffect(() => {
    setPageNumber(String(note?.pageNumber ?? defaultPage ?? 1));
    setChapter(note?.chapter ?? "");
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "<p></p>");
    if (ref.current) ref.current.innerHTML = note?.content ?? "<p></p>";
  }, [note?.id, defaultPage]);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) ref.current.innerHTML = content || "<p></p>";
  }, [content]);

  const flashSaved = () => {
    setSaving("saving");
    window.setTimeout(() => setSaving("saved"), 220);
    window.setTimeout(() => setSaving("idle"), 1300);
  };

const debouncedSave = (
  next?: Partial<{
    pageNumber: string;
    chapter: string;
    title: string;
    content: string;
  }>
) => {

  setSaving(
    "saving"
  );

  if (
    saveTimeout.current
  ) {

    clearTimeout(
      saveTimeout.current
    );
  }

  saveTimeout.current =
    window.setTimeout(
      async () => {

        const payload = {

          pageNumber:
            Math.max(
              0,
              parseInt(
                next?.pageNumber ??
                pageNumber
              ) || 0
            ),

          chapter:
            (
              next?.chapter ??
              chapter
            ).trim(),

          title:
            (
              next?.title ??
              title
            ).trim(),

          content:
            next?.content ??
            content,
        };

        if (
          !note &&
          !stripHtml(
            payload.content
          ).trim() &&
          !payload.title
        ) {
          return;
        }

        await onSave(
          payload
        );

        setSaving(
          "saved"
        );

        window.setTimeout(
          () => {

            setSaving(
              "idle"
            );

          },
          1200
        );

      },
      700
    );
};

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    const html = ref.current?.innerHTML ?? "<p></p>";
    setContent(html);
    debouncedSave({ content: html });
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-medium inline-flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> {note ? "Edit note" : "New note"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Autosaves as you capture insight.</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saving !== "idle" && (
              <motion.span key={saving} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Save className="h-3 w-3" /> {saving === "saving" ? "Saving…" : "Saved"}
              </motion.span>
            )}
          </AnimatePresence>
          {onCancel && (
            <button onClick={onCancel} className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-accent transition" aria-label="Close note editor">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative grid sm:grid-cols-[110px_1fr] gap-3 mb-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Page</span>
          <input type="number" min={0} value={pageNumber} onChange={(e) => { setPageNumber(e.target.value); debouncedSave({ pageNumber: e.target.value }); }} className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Chapter</span>
          <input value={chapter} onChange={(e) => { setChapter(e.target.value); debouncedSave({ chapter: e.target.value }); }} className={`${inputCls} mt-1`} placeholder="Chapter or section" />
        </label>
      </div>
      <input value={title} onChange={(e) => { setTitle(e.target.value); debouncedSave({ title: e.target.value }); }} className="relative w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50" placeholder="Note title…" />
      <div className="relative flex items-center gap-1 p-1 my-4 rounded-xl border border-border bg-secondary/40 w-fit shadow-[0_0_24px_-12px_var(--primary)]">
        <TbBtn onClick={() => exec("bold")}><Bold className="h-3.5 w-3.5" /></TbBtn>
        <TbBtn onClick={() => exec("italic")}><Italic className="h-3.5 w-3.5" /></TbBtn>
        <TbBtn onClick={() => exec("formatBlock", "H2")}><Heading2 className="h-3.5 w-3.5" /></TbBtn>
        <TbBtn onClick={() => exec("insertUnorderedList")}><List className="h-3.5 w-3.5" /></TbBtn>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={(e) => { const html = (e.target as HTMLDivElement).innerHTML; setContent(html); debouncedSave({ content: html }); }}
        className="relative prose prose-invert max-w-none min-h-[180px] outline-none text-sm leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-foreground" />
    </motion.section>
  );
}

const inputCls = "w-full rounded-lg bg-secondary/60 border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";

function TbBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition">{children}</button>;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}