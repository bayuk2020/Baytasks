/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useStore } from "@/lib/store";
import { useSearch } from "@/components/AppShell";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TaskModal } from "@/components/TaskModal";
import GlowButton from "@/components/ui/GlowButton";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      {
        title: "Board — BayTasks",
      },
    ],
  }),

  component: BoardPage,
});

function BoardPage() {
  // 🔑 FIX: Panggil loadBoards dan loadTasks sekaligus dari Zustand store lu!
  const { boards, activeBoardId, loadBoards, loadTasks } = useStore();

  const board = boards.find((b) => b.id === activeBoardId);
  const { q } = useSearch();
  const [creating, setCreating] = useState(false);

  // =========================================================
  // LOGIC AUTO REFRESH (POLLING) SERENTAK TIAP 5 DETIK
  // =========================================================
  useEffect(() => {
    // Fungsi pembantu untuk reload semua data dari MySQL
    const syncDataFromDatabase = () => {
      if (typeof loadBoards === "function") loadBoards();
      if (typeof loadTasks === "function") loadTasks();
    };

    // Load pertama kali saat halaman dibuka
    syncDataFromDatabase();

    // Setel interval biar web auto-update tiap 5 detik tanpa F5
    const interval = setInterval(() => {
      syncDataFromDatabase();
    }, 5000);

    // Bersihkan interval pas user pindah halaman biar laptop kenceng terus
    return () => clearInterval(interval);
  }, [activeBoardId, loadBoards, loadTasks]);

  return (
    <div className="space-y-6">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <motion.header
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-cyan-500/10
          bg-gradient-to-br
          from-cyan-500/[0.03]
          via-background
          to-blue-500/[0.03]
          p-6
          shadow-[0_0_50px_rgba(34,211,238,0.06)]
        "
      >
        {/* AURA */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)]
            pointer-events-none
          "
        />

        <div className="relative z-10 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
              }}
              className="
                h-14
                w-14
                rounded-2xl
                border
                border-cyan-400/20
                bg-cyan-400/5
                flex
                items-center
                justify-center
                shadow-[0_0_30px_rgba(34,211,238,0.15)]
              "
            >
              <span className="text-3xl">{board?.emoji}</span>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    bg-gradient-to-r
                    from-cyan-100
                    via-cyan-300
                    to-blue-400
                    bg-clip-text
                    text-transparent
                  "
                >
                  {board?.name ?? "Select a board"}
                </h1>

                <Sparkles
                  className="
                    h-5
                    w-5
                    text-cyan-300
                  "
                />
              </div>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-1
                "
              >
                Drag cards across columns. Click any card to edit.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <GlowButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </GlowButton>
        </div>
      </motion.header>

      {/* ========================= */}
      {/* BOARD */}
      {/* ========================= */}

      <KanbanBoard search={q} />

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}

      {creating && <TaskModal createInColumn="todo" onClose={() => setCreating(false)} />}
    </div>
  );
}