/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";

function getLocalQuarter() {
  return (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

export function QuarterlyPlanner({ goal, accent }: { goal: any; accent: string }) {
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const rawStore: any = useStore();
  
  const currentYear = new Date().getFullYear();
  const currentQ = getLocalQuarter();

  const years = useMemo(() => {
    const set = new Set<number>(plans.filter((p: any) => p.goalId?.toString() === goal.id?.toString() || p.goal_id?.toString() === goal.id?.toString()).map((p: any) => p.year));
    set.add(currentYear);
    return [...set].sort((a, b) => a - b);
  }, [plans, goal.id, currentYear]);

  const [year, setYear] = useState(currentYear);
  const [open, setOpen] = useState<1 | 2 | 3 | 4 | null>(currentQ);

  const forQuarter = (q: 1 | 2 | 3 | 4) =>
    plans.find((p: any) => (p.goalId?.toString() === goal.id?.toString() || p.goal_id?.toString() === goal.id?.toString()) && p.year === year && p.quarter === q);

  const displayQ = year === currentYear ? currentQ : 0;

  return (
    <div className="space-y-4 text-white text-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white/90">Perencanaan Triwulan (Quarterly)</h3>
        <div className="flex items-center gap-1.5">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition border cursor-pointer bg-transparent"
              style={{
                color: y === year ? accent : "#a1a1aa",
                borderColor: y === year ? accent : "rgba(255,255,255,0.1)",
                background: y === year ? `${accent}15` : "transparent",
              }}
            >
              {y}
            </button>
          ))}
          <button
            onClick={() => setYear(year + 1)}
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-white bg-transparent cursor-pointer"
            aria-label="Add year"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([1, 2, 3, 4] as const).map((q) => {
          const plan = forQuarter(q);
          const currentAmount = plan ? (plan.current_amount ?? plan.current ?? 0) : 0;
          const targetAmount = plan ? (plan.target_amount ?? plan.target ?? 0) : 0;
          const pct = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;
          const isCurrent = q === displayQ;
          const isOpen = open === q;
          const unitLabel = goal.unit || goal.target_unit || "";
          
          return (
            <button
              key={q}
              onClick={() => setOpen(isOpen ? null : q)}
              className="text-left border bg-white/[0.01] rounded-2xl p-4 relative overflow-hidden transition cursor-pointer"
              style={{ borderColor: isOpen ? accent : isCurrent ? `${accent}60` : "rgba(255,255,255,0.05)" }}
            >
              {isCurrent && (
                <span className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: accent, background: `${accent}20` }}>
                  Now
                </span>
              )}
              <div className="text-[11px] text-muted-foreground font-semibold">Q{q} {year}</div>
              {plan ? (
                <>
                  <div className="mt-2 text-base font-bold" style={{ color: accent }}>{pct}%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{currentAmount} / {targetAmount} {unitLabel}</div>
                  <div className="mt-2 h-1 rounded-full bg-black/40 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} className="h-full rounded-full" style={{ background: accent }} />
                  </div>
                </>
              ) : (
                <div className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1 font-medium"><Plus className="h-3 w-3" /> Set target</div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {open && (
          <QuarterDetail
            key={`${year}-${open}`}
            goal={goal}
            accent={accent}
            year={year}
            quarter={open}
            plan={forQuarter(open)}
            onCreate={(target, current) => rawStore.addQuarterlyPlan?.({ goal_id: goal.id, goalId: goal.id, year, quarter: open, target_amount: target, current_amount: current, target, current })}
            onUpdate={(id, patch) => rawStore.updateQuarterlyPlan?.(id, patch)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuarterDetail({
  goal, accent, year, quarter, plan, onCreate, onUpdate,
}: {
  goal: any;
  accent: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  plan?: any;
  onCreate: (target: number, current: number) => void;
  onUpdate: (id: string, patch: any) => void;
}) {
  const plans = useStore((s: any) => s.quarterlyPlans || []);
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const planId = plan?.id;
  const planTarget = plan ? (plan.target_amount ?? plan.target) : "";
  const planCurrent = plan ? (plan.current_amount ?? plan.current) : "";

  useMemo(() => {
    setTarget(planTarget ? String(planTarget) : "");
    setCurrent(planCurrent ? String(planCurrent) : "");
  }, [planId, planTarget, planCurrent]);

  const currentAmount = Number(current) || 0;
  const targetAmount = Number(target) || 0;
  const pct = plan && targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const unitLabel = goal.unit || goal.target_unit || "";

  const trend = ([1, 2, 3, 4] as const).map((q) => {
    const p = plans.find((x: any) => (x.goalId?.toString() === goal.id?.toString() || x.goal_id?.toString() === goal.id?.toString()) && x.year === year && x.quarter === q);
    const tAmt = p ? (p.target_amount ?? p.target ?? 0) : 0;
    const cAmt = p ? (p.current_amount ?? p.current ?? 0) : 0;
    return tAmt > 0 ? Math.min(100, Math.round((cAmt / tAmt) * 100)) : 0;
  });

  const suggestion =
    !plan ? "Tentukan target triwulan ini untuk mulai memantau kecepatan performa."
      : pct >= 90 ? "Sesuai rencana — pertahankan ritme ini untuk menutup akhir triwulan dengan kuat."
      : pct >= 50 ? `Anda membutuhkan ${remaining} ${unitLabel} lagi untuk mencapai target Q${quarter}.`
      : `Tertinggal dari target. Pecah sisa kekurangan ${remaining} ${unitLabel} menjadi sasaran mingguan kecil.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-white/5 bg-white/[0.01] rounded-2xl p-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Rincian Q{quarter} {year}</div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Target">
              <input value={target} onChange={(e) => setTarget(e.target.value)} type="number"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500/50" />
            </Field>
            <Field label="Aktual">
              <input value={current} onChange={(e) => setCurrent(e.target.value)} type="number"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500/50" />
            </Field>
            <Field label="Sisa">
              <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white/50 font-medium">{remaining} {unitLabel}</div>
            </Field>
          </div>
          <button
            type="button"
            onClick={() => {
              const t = Number(target) || 0;
              const c = Number(current) || 0;
              if (plan) onUpdate(plan.id, { target_amount: t, current_amount: c, target: t, current: c });
              else onCreate(t, c);
            }}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 text-xs font-bold transition shadow-md border-0 cursor-pointer"
          >
            {plan ? "Update Triwulan" : "Buat Rencana Triwulan"}
          </button>
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3">Tren Triwulan</div>
          <div className="flex items-end gap-3 h-24 pt-2">
            {trend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ delay: i * 0.05 }}
                    className="w-full rounded-t-lg"
                    style={{ background: i + 1 === quarter ? accent : "rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div className="text-[9px] text-muted-foreground font-bold">Q{i + 1}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs font-medium">
            <span className="text-[9px] uppercase font-bold tracking-wider text-sky-400 block mb-0.5">Saran AI Coach</span>
            <p className="leading-relaxed text-white/77 italic">"{suggestion}"</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}