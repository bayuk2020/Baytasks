/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Plus,
  Trash2,
  Clock,
  Circle,
  Target,
  Sparkles,
  GripVertical,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "@/lib/store";

/**
 * Lini masa tahapan (milestone) sebuah Goal.
 *
 * Dua kemampuan yang sebelumnya belum ada:
 *   1. EDIT — dulu tahapan cuma bisa ditambah, dicentang, dan dihapus. Salah
 *      ketik judul berarti harus hapus lalu buat ulang, dan itu menghilangkan
 *      status centangnya.
 *   2. DRAG & DROP — urutannya sekarang disimpan di kolom `milestones.sort_order`
 *      dan dikirim ke /api/milestones/reorder. Sebelum ini komponen mengurutkan
 *      dengan `(a.order || 0)` padahal kolomnya tidak pernah ada di database,
 *      jadi urutannya sebenarnya mengikuti id.
 *
 * Catatan warna: komponen ini dulu memakai kelas keras seperti `text-white`,
 * `bg-white/[0.03]`, dan `bg-black/40`. Semuanya tidak terbaca di tema terang.
 * Sekarang memakai token tema (`text-foreground`, `bg-card`, `border-border`,
 * `text-muted-foreground`) supaya satu komponen melayani dua tema.
 */

type MilestoneLike = Record<string, any>;

function bacaTanggal(m: MilestoneLike): number | null {
  if (m.due_date) return new Date(m.due_date).getTime();
  if (m.dueAt) return Number(m.dueAt);
  return null;
}

