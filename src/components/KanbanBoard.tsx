/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import { taskApi } from "@/lib/api";
import { COLUMNS, ColumnId, useStore, Task } from "@/lib/store";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";

import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import { useDroppable } from "@dnd-kit/core";

import { TaskCard } from "./TaskCard";

import { Plus } from "lucide-react";

import { motion } from "framer-motion";

import { boardApi } from "@/lib/api";

import { TaskModal } from "./TaskModal";

function Column({
  id,
  title,
  tasks,
  onOpen,
  onAdd,
}: {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onOpen: (id: string) => void;
  onAdd: (col: ColumnId) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${id}`,
  });

  return (
    <div className="w-[300px] shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</span>

          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAdd(id)}
          className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-2 min-h-[120px] transition-colors ${
          isOver
            ? "bg-[var(--neon-soft)] ring-1 ring-[var(--neon)]/40"
            : "bg-card/40 border border-border"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} onOpen={onOpen} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ search = "" }: { search?: string }) {
  const { tasks, activeBoardId, moveTask, reorderInColumn, loadTasks } = useStore();

  // =========================
  // LOAD TASKS
  // =========================

  useEffect(() => {
    loadTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);

  const [createCol, setCreateCol] = useState<ColumnId | null>(null);

  // =========================
  // FILTER
  // =========================

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks

      .filter((t) => t.boardId === activeBoardId)

      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
  }, [tasks, activeBoardId, search]);

  // =========================
  // GROUPED
  // =========================

  const grouped = useMemo(() => {
    const m: Record<ColumnId, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    for (const t of filtered) {
      m[t.column].push(t);
    }

    for (const k of Object.keys(m) as ColumnId[]) {
      m[k].sort((a, b) => a.order - b.order);
    }

    return m;
  }, [filtered]);

  // =========================
  // DRAG START
  // =========================

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  // =========================
  // DRAG END
  // =========================

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = e;

    if (!over) return;

    const activeIdStr = String(active.id);

    const overIdStr = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeIdStr);

    if (!activeTask) return;

    let targetCol: ColumnId;

    if (overIdStr.startsWith("col:")) {
      targetCol = overIdStr.slice(4) as ColumnId;
    } else {
      const overTask = tasks.find((t) => t.id === overIdStr);

      if (!overTask) return;

      targetCol = overTask.column;
    }

    // =========================
    // MOVE DIFFERENT COLUMN
    // =========================

    if (activeTask.column !== targetCol) {
      const newOrder = grouped[targetCol].length;

      await moveTask(
        activeTask.id,

        targetCol,

        newOrder,

        targetCol === "done" ? Date.now() : undefined,
      );
      // =========================
      // SOUND EFFECT
      // =========================

      new Audio("https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3").play();

      await loadTasks();

      return;
    }

    // =========================
    // SAME COLUMN
    // =========================

    const ids = grouped[targetCol].map((t) => t.id);

    const oldIdx = ids.indexOf(activeIdStr);

    const newIdx = overIdStr.startsWith("col:") ? ids.length - 1 : ids.indexOf(overIdStr);

    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

    const next = arrayMove(ids, oldIdx, newIdx);

    reorderInColumn(activeBoardId, targetCol, next);

    try {
      await taskApi.reorder(
        next.map((id, index) => ({
          id,
          position: index,
        })),
      );

      await loadTasks();
    } catch (err) {
      console.error("REORDER ERROR", err);
    }
  };

  const dragging = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex gap-4 overflow-x-auto pb-6 px-1"
        >
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              id={c.id}
              title={c.title}
              tasks={grouped[c.id]}
              onOpen={setOpenId}
              onAdd={setCreateCol}
            />
          ))}
        </motion.div>

        <DragOverlay>{dragging && <TaskCard task={dragging} onOpen={() => {}} />}</DragOverlay>
      </DndContext>

      {(openId || createCol) && (
        <TaskModal
          taskId={openId ?? undefined}
          createInColumn={createCol ?? undefined}
          onClose={() => {
            setOpenId(null);

            setCreateCol(null);
          }}
        />
      )}
    </>
  );
}
