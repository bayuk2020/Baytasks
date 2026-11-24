/* eslint-disable prettier/prettier */

/**
 * Warna pita penanda halaman.
 *
 * Sengaja memakai ulang variabel tema yang sudah ada (status & prioritas)
 * daripada membuat variabel baru: kelimanya sudah punya nilai untuk tema
 * terang maupun gelap, dan rasio kontrasnya sudah diukur di dua tema.
 *
 * Seperti di statusMeta.ts, kelasnya WAJIB ditulis utuh. Tailwind memindai
 * berkas sumber untuk mencari nama kelas; kelas yang dirakit dari potongan
 * string saat runtime tidak akan punya CSS sama sekali.
 */

export type BookmarkColor = "amber" | "sky" | "violet" | "emerald" | "rose";

export type BookmarkColorMeta = {
  id: BookmarkColor;
  label: string;
  /** Latar + border pita. */
  pita: string;
  /** Warna isi untuk ikon/teks. */
  teks: string;
  /** Titik kecil di pemilih warna. */
  titik: string;
};

export const BOOKMARK_COLORS: BookmarkColorMeta[] = [
  {
    id: "amber",
    label: "Kuning",
    pita: "border-[color-mix(in_oklab,var(--status-in-progress)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-in-progress)_16%,transparent)]",
    teks: "text-[var(--status-in-progress)]",
    titik: "bg-[var(--status-in-progress)]",
  },
  {
    id: "sky",
    label: "Biru",
    pita: "border-[color-mix(in_oklab,var(--status-todo)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-todo)_16%,transparent)]",
    teks: "text-[var(--status-todo)]",
    titik: "bg-[var(--status-todo)]",
  },
  {
    id: "violet",
    label: "Ungu",
    pita: "border-[color-mix(in_oklab,var(--status-review)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-review)_16%,transparent)]",
    teks: "text-[var(--status-review)]",
    titik: "bg-[var(--status-review)]",
  },
  {
    id: "emerald",
    label: "Hijau",
    pita: "border-[color-mix(in_oklab,var(--status-done)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-done)_16%,transparent)]",
    teks: "text-[var(--status-done)]",
    titik: "bg-[var(--status-done)]",
  },
  {
    id: "rose",
    label: "Merah",
    pita: "border-[color-mix(in_oklab,var(--priority-urgent)_38%,transparent)] bg-[color-mix(in_oklab,var(--priority-urgent)_16%,transparent)]",
    teks: "text-[var(--priority-urgent)]",
    titik: "bg-[var(--priority-urgent)]",
  },
];

const PETA: Record<string, BookmarkColorMeta> = Object.fromEntries(
  BOOKMARK_COLORS.map((c) => [c.id, c]),
);

/** Warna yang tidak dikenal (atau kosong) jatuh ke kuning. */
export function bookmarkColor(id?: string | null): BookmarkColorMeta {
  return PETA[id ?? ""] ?? PETA.amber;
}
