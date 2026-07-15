/* eslint-disable prettier/prettier */
import { useStore } from "../store";

// =========================================================
// INTERFACE MODEL LOKAL UNTUK KOMPONEN UI MODUL GOALS
// =========================================================
export interface LifeAreaStructure {
  id: number;
  name: string;
}

export interface Milestone {
  id: string; // Selaraskan menjadi string sesuai store pusat
  goal_id: string; // Selaraskan menjadi string
  name: string;
  target_value: number;
  current_value: number;
  due_date: string | null;
  weight: number;
  completed: boolean;
}

export interface Goal {
  id: string; // Selaraskan menjadi string sesuai store pusat
  user_id: number;
  area_id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  due_date: string | null;
  completed: boolean;
  progress_percent: number;
  area?: LifeAreaStructure;
  milestones?: Milestone[];
}

type BaseLifeAreaType = "finance" | "career" | "health" | "relationship" | "learning" | "spiritual" | "business";

const parseLifeArea = (area: BaseLifeAreaType): LifeAreaStructure => {
  const labels: Record<BaseLifeAreaType, string> = {
    finance: "Finance",
    career: "Career",
    health: "Health",
    relationship: "Relationship",
    learning: "Learning",
    spiritual: "Spiritual",
    business: "Business"
  };
  
  const ids: Record<BaseLifeAreaType, number> = {
    finance: 1, career: 2, health: 3, relationship: 4, learning: 5, spiritual: 6, business: 7
  };

  return {
    id: ids[area] || 99,
    name: labels[area] || "General"
  };
};

// =========================================================
// CUSTOM HOOKS ADAPTER - USEGOALSSTORE
// =========================================================
export const useGoalsStore = () => {
  // 1. Ambil data state menggunakan selektor typed 'any' untuk mengantisipasi bentrok tipe data kompilasi
  const baseGoals = useStore((s: any) => s.goals || []);
  const baseMilestones = useStore((s: any) => s.milestones || []);
  const baseTasks = useStore((s: any) => s.tasks || []);
  const baseHabitLogs = useStore((s: any) => s.habitLogs || []);
  
  // 2. Sesuaikan pemanggilan properti mutasi agar PAS dengan interface State (Gunakan CamelCase yang benar)
  const triggerAddGoal = useStore((s: any) => s.addGoal);
  const triggerToggleMilestone = useStore((s: any) => s.toggleMilestone);

  // Transformasi data reaktif tanpa merusak kestabilan referensi 
  const formattedGoals: Goal[] = baseGoals.map((g: any) => {
    const cleanGoalId = g.id.toString();

    const filteredMilestones: Milestone[] = baseMilestones
      .filter((m: any) => m.goalId?.toString() === cleanGoalId)
      .map((m: any, index: number) => {
        let mDate: string | null = null;
        if (m.dueAt) {
          try {
            mDate = new Date(m.dueAt).toISOString().split('T')[0];
          } catch(e) { mDate = null; }
        }
        return {
          id: m.id.toString(),
          goal_id: cleanGoalId,
          name: m.title || "Tahapan Tanpa Judul",
          target_value: m.targetValue || 0,
          current_value: m.completed ? (m.targetValue || 1) : 0,
          due_date: mDate,
          weight: 1,
          completed: !!m.completed
        };
      });

    let calculatedPct = 0;
    if (g.type === "task") {
      const taskRefs = g.links ? g.links.filter((l: any) => l.type === "task").map((l: any) => l.refId) : [];
      const targets = baseTasks.filter((t: any) => taskRefs.includes(t.id));
      const completed = targets.filter((t: any) => t.column === "done").length;
      calculatedPct = targets.length > 0 ? Math.round((completed / targets.length) * 100) : (g.currentValue || 0);
    } else if (g.type === "habit") {
      const habitRefs = g.links ? g.links.filter((l: any) => l.type === "habit").map((l: any) => l.refId) : [];
      const completions = baseHabitLogs.filter((l: any) => habitRefs.includes(l.habitId) && l.completed).length;
      calculatedPct = g.targetValue > 0 ? Math.round((completions / g.targetValue) * 100) : 0;
    } else {
      const startV = g.startValue || 0;
      const curV = g.currentValue || 0;
      const tarV = g.targetValue || 100;
      
      if (g.invert) {
        const deltaTotal = startV - tarV;
        const deltaCurrent = startV - curV;
        calculatedPct = deltaTotal > 0 ? Math.round((deltaCurrent / deltaTotal) * 100) : 0;
      } else {
        const deltaTotal = tarV - startV;
        const deltaCurrent = curV - startV;
        calculatedPct = deltaTotal > 0 ? Math.round((deltaCurrent / deltaTotal) * 100) : 0;
      }
    }

    let gDate: string | null = null;
    if (g.targetDate) {
      try {
        gDate = new Date(g.targetDate).toISOString().split('T')[0];
      } catch(e) { gDate = null; }
    }

    return {
      id: cleanGoalId,
      user_id: 1,
      area_id: parseLifeArea(g.lifeArea as BaseLifeAreaType).id,
      title: g.name || "Target Tanpa Judul",
      description: g.description || null,
      target_amount: g.targetValue || 0,
      current_amount: g.currentValue || 0,
      due_date: gDate,
      completed: g.status === "completed" || calculatedPct >= 100,
      progress_percent: Math.max(0, Math.min(100, calculatedPct)),
      area: parseLifeArea(g.lifeArea as BaseLifeAreaType),
      milestones: filteredMilestones
    };
  });

  return {
    goals: formattedGoals,
    loading: false,
    fetchGoals: async () => {
      return;
    },
    addGoal: async (inputPayload: Partial<Goal>) => {
      const inverseAreaMap: Record<number, BaseLifeAreaType> = {
        1: "finance", 2: "career", 3: "health", 4: "relationship", 5: "learning"
      };
      
      if (triggerAddGoal) {
        triggerAddGoal({
          name: inputPayload.title || "Target Tanpa Judul",
          description: inputPayload.description || "",
          lifeArea: inverseAreaMap[inputPayload.area_id || 1] || "career",
          targetValue: inputPayload.target_amount || 100,
          currentValue: 0,
          startValue: 0,
          type: "manual",
          status: "active",
          targetDate: inputPayload.due_date ? new Date(inputPayload.due_date).getTime() : Date.now() + 2592000000
        });
      }
    },
    updateMilestoneProgress: async (goalId: string, milestoneId: string, addedValue: number) => {
      if (triggerToggleMilestone) {
        triggerToggleMilestone(milestoneId.toString());
      }
    }
  };
};