/* eslint-disable prettier/prettier */
import { attachmentApi, subtaskApi, subtaskCreateApi } from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { ColumnId, Priority, useStore, COLUMNS } from "@/lib/store";

import { motion, AnimatePresence } from "framer-motion";

import {
  X,
  Trash2,
  Plus,
  Bell,
  Tag,
  Calendar,
  Repeat,
  Paperclip,
  FileText,
  Activity,
  Check,
  EyeOff,
} from "lucide-react";

const PRIORITIES: Priority[] = ["low", "med", "high", "urgent"];

const REMINDER_OPTS = [
  {
    v: null,
    label: "None",
  },
  {
    v: "10m",
    label: "10 min before",
  },
  {
    v: "1h",
    label: "1 hour before",
  },
  {
    v: "1d",
    label: "1 day before",
  },
] as const;

const RECUR_OPTS = ["none", "daily", "weekly", "monthly"] as const;

const uid = () => Math.random().toString(36).slice(2, 10);

export function TaskModal({
  taskId,
  createInColumn,
  onClose,
}: {
  taskId?: string;
  createInColumn?: ColumnId;
  onClose: () => void;
}) {
  const {
    tasks,
    activeBoardId,
    addTask,
    updateTask,
    removeTask,
    toggleSubtask,
    bumpStreak,
    loadTasks,
  } = useStore();

  const existing = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  // =========================
  // STATES
  // =========================

  const [title, setTitle] = useState(existing?.title ?? "");

  const [description, setDescription] = useState(existing?.description ?? "");

  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "med");

  const [tagsInput, setTagsInput] = useState((existing?.tags ?? []).join(", "));

  const [dueAt, setDueAt] = useState<string>(
    existing?.dueAt
      ? new Date(existing.dueAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : "",
  );

  const [reminder, setReminder] = useState<(typeof REMINDER_OPTS)[number]["v"]>(
    existing?.reminder ?? null,
  );

  const [recurring, setRecurring] = useState<(typeof RECUR_OPTS)[number]>(
    existing?.recurring ?? "none",
  );

  const [column, setColumn] = useState<ColumnId>(existing?.column ?? createInColumn ?? "todo");

  const [hidden, setHidden] = useState(existing?.hidden ?? false);

  const [notes, setNotes] = useState(existing?.notes ?? "");

  const [newSub, setNewSub] = useState("");

  // Edit judul subtask inline: simpan id yang sedang diedit + teks sementaranya.
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubTitle, setEditingSubTitle] = useState("");

  // =========================
  // ESC CLOSE
  // =========================

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // =========================
  // SAVE TASK
  // =========================

  const save = async () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const due = dueAt ? new Date(dueAt).getTime() : undefined;

    // =========================
    // UPDATE
    // =========================

    if (existing) {
      updateTask(existing.id, {
        title,
        description,
        priority,
        tags,
        dueAt: due,
        reminder,
        recurring,
        column,
        notes,
        reminded: false,
        hidden,
      });

      if (column === "done" && existing.column !== "done") {
        bumpStreak();
      }
    } else {
      // =========================
      // CREATE
      // =========================

      await addTask({
        boardId: activeBoardId,

        column,

        title,

        description,

        priority,

        tags,

        dueAt: due,

        reminder,

        recurring,

        notes,
      });
    }

    // =========================
    // RELOAD
    // =========================

    await loadTasks();

    onClose();
  };

  // =========================
  // ADD SUBTASK
  // =========================
  const addSub = async () => {
    if (!existing || !newSub.trim()) return;

    try {
      const data = await subtaskCreateApi.create({
        task_id: existing.id,

        title: newSub.trim(),

        position: existing.subtasks.length,
      });

      useStore.setState({
        tasks: useStore.getState().tasks.map((t) =>
          t.id === existing.id
            ? {
                ...t,

                subtasks: [
                  ...t.subtasks,

                  {
                    id: String(data.subtask.id),

                    title: data.subtask.title,

                    done: false,
                  },
                ],
              }
            : t,
        ),
      });

      setNewSub("");
    } catch (err) {
      console.error("ADD SUBTASK ERROR", err);
    }
  };

