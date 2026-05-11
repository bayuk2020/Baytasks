import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useStore } from "@/lib/store";
import { useSearch } from "@/components/AppShell";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskModal } from "@/components/TaskModal";

export const Route = createFileRoute("/_app/board")({
  head: () => ({ meta: [{ title: "Board — BayTasks" }] }),
  component: BoardPage,
});

function BoardPage() {
  const { boards, activeBoardId } = useStore();
  const board = boards.find((b) => b.id === activeBoardId);
  const { q } = useSearch();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{board?.emoji}</span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{board?.name ?? "Select a board"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Drag cards across columns. Click any card to edit.</p>
          </div>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--gradient-neon)] text-primary-foreground text-sm font-medium neon-ring hover:scale-[1.02] transition">
          <Plus className="h-4 w-4" /> New task
        </button>
      </header>

      <KanbanBoard search={q} />
      {creating && <TaskModal createInColumn="todo" onClose={() => setCreating(false)} />}
    </div>
  );
}
