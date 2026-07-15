/* eslint-disable prettier/prettier */
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Link2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";

const TYPES: { id: string; label: string }[] = [
  { id: "task", label: "Task" },
  { id: "habit", label: "Habit" },
  { id: "book", label: "Book" },
  { id: "debt", label: "Debt" },
  { id: "account", label: "Account" },
  { id: "transaction", label: "Transaction" },
];

export function LinkResourceModal({ goal, onClose }: { goal: any; onClose: () => void }) {
  const tasks = useStore((s: any) => s.tasks || []);
  const habits = useStore((s: any) => s.habits || []);
  const books = useStore((s: any) => s.books || []);
  const rawStore: any = useStore();
  
  const [type, setType] = useState<string>("task");
  const [manualLabel, setManualLabel] = useState("");

  const goalLinks = goal.links || [];
  const linked = new Set(goalLinks.map((l: any) => `${l.type}:${l.refId || l.ref_id}`));

  const pick = (refId: string, label: string) => {
    if (linked.has(`${type}:${refId}`)) return;
    if (rawStore.addGoalLink) {
      rawStore.addGoalLink(goal.id, { type, refId, label });
    }
  };

  const options: { id: string; label: string }[] =
    type === "task" ? tasks.map((t: any) => ({ id: t.id, label: t.title }))
      : type === "habit" ? habits.filter((h: any) => !h.archived).map((h: any) => ({ id: h.id, label: `${h.emoji || "🔥"} ${h.title}` }))
      : type === "book" ? books.map((b: any) => ({ id: b.id, label: b.title }))
      : [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 text-white text-xs"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
        className="border border-white/10 bg-[#121214] rounded-2xl w-full max-w-lg p-5 relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm inline-flex items-center gap-2"><Link2 className="h-4 w-4 text-sky-400" /> Link a resource</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white bg-transparent border-0 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border cursor-pointer bg-transparent ${
                type === t.id ? "border-sky-500 text-sky-400 bg-sky-500/10" : "border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {options.length > 0 ? (
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {options.map((o) => {
              const isLinked = linked.has(`${type}:${o.id}`);
              return (
                <button
                  node-type="button"
                  key={o.id}
                  onClick={() => pick(o.id, o.label)}
                  disabled={isLinked}
                  className={`w-full text-left flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs transition cursor-pointer ${
                    isLinked ? "border-sky-500/40 bg-sky-500/5 text-muted-foreground cursor-not-allowed" : "border-white/5 bg-white/5 hover:border-sky-500/50"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {isLinked ? <span className="text-[10px] text-sky-400 font-bold">Linked</span> : <Plus className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualLabel.trim()) return;
              if (rawStore.addGoalLink) {
                rawStore.addGoalLink(goal.id, { type, refId: manualLabel.trim().toLowerCase().replace(/\s+/g, "-"), label: manualLabel.trim() });
              }
              setManualLabel("");
            }}
            className="space-y-2"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Reference a {type} by name (Finance/Debt modules connect here when enabled).
            </p>
            <div className="flex gap-2">
              <input
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder={`e.g. ${type === "debt" ? "Car loan" : type === "account" ? "Main savings" : "Reference name"}`}
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500/50"
              />
              <button className="rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 font-bold transition shadow-md border-0 cursor-pointer">Link</button>
            </div>
          </form>
        )}

        <button onClick={onClose} className="mt-4 w-full rounded-lg border border-white/10 bg-transparent py-2 text-xs text-white hover:bg-white/5 transition cursor-pointer font-semibold">Done</button>
      </motion.div>
    </motion.div>
  );
}