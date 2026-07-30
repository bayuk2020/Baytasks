/* eslint-disable prettier/prettier */
import type { Task, HabitLog } from "./store";
import { todayKey } from "./store";

export interface WeeklyMomentumDay {
  label: string;
  tasks: number;
  habits: number;
  total: number;
}

/**
 * Skor Weekly Momentum: task selesai + habit log SELESAI (bukan sekadar
 * "ada log", termasuk entri "habit terlewat" yang completed=false dari
 * SendTaskReminders di backend) per hari, 7 hari terakhir.
 *
 * BUG LAMA (di index.tsx): filter habit log-nya tidak mensyaratkan
 * `completed === true`, jadi habit yang TERLEWAT pun ikut menaikkan skor
 * momentum -- kebalikan dari maksud "momentum".
 */
export function computeWeeklyMomentum(tasks: Task[], habitLogs: HabitLog[]): WeeklyMomentumDay[] {
  const days: WeeklyMomentumDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);

    const completedTasks = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === d.toDateString(),
    ).length;

    const completedHabits = habitLogs.filter((l) => l.date === key && l.completed).length;

    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" })[0],
      tasks: completedTasks,
      habits: completedHabits,
      total: completedTasks + completedHabits,
    });
  }

  return days;
}

/**
 * Streak = berapa hari BERTURUT-TURUT (sampai hari ini/kemarin) ada minimal
 * satu task selesai. Dipakai bersama oleh Topbar, Sidebar, dan Dashboard
 * supaya SATU logika yang sama di mana-mana -- sebelumnya Topbar & Sidebar
 * masing-masing punya salinan sendiri, dan Dashboard malah pakai
 * `store.streak` yang hanya ter-update lewat bumpStreak() manual (dipanggil
 * dari TaskModal), jadi TIDAK IKUT NAIK kalau task diselesaikan lewat
 * drag-and-drop di Kanban board -- angkanya bisa beda-beda di 3 tempat.
 *
 * Juga memperbaiki bug kedua: versi lama tidak pernah "putus" -- begitu
 * pernah punya streak 10 hari lalu berhenti berbulan-bulan, angka 10 itu
 * akan terus tertampil selamanya. Sekarang streak dianggap 0 kalau hari
 * terakhir yang tercatat bukan hari ini atau kemarin.
 */
export function computeStreak(tasks: Task[]): number {
  const completedDays = Array.from(
    new Set(
      tasks
        .filter((t) => t.completedAt)
        .map((t) => {
          const d = new Date(t.completedAt!);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
    ),
  ).sort((a, b) => b - a);

  if (completedDays.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceLastActivity = Math.round((today.getTime() - completedDays[0]) / 86400000);
  if (daysSinceLastActivity > 1) return 0;

  let streak = 1;
  for (let i = 0; i < completedDays.length - 1; i++) {
    if (completedDays[i] - completedDays[i + 1] === 86400000) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
