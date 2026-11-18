/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  Link2,
  Link2Off,
  Network,
  Sparkles,
  FolderTree,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  mindMapApi,
  type MindMapSummary,
  type MindMapDetail,
  type MindMapNode,
  type MindMapNodeType,
} from "@/lib/api";

export const Route = createFileRoute("/mindmap")({
  head: () => ({
    meta: [{ title: "Mind Map — BayTasks" }],
  }),
  component: MindMapPage,
});

function MindMapPage() {
  const { boards, activeBoardId, loadBoards, loadTasks } = useStore();

  const [maps, setMaps] = useState<MindMapSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MindMapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMapTitle, setNewMapTitle] = useState("");

  useEffect(() => {
    loadBoards();
  }, []);

  const loadMaps = useCallback(async () => {
    try {
      const list = await mindMapApi.list();
      setMaps(list);
      setActiveId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      console.error("LOAD MIND MAPS ERROR", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    try {
      setDetail(await mindMapApi.get(id));
    } catch (err) {
      console.error("LOAD MIND MAP ERROR", err);
    }
  }, []);

  useEffect(() => {
    void loadMaps();
  }, [loadMaps]);

  useEffect(() => {
    if (activeId) void loadDetail(activeId);
    else setDetail(null);
  }, [activeId, loadDetail]);

  /**
   * Muat ulang map SEKALIGUS task di store. Setiap perubahan centang pada node
   * yang tertaut ikut memindahkan task di papan, jadi papan/dashboard harus
   * ikut segar -- kalau tidak, angka di halaman lain jadi basi.
   */
  const refresh = async () => {
    if (activeId) await loadDetail(activeId);
    await loadMaps();
    await loadTasks();
  };

  const createMap = async () => {
    const title = newMapTitle.trim();
    if (!title) return;
    try {
      const created = await mindMapApi.create({ title });
      setNewMapTitle("");
      setActiveId(created.id);
      await loadMaps();
      toast.success("Mind map dibuat");
    } catch (err) {
      console.error("CREATE MIND MAP ERROR", err);
      toast.error("Gagal membuat mind map");
    }
  };

  // =========================
  // DRAG & DROP
  // =========================

  const [drag, setDrag] = useState<DragState>({
    draggingId: null,
    overId: null,
    zone: null,
  });

  const moveNode = async (id: number, parentId: number | null, position?: number) => {
    setDrag({ draggingId: null, overId: null, zone: null });
    try {
      await mindMapApi.moveNode(id, { parent_id: parentId, position });
      await refresh();
    } catch (err) {
      console.error("MOVE NODE ERROR", err);
      // Backend menolak pemindahan yang akan membuat siklus (node masuk ke
      // cabangnya sendiri) -- tampilkan alasannya, bukan pesan umum.
      const pesan = String((err as Error)?.message ?? "");
      toast.error(
        pesan.includes("cabangnya sendiri")
          ? "Tidak bisa memindahkan node ke dalam cabangnya sendiri."
          : "Gagal memindahkan node.",
      );
      await refresh();
    }
  };

  /**
   * Terjemahkan "jatuh di node X, zona Z" jadi (induk baru, indeks).
   * Perlu cari induk & indeks node target di pohon, karena zona
   * before/after berarti menjadi SAUDARA target, bukan anaknya.
   */
  const handleDrop = (targetId: number, zone: DropZone) => {
    const dragged = drag.draggingId;
    if (dragged === null || dragged === targetId || !detail) return;

    if (zone === "inside") {
      void moveNode(dragged, targetId);
      return;
    }

    const found = findParentAndIndex(detail.nodes, targetId, null);
    if (!found) return;

    let index = zone === "before" ? found.index : found.index + 1;

    // Kalau node dipindah di dalam induk yang SAMA dan asalnya di atas titik
    // sisip, indeksnya bergeser satu setelah node itu dicabut dari daftar.
    const from = findParentAndIndex(detail.nodes, dragged, null);
    if (from && from.parentId === found.parentId && from.index < index) {
      index -= 1;
    }

    void moveNode(dragged, found.parentId, index);
  };

  const deleteMap = async (id: number) => {
    if (!confirm("Hapus mind map ini beserta seluruh isinya?")) return;
    try {
      await mindMapApi.remove(id);
      if (activeId === id) setActiveId(null);
      await loadMaps();
      toast.success("Mind map dihapus");
    } catch (err) {
      console.error("DELETE MIND MAP ERROR", err);
      toast.error("Gagal menghapus mind map");
    }
  };

  const totals = countNodes(detail?.nodes ?? []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.05] via-background to-fuchsia-500/[0.03] p-6 shadow-[0_0_50px_rgba(167,139,250,0.06)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.09),transparent_35%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-100 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              Mind Map
            </h1>
            <Sparkles className="h-5 w-5 text-violet-300" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pecah rencana jadi topik dan task bercabang. Task bisa ditautkan ke papan Kanban
            supaya status selesainya sinkron dua arah.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* DAFTAR MAP */}
        <aside className="glass rounded-2xl p-4 border border-border/40 h-fit lg:sticky lg:top-20">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Daftar Map
          </h2>

          <div className="flex gap-2 mb-3">
            <input
              value={newMapTitle}
              onChange={(e) => setNewMapTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createMap()}
              placeholder="Nama map baru…"
              className="flex-1 min-w-0 bg-secondary/60 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={createMap}
              className="px-2.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-100 hover:bg-violet-500/30 transition"
              aria-label="Buat mind map"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Memuat…</p>
          ) : maps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada mind map.
            </p>
          ) : (
            <ul className="space-y-1">
              {maps.map((m) => (
                <li key={m.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveId(m.id)}
                    className={`flex-1 min-w-0 text-left rounded-lg px-3 py-2 text-sm transition ${
                      activeId === m.id
                        ? "bg-violet-500/15 text-violet-100 border border-violet-400/30"
                        : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <div className="truncate">{m.title}</div>
                    <div className="text-[10px] text-muted-foreground">{m.nodeCount} node</div>
                  </button>
                  <button
                    onClick={() => deleteMap(m.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 h-7 w-7 shrink-0 grid place-items-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-accent transition"
                    aria-label="Hapus map"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* POHON */}
        <section className="glass rounded-2xl p-5 border border-border/40 min-h-[400px]">
          {!detail ? (
            <div className="text-center text-muted-foreground py-16">
              <Network className="h-8 w-8 mx-auto mb-3 text-violet-300/60" />
              <p className="text-sm">Pilih atau buat mind map untuk mulai.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <h2 className="font-semibold">{detail.title}</h2>
                <div className="text-[11px] text-muted-foreground">
                  {totals.topics} topik · {totals.tasks} task · {totals.done} selesai
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Dobel-klik judul untuk mengubah · seret baris untuk memindahkan: jatuhkan di
                tengah baris untuk menjadikannya anak, di tepi atas/bawah untuk menyisipkan
                sebagai sejajar.
              </p>

              <NodeChildren
                nodes={detail.nodes}
                depth={0}
                mapId={detail.id}
                boards={boards}
                activeBoardId={activeBoardId}
                onChanged={refresh}
                drag={drag}
                setDrag={setDrag}
                onDrop={handleDrop}
              />

              {/* Zona jatuh untuk memindahkan node jadi akar paling bawah */}
              <div
                onDragOver={(e) => {
                  if (drag.draggingId === null) return;
                  e.preventDefault();
                  setDrag((s) => ({ ...s, overId: -1, zone: "after" }));
                }}
                onDragLeave={() => {
                  if (drag.overId === -1) setDrag((s) => ({ ...s, overId: null, zone: null }));
                }}
                onDrop={(e) => {
                  if (drag.draggingId === null) return;
                  e.preventDefault();
                  void moveNode(drag.draggingId, null, detail.nodes.length);
                }}
                className={`mt-1 rounded-lg border border-dashed transition ${
                  drag.draggingId !== null
                    ? drag.overId === -1
                      ? "border-violet-400/70 bg-violet-500/10 py-3"
                      : "border-border/60 py-3"
                    : "border-transparent py-0"
                }`}
              >
                {drag.draggingId !== null && (
                  <p className="text-[11px] text-center text-muted-foreground">
                    Jatuhkan di sini untuk jadikan tingkat teratas
                  </p>
                )}
              </div>

              {/* Tambah node akar */}
              <AddNodeRow
                mapId={detail.id}
                parentId={null}
                depth={0}
                onAdded={refresh}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Cari induk & indeks sebuah node di dalam pohon.
 * Dipakai drag & drop untuk menerjemahkan "sisip sebelum/sesudah node X"
 * menjadi (induk X, indeks X).
 */
function findParentAndIndex(
  nodes: MindMapNode[],
  id: number,
  parentId: number | null,
): { parentId: number | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { parentId, index: i };

    const deeper = findParentAndIndex(nodes[i].children, id, nodes[i].id);
    if (deeper) return deeper;
  }

  return null;
}

/** Hitung rekap topik/task/selesai untuk header. */
function countNodes(nodes: MindMapNode[]): { topics: number; tasks: number; done: number } {
  let topics = 0;
  let tasks = 0;
  let done = 0;

  const walk = (list: MindMapNode[]) => {
    for (const n of list) {
      if (n.type === "topic") topics++;
      else {
        tasks++;
        if (n.done) done++;
      }
      walk(n.children);
    }
  };

  walk(nodes);
  return { topics, tasks, done };
}

/** Lebar satu tingkat indentasi (px). */
const INDENT = 26;

/** Zona jatuh saat drag: sisip sebelum / jadikan anak / sisip sesudah. */
type DropZone = "before" | "inside" | "after";

interface DragState {
  draggingId: number | null;
  overId: number | null;
  zone: DropZone | null;
}

function NodeChildren({
  nodes,
  depth,
  mapId,
  boards,
  activeBoardId,
  onChanged,
  drag,
  setDrag,
  onDrop,
}: {
  nodes: MindMapNode[];
  depth: number;
  mapId: number;
  boards: { id: string; name: string; emoji: string }[];
  activeBoardId: string;
  onChanged: () => Promise<void>;
  drag: DragState;
  setDrag: React.Dispatch<React.SetStateAction<DragState>>;
  onDrop: (targetId: number, zone: DropZone) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((n, i) => (
        <NodeRow
          key={n.id}
          node={n}
          index={i}
          depth={depth}
          mapId={mapId}
          boards={boards}
          activeBoardId={activeBoardId}
          onChanged={onChanged}
          drag={drag}
          setDrag={setDrag}
          onDrop={onDrop}
        />
      ))}
    </ul>
  );
}

function NodeRow({
  node,
  index,
  depth,
  mapId,
  boards,
  activeBoardId,
  onChanged,
  drag,
  setDrag,
  onDrop,
}: {
  node: MindMapNode;
  index: number;
  depth: number;
  mapId: number;
  boards: { id: string; name: string; emoji: string }[];
  activeBoardId: string;
  onChanged: () => Promise<void>;
  drag: DragState;
  setDrag: React.Dispatch<React.SetStateAction<DragState>>;
  onDrop: (targetId: number, zone: DropZone) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasChildren = node.children.length > 0;
  const isDragging = drag.draggingId === node.id;
  const isOver = drag.overId === node.id;

  /**
   * Tentukan zona jatuh dari posisi kursor di dalam baris:
   * 25% atas = sisip sebelum, 25% bawah = sisip sesudah, tengah = jadikan anak.
   */
  const zoneFromEvent = (e: React.DragEvent<HTMLDivElement>): DropZone => {
    const r = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - r.top;
    if (y < r.height * 0.25) return "before";
    if (y > r.height * 0.75) return "after";
    return "inside";
  };

  const toggleCollapse = async () => {
    try {
      await mindMapApi.updateNode(node.id, { collapsed: !node.collapsed });
      await onChanged();
    } catch (err) {
      console.error("TOGGLE COLLAPSE ERROR", err);
    }
  };

  const toggleDone = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await mindMapApi.updateNode(node.id, { done: !node.done });
      await onChanged();
    } catch (err) {
      console.error("TOGGLE NODE ERROR", err);
      toast.error("Gagal mengubah status");
    } finally {
      setBusy(false);
    }
  };

  const saveTitle = async () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === node.title) {
      setDraft(node.title);
      return;
    }
    try {
      await mindMapApi.updateNode(node.id, { title: next });
      await onChanged();
    } catch (err) {
      console.error("RENAME NODE ERROR", err);
      toast.error("Gagal mengubah judul");
      setDraft(node.title);
    }
  };

  const remove = async () => {
    const pesan = hasChildren
      ? "Hapus node ini beserta semua cabang di bawahnya?"
      : "Hapus node ini?";
    if (!confirm(pesan)) return;
    try {
      await mindMapApi.removeNode(node.id);
      await onChanged();
      toast.success("Node dihapus");
    } catch (err) {
      console.error("DELETE NODE ERROR", err);
      toast.error("Gagal menghapus node");
    }
  };

  const linkToBoard = async () => {
    const board = boards.find((b) => b.id === activeBoardId) ?? boards[0];
    if (!board) {
      toast.error("Belum ada board. Buat board dulu di sidebar.");
      return;
    }
    try {
      await mindMapApi.linkNode(node.id, { board_id: board.id });
      await onChanged();
      toast.success(`Tersambung ke board "${board.name}"`);
    } catch (err) {
      console.error("LINK NODE ERROR", err);
      toast.error("Gagal menyambungkan ke board");
    }
  };

  const unlink = async () => {
    try {
      await mindMapApi.unlinkNode(node.id);
      await onChanged();
      toast.success("Tautan dilepas (task di papan tetap ada)");
    } catch (err) {
      console.error("UNLINK NODE ERROR", err);
      toast.error("Gagal melepas tautan");
    }
  };

  const isTask = node.type === "task";

  return (
    <li>
      <div
        draggable={!editing}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          // Firefox tidak memulai drag tanpa data yang di-set.
          e.dataTransfer.setData("text/plain", String(node.id));
          setDrag({ draggingId: node.id, overId: null, zone: null });
        }}
        onDragEnd={() => setDrag({ draggingId: null, overId: null, zone: null })}
        onDragOver={(e) => {
          if (drag.draggingId === null || drag.draggingId === node.id) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          const zone = zoneFromEvent(e);
          if (drag.overId !== node.id || drag.zone !== zone) {
            setDrag((s) => ({ ...s, overId: node.id, zone }));
          }
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (drag.overId === node.id) setDrag((s) => ({ ...s, overId: null, zone: null }));
        }}
        onDrop={(e) => {
          if (drag.draggingId === null || drag.draggingId === node.id) return;
          e.preventDefault();
          e.stopPropagation();
          onDrop(node.id, zoneFromEvent(e));
        }}
        className={`group relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition cursor-grab active:cursor-grabbing
          ${isDragging ? "opacity-40" : "hover:bg-secondary/40"}
          ${isOver && drag.zone === "inside" ? "ring-2 ring-violet-400/70 bg-violet-500/10" : ""}
        `}
        style={{ paddingLeft: `${depth * INDENT + 8}px` }}
      >
        {/* GARIS PANDUAN KEDALAMAN -- tanpa ini tingkat 3-4 sulit dibedakan,
            karena indentasi saja terlalu halus untuk dibaca sekilas. */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${i * INDENT + 18}px` }}
          />
        ))}

        {/* Indikator sisip sebelum / sesudah */}
        {isOver && drag.zone === "before" && (
          <span
            className="pointer-events-none absolute -top-px h-0.5 bg-violet-400 rounded-full right-2"
            style={{ left: `${depth * INDENT + 8}px` }}
          />
        )}
        {isOver && drag.zone === "after" && (
          <span
            className="pointer-events-none absolute -bottom-px h-0.5 bg-violet-400 rounded-full right-2"
            style={{ left: `${depth * INDENT + 8}px` }}
          />
        )}

        {/* Collapse */}
        {hasChildren ? (
          <button
            onClick={toggleCollapse}
            className="h-5 w-5 shrink-0 grid place-items-center rounded text-muted-foreground hover:text-foreground"
            aria-label={node.collapsed ? "Buka cabang" : "Tutup cabang"}
          >
            {node.collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {/* Ikon jenis / checkbox */}
        {isTask ? (
          <button
            onClick={toggleDone}
            disabled={busy}
            className={`h-4 w-4 shrink-0 rounded border grid place-items-center transition ${
              node.done ? "bg-primary border-primary" : "border-border hover:border-primary/50"
            } ${busy ? "opacity-50" : ""}`}
            aria-label={node.done ? "Batalkan centang" : "Tandai selesai"}
          >
            {node.done && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>
        ) : (
          <FolderTree className="h-4 w-4 shrink-0 text-violet-300/80" />
        )}

        {/* Judul */}
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveTitle();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft(node.title);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 bg-secondary/60 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setDraft(node.title);
              setEditing(true);
            }}
            title="Dobel-klik untuk mengubah"
            className={`flex-1 min-w-0 truncate text-sm cursor-text select-none ${
              isTask && node.done ? "line-through text-muted-foreground" : ""
            } ${!isTask ? "font-medium" : ""}`}
          >
            {node.title}
          </span>
        )}

        {/* Penanda tautan board */}
        {node.taskId && (
          <span
            title={`Tersambung ke task papan: ${node.linkedTask?.title ?? ""}`}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-200 border border-cyan-400/25"
          >
            <Link2 className="h-2.5 w-2.5" />
            board
          </span>
        )}

        {/* Aksi */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
          <button
            onClick={() => setAdding((v) => !v)}
            title="Tambah cabang"
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {isTask &&
            (node.taskId ? (
              <button
                onClick={unlink}
                title="Lepas tautan dari papan"
                className="h-6 w-6 grid place-items-center rounded text-[var(--neon)] hover:brightness-125 hover:bg-accent"
              >
                <Link2Off className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={linkToBoard}
                title="Sambungkan ke papan Kanban"
                className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-[var(--neon)] hover:bg-accent"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>
            ))}

          <button
            onClick={remove}
            title="Hapus node"
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-rose-400 hover:bg-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {adding && (
        <AddNodeRow
          mapId={mapId}
          parentId={node.id}
          depth={depth + 1}
          autoFocus
          onAdded={async () => {
            setAdding(false);
            await onChanged();
          }}
        />
      )}

      {hasChildren && !node.collapsed && (
        <NodeChildren
          nodes={node.children}
          depth={depth + 1}
          mapId={mapId}
          boards={boards}
          activeBoardId={activeBoardId}
          onChanged={onChanged}
          drag={drag}
          setDrag={setDrag}
          onDrop={onDrop}
        />
      )}
    </li>
  );
}

