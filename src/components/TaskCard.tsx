import { Task, Priority } from "@/lib/store";
import { Calendar, MessageSquare, Paperclip, ListChecks } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

const priorityClass: Record<Priority, string> = {
  low: "bg-[color-mix(in_oklab,var(--priority-low)_18%,transparent)] text-[var(--priority-low)] border-[color-mix(in_oklab,var(--priority-low)_35%,transparent)]",
  med: "bg-[color-mix(in_oklab,var(--priority-med)_18%,transparent)] text-[var(--priority-med)] border-[color-mix(in_oklab,var(--priority-med)_35%,transparent)]",
  high: "bg-[color-mix(in_oklab,var(--priority-high)_18%,transparent)] text-[var(--priority-high)] border-[color-mix(in_oklab,var(--priority-high)_35%,transparent)]",
  urgent: "bg-[color-mix(in_oklab,var(--priority-urgent)_22%,transparent)] text-[var(--priority-urgent)] border-[color-mix(in_oklab,var(--priority-urgent)_45%,transparent)]",
};

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const done = task.subtasks.filter((s) => s.done).length;
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const overdue = due && due.getTime() < Date.now() && task.column !== "done";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      onClick={() => onOpen(task.id)}
      className="group cursor-grab active:cursor-grabbing rounded-xl glass hover-lift p-3 select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug text-foreground/95">{task.title}</h4>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${priorityClass[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {due && (
          <span className={`inline-flex items-center gap-1 ${overdue ? "text-[var(--priority-urgent)]" : ""}`}>
            <Calendar className="h-3 w-3" />
            {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> {done}/{task.subtasks.length}
          </span>
        )}
        {task.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" /> {task.attachments.length}
          </span>
        )}
        {task.notes && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
          </span>
        )}
      </div>
    </motion.div>
  );
}
