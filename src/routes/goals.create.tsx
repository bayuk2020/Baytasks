/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Target } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/goals/create")({
  head: () => ({
    meta: [
      { title: "Create Goal — BayTasks" },
      { name: "description", content: "Define a new goal with life area, type, target and deadline." },
    ],
  }),
  component: CreateGoal,
});

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },
  career: { label: "Career", emoji: "🚀", color: "#6366f1" },
  health: { label: "Health", emoji: "💪", color: "#ef4444" },
  relationship: { label: "Relationship", emoji: "❤️", color: "#ec4899" },
  learning: { label: "Learning", emoji: "📚", color: "#eab308" },
  spiritual: { label: "Spiritual", emoji: "🧘", color: "#a855f7" },
  business: { label: "Business", emoji: "📈", color: "#3b82f6" },
};

const GOAL_TYPE_META_LOCAL: Record<string, { label: string; hint: string }> = {
  manual: { label: "Manual", hint: "You update progress yourself." },
  task: { label: "Task Based", hint: "Progress from completed linked tasks." },
  habit: { label: "Habit Based", hint: "Progress from linked habit completions." },
  finance: { label: "Finance Based", hint: "Progress from account balance." },
  debt: { label: "Debt Based", hint: "Progress from remaining debt (lower is better)." },
  hybrid: { label: "Hybrid", hint: "Combine multiple sources." },
};

const AREAS = Object.keys(LIFE_AREA_META_LOCAL);
const TYPES = Object.keys(GOAL_TYPE_META_LOCAL);

const PRIORITIES = [
  { value: "low", label: "Low", activeClass: "border-emerald-500 bg-emerald-950/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" },
  { value: "med", label: "Medium", activeClass: "border-amber-500 bg-amber-950/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" },
  { value: "high", label: "High", activeClass: "border-rose-500 bg-rose-950/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]" }
] as const;

function CreateGoal() {
  const { addGoal } = useStore() as any;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lifeArea, setLifeArea] = useState<string>("career");
  const [type, setType] = useState<string>("manual");
  const [startValue, setStartValue] = useState("0");
  const [targetValue, setTargetValue] = useState("100");
  const [currentValue, setCurrentValue] = useState("0");
  const [unit, setUnit] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<string>("med");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = name.trim();
    if (!finalTitle) return;
    
    if (addGoal) {
      const areaMapping: Record<string, number> = {
        finance: 1, career: 2, health: 3, relationship: 4, learning: 5, spiritual: 6, business: 7
      };

      const calculatedAreaId = areaMapping[lifeArea] || 2;

      try {
        const generatedId = await addGoal({
          title: finalTitle,
          description: description.trim() || null,
          area_id: calculatedAreaId,
          target_amount: Number(targetValue) || 100,
          current_amount: Number(currentValue) || 0,
          due_date: targetDate ? new Date(targetDate).toISOString().split('T')[0] : null,
          progress_percent: 0,

          name: finalTitle,
          lifeArea,
          type,
          startValue: Number(startValue) || 0,
          currentValue: Number(currentValue) || 0,
          targetValue: Number(targetValue) || 100,
          unit: unit.trim(),
          invert: type === "debt",
          targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
          priority,
          status: "active",
          notes: notes.trim(),
          links: []
        });

        if (generatedId) {
          router.navigate({ 
            to: "/goals/$id", 
            params: { id: generatedId.toString() } 
          });
        } else {
          router.navigate({ to: "/goals" });
        }
      } catch (error) {
        console.error("Gagal membuat sasaran target baru:", error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative text-white text-xs">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <Link to="/goals" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition relative">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header className="relative">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <Target className="h-4 w-4 text-sky-400" /> New goal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          Design your next <span className="neon-text">milestone</span>
        </h1>
      </header>

      <form onSubmit={submit} className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 space-y-5 relative">
        <Field label="Goal name" required>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Become debt free"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50" />
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does success look like?"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50 resize-none" />
        </Field>

        <Field label="Life area">
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map((a) => {
              const meta = LIFE_AREA_META_LOCAL[a];
              const active = lifeArea === a;
              return (
                <button type="button" key={a} onClick={() => setLifeArea(a)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition border inline-flex items-center gap-1.5 bg-transparent cursor-pointer"
                  style={{
                    color: active ? meta.color : "#a1a1aa",
                    borderColor: active ? meta.color : "rgba(255,255,255,0.1)",
                    background: active ? `${meta.color}15` : "transparent"
                  }}>
                  <span>{meta.emoji}</span>{meta.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Goal type">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TYPES.map((t) => {
              const meta = GOAL_TYPE_META_LOCAL[t];
              const active = type === t;
              return (
                <button type="button" key={t} onClick={() => setType(t)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition cursor-pointer bg-transparent ${
                    active ? "border-sky-500 bg-sky-950/20 neon-ring" : "border-white/10 hover:border-white/20"
                  }`}>
                  <div className={`text-xs font-bold ${active ? "text-sky-400" : "text-white"}`}>{meta.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{meta.hint}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Start"><NumInput value={startValue} onChange={setStartValue} /></Field>
          <Field label="Current"><NumInput value={currentValue} onChange={setCurrentValue} /></Field>
          <Field label="Target"><NumInput value={targetValue} onChange={setTargetValue} /></Field>
          <Field label="Unit">
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="M, books…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Target date">
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500/50" />
          </Field>
          <Field label="Priority">
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => {
                const isCurrent = priority === p.value;
                return (
                  <button type="button" key={p.value} onClick={() => setPriority(p.value)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition border cursor-pointer bg-transparent ${
                      isCurrent 
                        ? p.activeClass 
                        : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes…"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50 resize-none" />
        </Field>

        <div className="flex items-center gap-2 pt-1">
<button type="submit" className="px-5 py-2.5 rounded-lg border border-sky-500/50 bg-sky-950/20 text-sky-400 text-xs font-bold shadow-[0_0_10px_rgba(14,165,233,0.15)] hover:bg-sky-500 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer">
  Create goal
</button>
          <Link to="/goals" className="px-4 py-2.5 rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition font-semibold">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}{required && <span className="text-sky-400"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500/50" />
  );
}