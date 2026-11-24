/* eslint-disable prettier/prettier */

/**
 * Satu sumber kebenaran untuk tampilan status kolom Kanban.
 *
 * Sebelum ini warnanya cuma ada di satu tempat (chip filter Activity Log di
 * calendar.tsx) dalam bentuk kelas Tailwind mati seperti `bg-slate-400`,
 * sementara kartu task di kalender diwarnai menurut PRIORITAS — jadi tidak
 * ada satu pun tempat di kalender yang memberi tahu status sebuah task.
 *
 * Warnanya memakai variabel tema (`--status-*` di styles.css), bukan palet
 * Tailwind, karena variabel itu punya nilai sendiri untuk tema terang.
 * Kelas seperti `text-cyan-100` tampak bagus di latar gelap lalu nyaris
 * hilang di latar putih — persis keluhan "warnanya mati saat tema terang".
 */

export type StatusId = "backlog" | "todo" | "in_progress" | "review" | "done";

export type StatusMeta = {
  id: StatusId;

  label: string;

  /** Variabel CSS warnanya, dipakai untuk titik maupun pil. */
  cssVar: string;

  /** Kelas titik kecil (legenda, chip filter). */
  dot: string;

  /** Kelas pil berwarna: border + latar + teks. */
  pill: string;
};

/**
 * JANGAN merangkai kelas ini dari potongan string saat runtime.
 *
 * Tailwind v4 memindai BERKAS SUMBER untuk mencari nama kelas, lalu hanya
 * membuat CSS untuk yang benar-benar tertulis utuh di situ. Versi pertama
 * berkas ini membangun kelasnya dengan template string
 * (`border-[...var(${cssVar})...]`) -- hasilnya benar di DOM tapi TIDAK ADA
 * CSS-nya sama sekali, jadi semua pil tampil polos tanpa warna. Karena itu
 * ketiga kelas tiap status ditulis panjang lebar di bawah.
 */
export const STATUS_META: StatusMeta[] = [
  {
    id: "backlog",
    label: "Backlog",
    cssVar: "--status-backlog",
    dot: "bg-[var(--status-backlog)]",
    pill:
      "border-[color-mix(in_oklab,var(--status-backlog)_38%,transparent)] " +
      "bg-[color-mix(in_oklab,var(--status-backlog)_16%,transparent)] " +
      "text-[var(--status-backlog)]",
  },
  {
    id: "todo",
    label: "To Do",
    cssVar: "--status-todo",
    dot: "bg-[var(--status-todo)]",
    pill:
      "border-[color-mix(in_oklab,var(--status-todo)_38%,transparent)] " +
      "bg-[color-mix(in_oklab,var(--status-todo)_16%,transparent)] " +
      "text-[var(--status-todo)]",
  },
  {
    id: "in_progress",
    label: "In Progress",
    cssVar: "--status-in-progress",
    dot: "bg-[var(--status-in-progress)]",
    pill:
      "border-[color-mix(in_oklab,var(--status-in-progress)_38%,transparent)] " +
      "bg-[color-mix(in_oklab,var(--status-in-progress)_16%,transparent)] " +
      "text-[var(--status-in-progress)]",
  },
  {
    id: "review",
    label: "Review",
    cssVar: "--status-review",
    dot: "bg-[var(--status-review)]",
    pill:
      "border-[color-mix(in_oklab,var(--status-review)_38%,transparent)] " +
      "bg-[color-mix(in_oklab,var(--status-review)_16%,transparent)] " +
      "text-[var(--status-review)]",
  },
  {
    id: "done",
    label: "Done",
    cssVar: "--status-done",
    dot: "bg-[var(--status-done)]",
    pill:
      "border-[color-mix(in_oklab,var(--status-done)_38%,transparent)] " +
      "bg-[color-mix(in_oklab,var(--status-done)_16%,transparent)] " +
      "text-[var(--status-done)]",
  },
];

const PETA: Record<string, StatusMeta> = Object.fromEntries(
  STATUS_META.map((s) => [s.id, s]),
);

/**
 * Status yang tidak dikenal (kolom baru, data lama, nilai NULL) jatuh ke
 * Backlog — netral dan tidak pernah salah mengaku "Done".
 */
export function statusMeta(id?: string | null): StatusMeta {
  return PETA[id ?? ""] ?? PETA.backlog;
}
