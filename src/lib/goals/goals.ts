/* eslint-disable prettier/prettier */

const DAY = 86400000;

/**
 * Mengamankan penanda waktu reaktif agar statis selama siklus render berjalan.
 * Ini memutus loop yang dipicu oleh milidetik Date.now() yang selalu berubah.
 */
const getStatisNow = () => {
  return Math.floor(Date.now() / 60000) * 60000; // Pembulatan per menit
};

/**
 * Menghitung progres sasaran secara live berdasarkan keterhubungan tipe data (task/habit/manual)
 */
export function computeGoalProgress(goal: any, ctx: { tasks: any[]; habitLogs: any[]; milestones?: any[]; habits?: any[] }) {
  const cleanId = goal.id?.toString();

  // 1. Ambil data Milestones yang nge-link dengan Goal ini
  const linkedMilestones = ctx.milestones 
    ? ctx.milestones.filter((m: any) => m.goalId?.toString() === cleanId || m.goal_id?.toString() === cleanId)
    : [];
  const totalMilestones = linkedMilestones.length;
  const doneMilestones = linkedMilestones.filter((m: any) => m.completed).length;

  // 2. Ambil data Tasks yang nge-link dengan Goal ini (baik via goalId langsung atau via goal.links)
  const taskIds = goal.links ? goal.links.filter((l: any) => l.type === "task").map((l: any) => l.refId?.toString()) : [];
  const linkedTasks = ctx.tasks 
    ? ctx.tasks.filter((t: any) => t.goalId?.toString() === cleanId || t.goal_id?.toString() === cleanId || taskIds.includes(t.id?.toString()))
    : [];
  const totalTasks = linkedTasks.length;
  const doneTasks = linkedTasks.filter((t: any) => t.column === "done").length;

  // 3. Ambil data Habits yang nge-link dengan Goal ini
  const habitIds = goal.links ? goal.links.filter((l: any) => l.type === "habit").map((l: any) => l.refId?.toString()) : [];
  const activeHabitIds = ctx.habits 
    ? ctx.habits.filter((h: any) => h.goalId?.toString() === cleanId || h.goal_id?.toString() === cleanId || habitIds.includes(h.id?.toString())).map((h: any) => h.id?.toString())
    : habitIds;
    
  // Hitung berapa kali ritual habit ini di-log/completed hari ini/total
  const linkedHabitLogs = ctx.habitLogs 
    ? ctx.habitLogs.filter((l: any) => activeHabitIds.includes(l.habitId?.toString()) && (l.completed || l.done))
    : [];
  const totalHabits = activeHabitIds.length;
  const doneHabits = linkedHabitLogs.length; // atau sesuaikan dengan kecocokan hari target

  // 4. JIKA ADA LINK REAKTIF TERDETEKSI -> HITUNG TOTAL AGREGAT GABUNGAN
  if (totalMilestones > 0 || totalTasks > 0 || totalHabits > 0) {
    const totalItems = totalMilestones + totalTasks + totalHabits;
    const doneItems = doneMilestones + doneTasks + doneHabits;
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return {
      current: doneItems,
      target: totalItems,
      pct: Math.max(0, Math.min(100, pct))
    };
  }

  // 5. FALLBACK: Jika tidak ada link sama sekali, gunakan input manual numerik bawaan dari database
  const startValue = goal.startValue || 0;
  const currentValue = goal.currentValue || goal.current_amount || 0;
  const targetValue = goal.targetValue || goal.target_amount || 100;

  if (goal.invert) {
    const span = startValue - targetValue;
    const done = startValue - currentValue;
    const pct = span > 0 ? Math.round((done / span) * 100) : (currentValue <= targetValue ? 100 : 0);
    return { current: currentValue, target: targetValue, pct: Math.max(0, Math.min(100, pct)) };
  }

  const span = targetValue - startValue;
  const done = currentValue - startValue;
  const pct = span > 0 ? Math.round((done / span) * 100) : (currentValue >= targetValue ? 100 : 0);
  return { current: currentValue, target: targetValue, pct: Math.max(0, Math.min(100, pct)) };
}