/** Ubah apa pun bentuk tanggalnya jadi "YYYY-MM-DD" untuk <input type="date">. */
function keInputTanggal(m: MilestoneLike): string {
  if (m.due_date) return String(m.due_date).slice(0, 10);
  if (!m.dueAt) return "";
  const d = new Date(Number(m.dueAt));
  // Sengaja pakai komponen waktu LOKAL, bukan toISOString(): toISOString()
  // mengubah ke UTC dan bisa menggeser tanggalnya mundur sehari untuk WIB.
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${tanggal}`;
}

function BarisMilestone({
  m,
  accent,
  sedangDiedit,
  mulaiEdit,
  batalEdit,
  simpanEdit,
  onToggle,
  onHapus,
}: {
  m: MilestoneLike;
  accent: string;
  sedangDiedit: boolean;
  mulaiEdit: () => void;
  batalEdit: () => void;
  simpanEdit: (patch: { name: string; due_date: string | null; target_value: number }) => void;
  onToggle: () => void;
  onHapus: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(m.id),
    // Saat baris sedang diedit, drag dimatikan supaya kursor di dalam input
    // tidak ikut menyeret kartunya.
    disabled: sedangDiedit,
  });

  const [nama, setNama] = useState<string>(m.name || m.title || "");
  const [tanggal, setTanggal] = useState<string>(keInputTanggal(m));
  const [target, setTarget] = useState<string>(
    m.target_value || m.targetValue ? String(m.target_value ?? m.targetValue) : "",
  );

  // Kalau data dari server berubah (mis. setelah loadGoals), isi form ikut
  // disegarkan — tapi hanya ketika form-nya memang sedang dibuka.
  useEffect(() => {
    if (!sedangDiedit) return;
    setNama(m.name || m.title || "");
    setTanggal(keInputTanggal(m));
    setTarget(m.target_value || m.targetValue ? String(m.target_value ?? m.targetValue) : "");
  }, [sedangDiedit, m]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const waktuTenggat = bacaTanggal(m);
  const lewatTenggat = !m.completed && waktuTenggat && waktuTenggat < Date.now();
  const judul = m.name || m.title || "Tahapan Milestone";
  const nilaiTarget = m.target_value !== undefined ? m.target_value : m.targetValue;

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const bersih = nama.trim();
    if (!bersih) return;
    simpanEdit({
      name: bersih,
      due_date: tanggal ? tanggal : null,
      target_value: target ? Number(target) : 0,
    });
  };

  return (
    <li ref={setNodeRef} style={style} className="relative pl-10 group list-none">
      {/* Pegangan geser. Sengaja TIDAK dipasang di seluruh kartu supaya tombol
          centang/edit/hapus tetap bisa diklik tanpa memicu drag. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Geser untuk mengubah urutan"
        title="Geser untuk mengubah urutan"
        className={`absolute -left-5 top-2 h-7 w-5 grid place-items-center rounded-md border-0 bg-transparent p-0
          text-muted-foreground/50 hover:text-foreground transition
          cursor-grab active:cursor-grabbing touch-none
          opacity-0 group-hover:opacity-100 focus-visible:opacity-100
          ${isDragging ? "opacity-100" : ""} ${sedangDiedit ? "pointer-events-none opacity-0" : ""}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Lingkaran status */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute left-1 top-0.5 h-6 w-6 grid place-items-center rounded-full border transition-all duration-200 cursor-pointer p-0 shadow-sm z-10"
        style={{
          borderColor: m.completed ? accent : "var(--color-border)",
          background: m.completed ? accent : "var(--color-card)",
          color: m.completed ? "#000000" : "var(--color-muted-foreground)",
          boxShadow: m.completed ? `0 0 12px ${accent}40` : "none",
        }}
        aria-label={m.completed ? "Tandai belum selesai" : "Tandai selesai"}
      >
        {m.completed ? (
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        ) : (
          <Circle className="h-2 w-2 fill-current opacity-50 transition-transform group-hover:scale-125" />
        )}
      </button>

      {sedangDiedit ? (
        <form
          onSubmit={kirim}
          className="rounded-xl border border-[color-mix(in_oklab,var(--neon)_35%,transparent)] bg-card p-3 shadow-sm space-y-2"
        >
          <input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama tahapan"
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--neon)] transition"
          />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-[var(--neon)] transition"
            />
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target angka"
              className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--neon)] transition"
            />
            <button
              type="submit"
              disabled={!nama.trim()}
              className="rounded-lg px-4 py-2 text-xs font-bold border-0 cursor-pointer transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: accent, color: "#000" }}
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={batalEdit}
              className="rounded-lg px-3 py-2 text-xs font-semibold border border-border bg-secondary text-secondary-foreground hover:bg-accent transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <div
          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${
            m.completed
              ? "bg-muted/40 border-border opacity-60"
              : "bg-card border-border hover:border-[color-mix(in_oklab,var(--neon)_35%,transparent)] hover:shadow-sm"
          }`}
        >
          <div className="min-w-0 space-y-1">
            <div
              className={`text-xs font-semibold tracking-wide transition-all ${
                m.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {judul}
            </div>

            <div className="flex items-center gap-3 text-[10px] font-medium">
              {nilaiTarget !== undefined && nilaiTarget > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                  Target: {nilaiTarget}
                </span>
              )}
              {waktuTenggat && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    lewatTenggat
                      ? "text-[var(--priority-urgent)] font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {new Date(waktuTenggat).toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
            <button
              type="button"
              onClick={mulaiEdit}
              className="text-muted-foreground hover:text-[var(--neon)] transition bg-transparent border-0 cursor-pointer p-1 rounded-md"
              aria-label="Ubah tahapan"
              title="Ubah tahapan"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onHapus}
              className="text-muted-foreground hover:text-[var(--destructive)] transition bg-transparent border-0 cursor-pointer p-1 rounded-md"
              aria-label="Hapus tahapan"
              title="Hapus tahapan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function MilestoneTimeline({ goalId, accent }: { goalId: string; accent: string }) {
  const milestones = useStore((s: any) => s.milestones || []);
  const rawStore: any = useStore();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [target, setTarget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      milestones
        .filter(
          (m: MilestoneLike) =>
            m.goalId?.toString() === goalId?.toString() ||
            m.goal_id?.toString() === goalId?.toString(),
        )
        // sort_order dulu, lalu id sebagai pemecah seri supaya dua tahapan
        // dengan nomor urut sama tidak bertukar posisi tiap render.
        .sort((a: MilestoneLike, b: MilestoneLike) => {
          const sa = Number(a.sort_order ?? a.order ?? 0);
          const sb = Number(b.sort_order ?? b.order ?? 0);
          if (sa !== sb) return sa - sb;
          return Number(a.id) - Number(b.id);
        }),
    [milestones, goalId],
  );

  const completedCount = list.filter((m: MilestoneLike) => m.completed).length;
  const persen = list.length ? Math.round((completedCount / list.length) * 100) : 0;

  const sensors = useSensors(
    // Jarak 6px supaya klik biasa (centang/edit/hapus) tidak dianggap drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dariIndex = list.findIndex((m: MilestoneLike) => String(m.id) === String(active.id));
    const keIndex = list.findIndex((m: MilestoneLike) => String(m.id) === String(over.id));
    if (dariIndex === -1 || keIndex === -1) return;

    const urutanBaru = arrayMove<MilestoneLike>(list, dariIndex, keIndex).map((m) => m.id);
    rawStore.reorderMilestones?.(goalId, urutanBaru);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = title.trim();
    if (!finalName) return;

    rawStore.addMilestone?.({
      goal_id: goalId,
      name: finalName,
      due_date: due ? due : null,
      target_value: target ? Number(target) : 0,
      current_value: 0,
      completed: false,
      weight: 1,
      goalId,
      title: finalName,
      dueAt: due ? new Date(due).getTime() : undefined,
      targetValue: target ? Number(target) : undefined,
    });

    setTitle("");
    setDue("");
    setTarget("");
    setAdding(false);
  };

  return (
    <div className="border border-border bg-card rounded-2xl p-6 text-xs relative overflow-hidden shadow-sm">
      {/* Kepala: ringkasan + tombol tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: accent }} /> Target Lini Masa Tahapan
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Progress penyelesaian:{" "}
            <span className="font-semibold text-foreground">
              {completedCount} dari {list.length}
            </span>{" "}
            tahapan terselesaikan.
          </p>
          {list.length > 0 && (
            <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${persen}%`, background: accent }}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-secondary hover:bg-accent text-secondary-foreground border border-border transition cursor-pointer font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Tahapan
        </button>
      </div>

      {/* Form tambah */}
      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={submit}
            className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 bg-muted/50 border border-border p-4 rounded-xl"
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: 50 Workouts Tercapai..."
              className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--neon)] transition"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-[var(--neon)] transition"
            />
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target Angka"
              className="w-full sm:w-28 rounded-lg bg-background border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--neon)] transition"
            />
            <button
              className="rounded-lg font-bold px-4 py-2 text-xs transition shadow-sm cursor-pointer border-0"
              style={{ background: accent, color: "#000" }}
            >
              Simpan
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Daftar */}
      {list.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl bg-muted/30">
          <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Belum ada rincian tahapan milestone. Pecah target besar ini menjadi beberapa langkah
            kecil.
          </p>
        </div>
      ) : (
        <div className="relative pl-1">
          {/* Garis lini masa */}
          <div className="absolute left-[15px] top-3 bottom-3 w-[1.5px] bg-border pointer-events-none" />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={list.map((m: MilestoneLike) => String(m.id))}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-4 list-none p-0 m-0">
                {list.map((m: MilestoneLike) => (
                  <BarisMilestone
                    key={m.id}
                    m={m}
                    accent={accent}
                    sedangDiedit={editingId === String(m.id)}
                    mulaiEdit={() => setEditingId(String(m.id))}
                    batalEdit={() => setEditingId(null)}
                    simpanEdit={(patch) => {
                      rawStore.updateMilestone?.(m.id, patch);
                      setEditingId(null);
                    }}
                    onToggle={() => rawStore.toggleMilestone?.(m.id)}
                    onHapus={() => rawStore.removeMilestone?.(m.id)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>

          <p className="mt-4 text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
            <GripVertical className="h-3 w-3" />
            Arahkan kursor ke sebuah tahapan, lalu geser pegangan di kiri untuk mengubah urutannya.
          </p>
        </div>
      )}
    </div>
  );
}