// =========================
  // DELETE SUBTASK
  // =========================
  const deleteSub = async (subtaskId: string) => {
    if (!existing) return;
    if (!confirm("Hapus subtask ini?")) return;

    const targetTaskId = existing.id; 

    try {
      // Tembak langsung ke endpoint TaskController Laravel! 💥
      await subtaskApi.remove(subtaskId); 

      // UI update lokal biar langsung ilang tanpa reload halaman
      useStore.setState({
        tasks: useStore.getState().tasks.map((t) =>
          t.id === targetTaskId
            ? {
                ...t,
                subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
              }
            : t
        ),
      });
      toast.success("Subtask deleted successfully");
    } catch (err) {
      console.error("DELETE SUBTASK ERROR", err);
      toast.error("Gagal menghapus subtask dari server");
    }
  };

  // =========================
  // EDIT SUBTASK (dobel-klik judulnya)
  // =========================
  const startEditSub = (subtaskId: string, currentTitle: string) => {
    setEditingSubId(subtaskId);
    setEditingSubTitle(currentTitle);
  };

  const cancelEditSub = () => {
    setEditingSubId(null);
    setEditingSubTitle("");
  };

  const saveEditSub = async () => {
    if (!existing || !editingSubId) return;

    const next = editingSubTitle.trim();
    const current = existing.subtasks.find((s) => s.id === editingSubId);

    // Kosong atau tidak berubah -> tidak perlu request ke server.
    if (!next || next === current?.title) {
      cancelEditSub();
      return;
    }

    const targetTaskId = existing.id;
    const targetSubId = editingSubId;
    cancelEditSub();

    try {
      await subtaskApi.updateTitle(targetSubId, next);

      useStore.setState({
        tasks: useStore.getState().tasks.map((t) =>
          t.id === targetTaskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === targetSubId ? { ...s, title: next } : s,
                ),
              }
            : t,
        ),
      });
      toast.success("Subtask updated successfully");
    } catch (err) {
      console.error("UPDATE SUBTASK ERROR", err);
      toast.error("Gagal menyimpan perubahan subtask");
    }
  };

  // =========================
  // ATTACHMENTS
  // =========================
  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!existing) return;

    const files = Array.from(e.target.files ?? []);

    try {
      for (const f of files) {
        if (f.size > 2500000) continue;

        const form = new FormData();

        form.append("task_id", existing.id);

        form.append("file", f);

        const data = await attachmentApi.upload(form);

        useStore.setState({
          tasks: useStore.getState().tasks.map((t) =>
            t.id === existing.id
              ? {
                  ...t,

                  attachments: [
                    ...t.attachments,

                    {
                      id: data.attachment.id,

                      name: data.attachment.name,

                      size: data.attachment.size,

                      dataUrl: data.attachment.url,
                    },
                  ],
                }
              : t,
          ),
        });
      }
    } catch (err) {
      console.error("ATTACHMENT ERROR", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm grid place-items-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 12,
            scale: 0.98,
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 28,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-border shadow-card"
        >
          {/* HEADER */}

          <div className="sticky top-0 glass-strong border-b border-border px-5 py-3 flex items-center justify-between">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              className="flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground"
              autoFocus
            />

            <div className="flex items-center gap-2">
              {existing && (
                <button
                  onClick={async () => {
                    await removeTask(existing.id);

                    await loadTasks();

                    onClose();
                  }}
                  className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-[var(--priority-urgent)] hover:bg-accent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CONTENT */}

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* LEFT */}

            <div className="md:col-span-2 space-y-5">
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-secondary/60 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="What needs to be done?"
                />
              </Field>

              {/* SUBTASK */}

          {/* SUBTASK */}
              <Field label="Subtasks" icon={<Check className="h-3.5 w-3.5" />}>
                {/* REVISI AMAN: Tambahkan optional chaining (?) sebelum .subtasks */}
                {existing?.subtasks?.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 group p-1 rounded-md hover:bg-secondary/40">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => toggleSubtask(existing.id, s.id)}
                        className={`h-4 w-4 shrink-0 rounded border ${
                          s.done ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {s.done && <Check className="h-3 w-3 text-primary-foreground" />}
                      </button>

                      {editingSubId === s.id ? (
                        <input
                          autoFocus
                          value={editingSubTitle}
                          onChange={(e) => setEditingSubTitle(e.target.value)}
                          onBlur={saveEditSub}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveEditSub();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditSub();
                            }
                          }}
                          className="flex-1 min-w-0 bg-secondary/60 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => startEditSub(s.id, s.title)}
                          title="Dobel-klik untuk mengubah"
                          className={`text-sm cursor-text select-none truncate ${
                            s.done ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {s.title}
                        </span>
                      )}
                    </div>

                    {/* TOMBOL HAPUS SUBTASK -- disembunyikan saat sedang mengedit
                        supaya tidak terklik tak sengaja, dan di mobile tetap
                        terlihat karena di sana tidak ada :hover. */}
                    {editingSubId !== s.id && (
                      <button
                        onClick={() => deleteSub(s.id)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 h-6 w-6 shrink-0 grid place-items-center rounded text-muted-foreground hover:text-[var(--priority-urgent)] hover:bg-accent transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}

                {existing ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSub()}
                      placeholder="Add a subtask…"
                      className="flex-1 bg-secondary/60 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />

                    <button
                      onClick={addSub}
                      className="px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Save the task to add subtasks</p>
                )}

                {existing && (existing.subtasks?.length ?? 0) > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Dobel-klik judul subtask untuk mengubahnya.
                  </p>
                )}
              </Field>

              {/* NOTES */}

              <Field label="Notes" icon={<FileText className="h-3.5 w-3.5" />}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-secondary/60 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Notes, links, references…"
                />
              </Field>

              {/* ATTACHMENTS */}

              {existing && (
                <Field label="Attachments" icon={<Paperclip className="h-3.5 w-3.5" />}>
                  <input
                    type="file"
                    multiple
                    onChange={onAttach}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
                  />

                  {existing.attachments.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {existing.attachments.map((a) => (
                        <li
                          key={a.id}
                          className="text-xs flex items-center justify-between bg-secondary/60 rounded-md px-2 py-1"
                        >
                          <a
                            href={a.dataUrl}
                            download={a.name}
                            className="truncate hover:text-primary"
                          >
                            {a.name}
                          </a>

                          <span className="text-muted-foreground">
                            {(a.size / 1024).toFixed(1)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
              )}

              {/* ACTIVITY */}

              {existing && existing.activity.length > 0 && (
                <Field label="Activity" icon={<Activity className="h-3.5 w-3.5" />}>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {existing.activity
                      .slice()
                      .reverse()
                      .map((a) => (
                        <li key={a.id}>
                          • {a.text} — {new Date(a.ts).toLocaleString()}
                        </li>
                      ))}
                  </ul>
                </Field>
              )}
            </div>

            {/* RIGHT */}

            <div className="space-y-4">
              <Field label="Status">
                <select
                  value={column}
                  onChange={(e) => {
                    const next = e.target.value as ColumnId;
                    setColumn(next);
                    // Keluar dari "Done" -> "hidden" jadi tidak relevan lagi,
                    // dan checkbox-nya juga hilang dari form, jadi nilainya
                    // dipulihkan supaya tidak diam-diam tersimpan true.
                    if (next !== "done") setHidden(false);
                  }}
                  className="w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </Field>

              {/* HIDDEN -- cuma relevan begitu task selesai, jadi disembunyikan
                  kalau statusnya belum "Done" supaya form tidak berisik */}
              {column === "done" && (
                <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1">Sembunyikan dari papan Kanban</span>
                </label>
              )}

              {/* PRIORITY */}

              <Field label="Priority">
                <div className="grid grid-cols-4 gap-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-xs uppercase tracking-wider py-1.5 rounded-md border transition ${
                        priority === p
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              {/* DATE */}

              <Field label="Due date" icon={<Calendar className="h-3.5 w-3.5" />}>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </Field>

              {/* REMINDER */}

              <Field label="Reminder" icon={<Bell className="h-3.5 w-3.5" />}>
                <select
                  value={reminder ?? ""}
                  onChange={(e) => setReminder((e.target.value || null) as typeof reminder)}
                  className="w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {REMINDER_OPTS.map((o) => (
                    <option key={o.label} value={o.v ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* RECUR */}

              <Field label="Recurring" icon={<Repeat className="h-3.5 w-3.5" />}>
                <select
                  value={recurring}
                  onChange={(e) => setRecurring(e.target.value as typeof recurring)}
                  className="w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {RECUR_OPTS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>

              {/* TAG */}

              <Field label="Tags" icon={<Tag className="h-3.5 w-3.5" />}>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="design, frontend"
                  className="w-full bg-secondary/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </Field>
            </div>
          </div>

          {/* FOOTER */}

          <div className="sticky bottom-0 glass-strong border-t border-border px-5 py-3 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>

            <button
              onClick={save}
              className="px-5 py-2.5 rounded-lg border border-sky-500/50 bg-sky-950/20 text-sky-400 text-xs font-bold shadow-[0_0_10px_rgba(14,165,233,0.15)] hover:bg-sky-500 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              {existing ? "Save changes" : "Create task"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {icon}

        {label}
      </div>

      {children}
    </div>
  );
}
