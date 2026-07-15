/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2, Clock, Loader2, Circle, Target, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

export function MilestoneTimeline({ goalId, accent }: { goalId: string; accent: string }) {
  const milestones = useStore((s: any) => s.milestones || []);
  const rawStore: any = useStore();
  
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [target, setTarget] = useState("");

  const list = useMemo(
    () => milestones
      .filter((m: any) => m.goalId?.toString() === goalId?.toString() || m.goal_id?.toString() === goalId?.toString())
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    [milestones, goalId],
  );

  const completedCount = list.filter((m: any) => m.completed).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = title.trim();
    if (!finalName) return;
    
    if (rawStore.addMilestone) {
      rawStore.addMilestone({
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
    }
    setTitle(""); setDue(""); setTarget(""); setAdding(false);
  };

  return (
    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 text-white text-xs backdrop-blur-md relative overflow-hidden">
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white/95 flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: accent }} /> Target Lini Masa Tahapan
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Progress penyelesaian: <span className="font-semibold text-white">{completedCount} dari {list.length}</span> tahapan terselesaikan.
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 transition cursor-pointer font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Tahapan
        </button>
      </div>

      {/* Form Input Expandable */}
      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={submit}
            className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 bg-white/[0.02] border border-white/10 p-4 rounded-xl shadow-inner"
          >
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: 50 Workouts Tercapai..."
              className="rounded-lg bg-black/40 border border-white/5 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-white/20 transition"
            />
            <input
              type="date" value={due} onChange={(e) => setDue(e.target.value)}
              className="rounded-lg bg-black/40 border border-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition text-white/60"
            />
            <input
              type="number" value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder="Target Angka"
              className="w-full sm:w-28 rounded-lg bg-black/40 border border-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition"
            />
            <button className="rounded-lg text-black font-bold px-4 py-2 text-xs transition shadow-md cursor-pointer border-0" style={{ background: accent }}>
              Simpan
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tampilan List Milestone */}
      {list.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-white/5 rounded-xl bg-black/10">
          <Target className="h-6 w-6 mx-auto mb-2 text-white/20" />
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">Belum ada rincian tahapan milestone. Pecah target besar ini menjadi beberapa langkah kecil.</p>
        </div>
      ) : (
        <div className="relative pl-1">
          {/* Garis Latar Lini Masa */}
          <div className="absolute left-[15px] top-3 bottom-3 w-[1.5px] bg-white/10 pointer-events-none" />

          <ol className="space-y-4 list-none p-0 m-0">
            {list.map((m: any) => {
              const timestampDue = m.due_date ? new Date(m.due_date).getTime() : (m.dueAt || null);
              const overdue = !m.completed && timestampDue && timestampDue < Date.now();
              const finalTitle = m.name || m.title || "Tahapan Milestone";
              const finalTarget = m.target_value !== undefined ? m.target_value : m.targetValue;

              return (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative pl-10 group"
                >
                  {/* Lingkaran Interaktif / Status Centang */}
                  <button
                    type="button"
                    onClick={() => rawStore.toggleMilestone?.(m.id)}
                    className="absolute left-1 top-0.5 h-6 w-6 grid place-items-center rounded-full border transition-all duration-200 cursor-pointer p-0 shadow-sm z-10"
                    style={{
                      borderColor: m.completed ? accent : "rgba(255,255,255,0.15)",
                      background: m.completed ? accent : "rgba(20,20,20,0.8)",
                      color: m.completed ? "#000000" : "rgba(255,255,255,0.3)",
                      boxShadow: m.completed ? `0 0 12px ${accent}40` : "none"
                    }}
                    aria-label="Toggle status tahapan"
                  >
                    {m.completed ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <Circle className="h-2 w-2 fill-current opacity-40 transition-transform group-hover:scale-125" />
                    )}
                  </button>

                  {/* Kartu Detail Konten Milestone */}
                  <div className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all duration-200 ${
                    m.completed 
                      ? "bg-white/[0.01] border-white/5 opacity-50" 
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                  }`}>
                    <div className="min-w-0 space-y-1">
                      <div className={`text-xs font-semibold tracking-wide transition-all ${
                        m.completed ? "line-through text-white/40" : "text-white/90"
                      }`}>
                        {finalTitle}
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                        {finalTarget !== undefined && finalTarget > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-white/70">
                            Target: {finalTarget}
                          </span>
                        )}
                        {timestampDue && (
                          <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-400 font-bold" : "text-white/40"}`}>
                            <Clock className="h-3 w-3" />
                            {new Date(timestampDue).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => rawStore.removeMilestone?.(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition shrink-0 bg-transparent border-0 cursor-pointer p-1"
                      aria-label="Hapus tahapan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}