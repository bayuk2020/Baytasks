/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Trash2, CheckCircle2, Minus, Plus, Link2, X,
  Target, CalendarClock, Flag, Activity as ActivityIcon, Edit3
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ProgressRing } from "@/components/goals/ProgressRing";
import { AICoach } from "@/components/goals/AICoach";
import { MilestoneTimeline } from "@/components/goals/MilestoneTimeline";
import { QuarterlyPlanner } from "@/components/goals/QuarterlyPlanner";
import { GoalAnalytics } from "@/components/goals/GoalAnalytics";
import { LinkResourceModal } from "@/components/goals/LinkResourceModal";
import { generateInsights, formatValue, daysRemaining, computeGoalProgress } from "@/lib/goals/goals";

export const Route = createFileRoute("/goals/$id")({
  head: () => ({ meta: [{ title: "Goal — BayTasks" }, { name: "description", content: "Goal overview, milestones, quarterly plans, analytics and activity." }] }),
  component: GoalDetail,
  errorComponent: ({ error }) => <Fallback message={error.message} />,
  notFoundComponent: () => <Fallback message="Goal not found." />,
});

const TABS = ["Overview", "Milestones", "Quarterly", "Analytics", "Activity"] as const;
type Tab = (typeof TABS)[number];

const LINK_EMOJI: Record<string, string> = {
  task: "✅", habit: "🔥", book: "📚", debt: "💳", account: "🏦", transaction: "💸",
};

const LIFE_AREA_META_LOCAL: Record<string, { label: string; emoji: string; color: string }> = {
  finance: { label: "Finance", emoji: "💰", color: "#10b981" },      
  career: { label: "Career", emoji: "🚀", color: "#0ea5e9" },       
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
  debt: { label: "Debt Based", hint: "Progress from remaining debt." },
  hybrid: { label: "Hybrid", hint: "Combine multiple sources." },
};

const AREAS = Object.keys(LIFE_AREA_META_LOCAL);
const TYPES = Object.keys(GOAL_TYPE_META_LOCAL);

const PRIORITIES = [
  { value: "low", label: "Low", activeClass: "border-emerald-500 bg-emerald-950/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" },
  { value: "med", label: "Medium", activeClass: "border-amber-500 bg-amber-950/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" },
  { value: "high", label: "High", activeClass: "border-rose-500 bg-rose-950/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]" }
] as const;

function GoalDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  
  const goals = useStore((s: any) => s.goals || []);
  const tasks = useStore((s: any) => s.tasks || []);
  const habitLogs = useStore((s: any) => s.habitLogs || []);
  const milestones = useStore((s: any) => s.milestones || []);
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const activity = useStore((s: any) => s.goalActivity || []);
  const rawStore: any = useStore();

  useEffect(() => {
    const store = useStore.getState();
    if (store.loadGoals) store.loadGoals();
    if (store.loadBooks) store.loadBooks();
    if (store.loadTasks) store.loadTasks();
    if (store.loadHabits) store.loadHabits();
    if (store.loadBoards) store.loadBoards();
  }, [id]);

  const [tab, setTab] = useState<Tab>("Overview");
  const [linking, setLinking] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State Modal Form Edit
  const [valueInput, setValueInput] = useState("");
  const [saved, setSaved] = useState(false);

  // States Form Edit (Mengambil fallback nilai awal dari goal)
  const goal = goals.find((g: any) => g.id?.toString() === id?.toString()) as any;
  const ctx = { tasks, habitLogs, milestones, habits: rawStore.habits || [] };

  // Setup Form Hooks State Lokal pas Modal Edit dibuka
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editArea, setEditArea] = useState("career");
  const [editType, setEditType] = useState("manual");
  const [editStart, setEditStart] = useState("0");
  const [editTarget, setEditTarget] = useState("100");
  const [editCurrent, setEditCurrent] = useState("0");
  const [editUnit, setEditUnit] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPriority, setEditPriority] = useState("med");
  const [editNotes, setEditNotes] = useState("");

  if (!goal) return <Fallback message="Goal not found." />;

  const calculatedProgress = computeGoalProgress(goal, ctx);
  const pct = calculatedProgress.pct;
  const current = calculatedProgress.current;
  const target = calculatedProgress.target;

  const areaKey = (goal.lifeArea || goal.area?.name || "career").toLowerCase();
  const area = LIFE_AREA_META_LOCAL[areaKey] || LIFE_AREA_META_LOCAL["career"];
  const dRem = daysRemaining(goal);
  const insights = generateInsights(goal, { ...ctx, milestones, plans });

  const goalActivity = useMemo(() => {
    const rawLogs = goal.reviews || goal.activities || [];
    return [...rawLogs].sort((a: any, b: any) => new Date(b.created_at || b.ts).getTime() - new Date(a.created_at || a.ts).getTime()).slice(0, 40);
  }, [goal.reviews, goal.activities]);

  const valueDriven = goal.type !== "task" && goal.type !== "habit";
  const totalMilestones = milestones.filter((m: any) => m.goalId?.toString() === id?.toString() || m.goal_id?.toString() === id?.toString());
  const completedMilestones = totalMilestones.filter((m: any) => m.completed);

  const openEditModal = () => {
    setEditName(goal.title || goal.name || "");
    setEditDesc(goal.description || "");
    setEditArea((goal.lifeArea || "career").toLowerCase());
    setEditType(goal.type || "manual");
    setEditStart(String(goal.startValue || 0));
    setEditTarget(String(goal.targetValue || goal.target_amount || 100));
    setEditCurrent(String(goal.currentValue || goal.current_amount || 0));
    setEditUnit(goal.unit || "");
    setEditDate(goal.due_date || (goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ""));
    setEditPriority(goal.priority || "med");
    setEditNotes(goal.notes || "");
    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !rawStore.updateGoal) return;

    const areaMapping: Record<string, number> = {
      finance: 1, career: 2, health: 3, relationship: 4, learning: 5, spiritual: 6, business: 7
    };

    await rawStore.updateGoal(id, {
      title: editName.trim(),
      name: editName.trim(),
      description: editDesc.trim() || null,
      area_id: areaMapping[editArea] || 2,
      lifeArea: editArea,
      type: editType,
      target_amount: Number(editTarget) || 100,
      current_amount: Number(editCurrent) || 0,
      startValue: Number(editStart) || 0,
      currentValue: Number(editCurrent) || 0,
      targetValue: Number(editTarget) || 100,
      unit: editUnit.trim(),
      due_date: editDate || null,
      targetDate: editDate ? new Date(editDate).getTime() : undefined,
      priority: editPriority,
      notes: editNotes.trim(),
    });

    setIsEditing(false);
    flash();
  };

  const flash = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1200); };
  
  const nudge = (delta: number) => { 
    if (rawStore.updateGoal) {
      rawStore.updateGoal(id, { current_amount: current + delta, currentValue: current + delta }); 
      flash(); 
    }
  };

  const commit = () => {
    const n = Number(valueInput);
    if (!isNaN(n) && valueInput !== "" && rawStore.updateGoal) { 
      rawStore.updateGoal(id, { current_amount: n, currentValue: n }); 
      flash(); 
    }
    setValueInput("");
  };

  return (
    <div className="space-y-6 relative text-white text-xs">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full blur-3xl opacity-15" style={{ background: area.color }} />

      <div className="flex items-center justify-between relative gap-3 border-b border-white/5 pb-4">
        <Link to="/goals" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Goals
        </Link>
        <div className="flex items-center gap-2">
          {/* 🌟 FORM EDIT BUTTON DITANGKAP DISINI */}
          <button onClick={openEditModal} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer font-semibold text-sky-400">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
          {goal.status !== "completed" && (
            <button onClick={() => rawStore.setGoalStatus?.(id, "completed")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: area.color }} /> Complete
            </button>
          )}
          <button onClick={() => { if (rawStore.removeGoal) { rawStore.removeGoal(id); router.navigate({ to: "/goals" }); } }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/50 hover:text-red-400 transition cursor-pointer font-semibold">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 relative overflow-hidden" style={{ boxShadow: `0 0 40px ${area.color}05` }}>
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl opacity-25" style={{ background: area.color }} />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <ProgressRing 
            value={pct} 
            color={area.color} 
            size={120} 
            stroke={9}
            sub={<span className="text-[9px] text-muted-foreground font-medium">{formatValue(goal, current)} / {formatValue(goal, target)}</span>} 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl leading-none">{area.emoji}</span>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: area.color, borderColor: `${area.color}40`, background: `${area.color}15` }}>
                {goal.status === "completed" || pct === 100 ? "Completed" : "Active"}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium border border-white/10 text-white/60">{area.label}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-2">{goal.title || goal.name}</h1>
            {goal.description && <p className="text-xs text-muted-foreground italic mt-1.5">"{goal.description}"</p>}
            <div className="mt-4 flex items-center gap-4 text-white/50 font-medium">
              <span className="inline-flex items-center gap-1.5"><Target className="h-4 w-4" style={{ color: area.color }} /> {area.label}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />
                {goal.targetDate || goal.due_date ? new Date(goal.targetDate || goal.due_date).toLocaleDateString("id-ID", { month: "long", day: "numeric", year: "numeric" }) : "No deadline"}
                {dRem !== null && goal.status !== "completed" && (
                  <span className={dRem < 0 ? "text-red-400 font-bold" : "text-muted-foreground"}>· {dRem < 0 ? `${Math.abs(dRem)}d overdue` : `${dRem}d left`}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-white/5 relative overflow-x-auto select-none font-medium">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2.5 transition-all relative bg-transparent border-0 cursor-pointer ${tab === t ? "font-semibold" : "text-white/40 hover:text-white/80"}`} style={{ color: tab === t ? area.color : undefined }}>
            {t}
            {tab === t && <motion.div layoutId="goal-tab" className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full" style={{ background: area.color }} />}
          </button>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {tab === "Overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  {valueDriven && goal.status !== "completed" && (
                    <div className="border border-white/5 bg-white/[0.01] rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white/90">Pembaruan Progres Capaian</h3>
                        <AnimatePresence>{saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</motion.span>}</AnimatePresence>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => nudge(-1)} className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition cursor-pointer"><Minus className="h-4 w-4" /></button>
                        <button onClick={() => nudge(1)} className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition cursor-pointer"><Plus className="h-4 w-4" /></button>
                        <input value={valueInput} onChange={(e) => setValueInput(e.target.value)} type="number" placeholder={`Current (${current})`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none" />
                        <button onClick={commit} className="px-4 py-1.5 text-black rounded-lg font-semibold transition shadow-md border-0 cursor-pointer" style={{ background: area.color }}>Set</button>
                      </div>
                    </div>
                  )}

                  <div className="border border-white/5 bg-white/[0.01] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white/90 inline-flex items-center gap-2"><Link2 className="h-4 w-4" style={{ color: area.color }} /> Linked resources</h3>
                      <button onClick={() => setLinking(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-white hover:bg-white/10 transition cursor-pointer font-semibold border-0">
                        <Plus className="h-3.5 w-3.5" /> Link
                      </button>
                    </div>
                    {(!goal.links || goal.links.length === 0) ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No linked resources. Connect tasks, habits, debts or accounts to auto-calculate progress.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {goal.links.map((l: any) => (
                          <div key={l.id} className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span>{LINK_EMOJI[l.type] || "🔗"}</span>
                              <div className="min-w-0">
                                <div className="font-semibold truncate text-white">{l.label}</div>
                                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{l.type}</div>
                              </div>
                            </div>
                            <button onClick={() => rawStore.removeGoalLink?.(goal.id, l.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition bg-transparent border-0 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {goal.notes && (
                    <div className="border border-white/5 bg-white/[0.01] rounded-xl p-5 space-y-2">
                      <h3 className="font-semibold text-white/90">Notes</h3>
                      <p className="text-white/70 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5 whitespace-pre-wrap">{goal.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <AICoach insights={insights} />
                  <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                    <h3 className="font-semibold mb-3">Snapshot</h3>
                    <div className="space-y-2.5 text-xs font-medium">
                      <Row label="Progress" value={<span style={{ color: area.color }}>{pct}%</span>} />
                      <Row label="Current" value={formatValue(goal, current)} />
                      <Row label="Target" value={formatValue(goal, target)} />
                      <Row label="Milestones" value={`${completedMilestones.length}/${totalMilestones.length}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "Milestones" && <MilestoneTimeline goalId={id} accent={area.color} />}
            {tab === "Quarterly" && <QuarterlyPlanner goal={goal} accent={area.color} />}
            {tab === "Analytics" && <GoalAnalytics goal={goal} accent={area.color} />}
            {tab === "Activity" && (
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                <h3 className="font-semibold mb-4 inline-flex items-center gap-2"><ActivityIcon className="h-4 w-4" style={{ color: area.color }} /> Activity Log</h3>
                {goalActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No activity yet.</p>
                ) : (
                  <ol className="relative ml-2 border-l border-l-white/5 pl-4 space-y-4">
                    {goalActivity.map((a: any) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full" style={{ background: area.color }} />
                        <div className="text-white/80">{a.text || a.description || "Aktivitas diperbarui"}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(a.created_at || a.ts || Date.now()).toLocaleString("id-ID", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🌟 OVERLAY ANCHOR MODAL POPUP FORM EDIT TARGET */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl border border-white/10 bg-[#0c0f17] rounded-2xl p-6 space-y-5 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-bold inline-flex items-center gap-2"><Edit3 className="h-4 w-4 text-sky-400" /> Edit Target Milestone</h2>
                <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-white bg-transparent border-0 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <Field label="Goal name" required>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Become debt free"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50" />
                </Field>

                <Field label="Description">
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} placeholder="What does success look like?"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50 resize-none" />
                </Field>

                <Field label="Life area">
                  <div className="flex flex-wrap gap-1.5">
                    {AREAS.map((a) => {
                      const meta = LIFE_AREA_META_LOCAL[a];
                      const active = editArea === a;
                      return (
                        <button type="button" key={a} onClick={() => setEditArea(a)}
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
                      const active = editType === t;
                      return (
                        <button type="button" key={t} onClick={() => setEditType(t)}
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
                  <Field label="Start"><NumInput value={editStart} onChange={setEditStart} /></Field>
                  <Field label="Current"><NumInput value={editCurrent} onChange={setEditCurrent} /></Field>
                  <Field label="Target"><NumInput value={editTarget} onChange={setEditTarget} /></Field>
                  <Field label="Unit">
                    <input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="M, books…"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Target date">
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500/50" />
                  </Field>
                  <Field label="Priority">
                    <div className="flex gap-1.5">
                      {PRIORITIES.map((p) => {
                        const isCurrent = editPriority === p.value;
                        return (
                          <button type="button" key={p.value} onClick={() => setEditPriority(p.value)}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition border cursor-pointer bg-transparent ${
                              isCurrent ? p.activeClass : "border-white/10 text-muted-foreground hover:border-white/20"
                            }`}>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                <Field label="Notes">
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} placeholder="Optional notes…"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/50 resize-none" />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-lg border border-sky-500/50 bg-sky-950/20 text-sky-400 text-xs font-bold shadow-[0_0_10px_rgba(14,165,233,0.15)] hover:bg-sky-500 hover:text-white transition-all duration-200 cursor-pointer">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{linking && <LinkResourceModal goal={goal} onClose={() => setLinking(false)} />}</AnimatePresence>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-left">
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-white/50">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function Fallback({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center max-w-sm mx-auto space-y-4 text-xs text-muted-foreground">
      <Flag className="h-6 w-6 text-sky-400 mx-auto opacity-70" />
      <p>{message}</p>
      <Link to="/goals" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 text-white font-semibold shadow-md">
        <ArrowLeft className="h-4 w-4" /> Back to goals
      </Link>
    </div>
  );
}