function AddNodeRow({
  mapId,
  parentId,
  depth,
  autoFocus,
  onAdded,
}: {
  mapId: number;
  parentId: number | null;
  depth: number;
  autoFocus?: boolean;
  onAdded: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MindMapNodeType>("task");

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    try {
      await mindMapApi.addNode({ mind_map_id: mapId, parent_id: parentId, type, title: t });
      setTitle("");
      await onAdded();
    } catch (err) {
      console.error("ADD NODE ERROR", err);
      toast.error("Gagal menambah node");
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 py-1.5"
      style={{ paddingLeft: `${depth * INDENT + 8}px` }}
    >
      <span className="h-5 w-5 shrink-0" />

      {/* Pilih jenis node */}
      <div className="flex items-center rounded-md border border-border overflow-hidden shrink-0">
        <button
          onClick={() => setType("topic")}
          title="Topik (pengelompok, tidak bisa dicentang)"
          className={`h-6 px-1.5 grid place-items-center transition ${
            type === "topic" ? "bg-violet-500/20 text-violet-200" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderTree className="h-3 w-3" />
        </button>
        <button
          onClick={() => setType("task")}
          title="Task (bisa dicentang & ditautkan ke papan)"
          className={`h-6 px-1.5 grid place-items-center transition ${
            type === "task" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListChecks className="h-3 w-3" />
        </button>
      </div>

      <input
        autoFocus={autoFocus}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={type === "topic" ? "Topik baru…" : "Task baru…"}
        className="flex-1 min-w-0 bg-secondary/50 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
      />

      <button
        onClick={submit}
        className="shrink-0 h-6 px-2 rounded-md bg-violet-500/20 border border-violet-400/25 text-violet-100 text-xs hover:bg-violet-500/30 transition"
      >
        Tambah
      </button>
    </div>
  );
}