/**
 * Memformat nilai angka capaian target beserta satuannya (unit)
 */
export function formatValue(goal: any, value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const num = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  const unit = goal.unit || goal.target_unit || "";
  return unit ? `${num}${/^[a-zA-Z]/.test(unit) && unit.length > 1 ? " " : ""}${unit}` : num;
}

/**
 * Menghitung persentase lini masa waktu target yang sudah berjalan
 */
export function timeProgressPct(goal: any): number | null {
  const targetDate = goal.targetDate || goal.target_date || goal.due_date ? new Date(goal.targetDate || goal.target_date || goal.due_date).getTime() : null;
  const createdAt = goal.createdAt || goal.created_at ? new Date(goal.createdAt || goal.created_at).getTime() : null;

  if (!targetDate || !createdAt) return null;
  const total = targetDate - createdAt;
  if (total <= 0) return 100;
  const elapsed = getStatisNow() - createdAt;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

/**
 * Menghitung sisa hari menuju tenggat waktu (deadline)
 */
export function daysRemaining(goal: any): number | null {
  const targetDate = goal.targetDate || goal.target_date || goal.due_date ? new Date(goal.targetDate || goal.target_date || goal.due_date).getTime() : null;
  if (!targetDate) return null;
  return Math.ceil((targetDate - getStatisNow()) / DAY);
}

/**
 * Menghitung unit progres capaian rata-rata per hari sejak target dibuat
 */
export function velocityPerDay(goal: any): number {
  const createdAt = goal.createdAt || goal.created_at ? new Date(goal.createdAt || goal.created_at).getTime() : getStatisNow() - DAY;
  const daysElapsed = Math.max(1, (getStatisNow() - createdAt) / DAY);
  
  const startValue = goal.startValue || goal.start_value || 0; // SG-FIX: 'g' diganti 'goal'
  const currentValue = goal.currentValue || goal.current_amount || goal.current_value || 0;
  
  const done = goal.invert ? startValue - currentValue : currentValue - startValue;
  return done / daysElapsed;
}

/**
 * Menghitung sisa volume/nominal kuantitas untuk mencapai target akhir
 */
export function remainingAmount(goal: any): number {
  const currentValue = goal.currentValue || goal.current_amount || goal.current_value || 0;
  const targetValue = goal.targetValue || goal.target_amount || 0;
  
  return goal.invert
    ? Math.max(0, currentValue - targetValue)
    : Math.max(0, targetValue - currentValue);
}

/**
 * Memproyeksikan estimasi tanggal penyelesaian ideal berdasarkan tren kecepatan harian
 */
export function projectedCompletion(goal: any): number | null {
  const v = velocityPerDay(goal);
  const remaining = remainingAmount(goal);
  if (remaining <= 0) return getStatisNow();
  if (v <= 0) return null;
  return getStatisNow() + (remaining / v) * DAY;
}

export interface CoachInsight {
  tone: "positive" | "warning" | "neutral";
  text: string;
}

/**
 * Generator Analisis Wawasan AI Coach lokal pembaca performa target
 */
export function generateInsights(
  goal: any,
  ctx: { tasks: any[]; habitLogs: any[]; milestones: any[]; plans: any[] },
): CoachInsight[] {
  const out: CoachInsight[] = [];
  
  const { pct } = computeGoalProgress(goal, ctx);
  const tProg = timeProgressPct(goal);
  const status = goal.status || (goal.completed ? "completed" : "active");

  if (status === "completed") {
    out.push({ tone: "positive", text: "Target tercapai — eksekusi yang luar biasa. Pertimbangkan untuk menetapkan sasaran peregangan kelanjutan." });
    return out;
  }

  // Evaluasi ritme performa terhadap lini masa waktu berjalan
  if (tProg !== null) {
    const delta = pct - tProg;
    if (delta >= 8) out.push({ tone: "positive", text: `Anda berjalan ${Math.round(delta)}% lebih cepat dari target lini masa waktu. Pertahankan ritme ini.` });
    else if (delta <= -8) out.push({ tone: "warning", text: `Anda tertinggal ${Math.abs(Math.round(delta))}% dari kecepatan target seharusnya. Tingkatkan fokus minggu ini.` });
    else out.push({ tone: "neutral", text: "Kecepatan eksekusi Anda berjalan stabil dan selaras dengan perencanaan jadwal." });
  } else {
    out.push({ tone: "neutral", text: `Pencapaian Anda berada pada tingkat ${pct}% menuju pemenuhan target utama.` });
  }

  // Evaluasi estimasi proyeksi selesai vs batas waktu asli
  const proj = projectedCompletion(goal);
  const targetDate = goal.targetDate || goal.target_date || goal.due_date ? new Date(goal.targetDate || goal.target_date || goal.due_date).getTime() : null;
  
  if (proj && targetDate) {
    const diffDays = Math.round((proj - targetDate) / DAY);
    if (diffDays > 14) {
      out.push({ tone: "warning", text: `Berdasarkan ritme saat ini, estimasi penyelesaian berpotensi terlambat sekitar ~${Math.round(diffDays / 30)} bulan dari target.` });
    } else if (diffDays < -14) {
      out.push({ tone: "positive", text: `Tren eksekusi Anda memproyeksikan target selesai ~${Math.round(Math.abs(diffDays) / 30)} bulan lebih awal.` });
    } else {
      out.push({ tone: "neutral", text: "Proyeksi waktu penyelesaian Anda berjalan sangat dekat dengan batas akhir target." });
    }
  } else if (proj === null && remainingAmount(goal) > 0) {
    out.push({ tone: "warning", text: "Belum ada progres terukur terdeteksi — perbarui data capaian untuk mulai mengalkulasi kecepatan tren." });
  }

  // Evaluasi pencapaian Milestones penunjang
  const cleanId = goal.id?.toString();
  const mine = ctx.milestones ? ctx.milestones.filter((m: any) => m.goalId?.toString() === cleanId || m.goal_id?.toString() === cleanId) : [];
  if (mine.length) {
    const done = mine.filter((m: any) => m.completed).length;
    const rate = Math.round((done / mine.length) * 100);
    out.push({
      tone: rate >= 70 ? "positive" : rate >= 40 ? "neutral" : "warning",
      text: `Anda telah menyelesaikan ${rate}% dari rencana tahapan milestone (${done}/${mine.length}).`,
    });
    const overdue = mine.find((m: any) => !m.completed && m.dueAt && new Date(m.dueAt).getTime() < getStatisNow());
    if (overdue) out.push({ tone: "warning", text: `Tahapan milestone "${overdue.title || overdue.name}" melewati tenggat waktu — prioritaskan langkah ini segera.` });
  }

  // Evaluasi pemenuhan target Perencanaan Triwulan berjalan
  const q = (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const plan = ctx.plans ? ctx.plans.find((p: any) => (p.goalId?.toString() === cleanId || p.goal_id?.toString() === cleanId) && p.quarter === q && p.year === new Date().getFullYear()) : null;
  if (plan && plan.target > 0) {
    const qpct = Math.round((plan.current / plan.target) * 100);
    out.push({
      tone: qpct >= 90 ? "positive" : qpct >= 60 ? "neutral" : "warning",
      text: `Triwulan ini performa capaian berada di tingkat ${qpct}% dari target rencana Q${q}.`,
    });
  }

  const dRem = daysRemaining(goal);
  if (dRem !== null && dRem < 0 && status === "active") {
    out.push({ tone: "warning", text: "Batas waktu pengerjaan telah terlampaui. Perbarui tenggat waktu atau lakukan akselerasi pengerjaan akhir." });
  }

  return out.slice(0, 5);
}