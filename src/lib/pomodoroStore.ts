/* eslint-disable prettier/prettier */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { pomodoroApi, type PomodoroMode } from "@/lib/api";
import { toast } from "sonner";

export type { PomodoroMode };

export const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

interface PomodoroState {
  mode: PomodoroMode;

  /**
   * Kapan segmen yang sedang berjalan dimulai (epoch ms), atau null kalau
   * tidak ada yang berjalan.
   *
   * INI KUNCI kenapa timer tetap jalan saat pindah halaman / reload:
   * sisa waktu SELALU dihitung dari selisih `Date.now() - segmentStartedAt`,
   * bukan dari akumulasi tick setInterval. Jadi komponen boleh unmount,
   * tab boleh di-background (browser melambatkan interval di tab non-aktif),
   * halaman boleh di-refresh -- angkanya tetap benar karena yang disimpan
   * adalah TITIK WAKTU MULAI, bukan hitungan mundur yang rapuh.
   */
  segmentStartedAt: number | null;

  /** Durasi preset tiap mode, dalam menit. */
  durations: Record<PomodoroMode, number>;

  /** Sudah bunyi/notif saat menyentuh 00:00 untuk segmen ini? */
  alertedThisSegment: boolean;

  /** Dinaikkan tiap kali sebuah segmen tersimpan -- dipakai UI untuk refetch. */
  savedCount: number;

  setDuration: (mode: PomodoroMode, minutes: number) => void;
  start: () => void;
  /** Tombol utama: perilakunya tergantung mode & status (lihat komentar di bawah). */
  primaryAction: () => void;
  reset: () => void;
  switchMode: (mode: PomodoroMode) => void;
  markAlerted: () => void;
}

/**
 * Tutup segmen yang sedang berjalan dan kirim ke backend.
 * Dipisah dari store supaya bisa dipakai semua action tanpa duplikasi.
 */
async function flushSegment(
  mode: PomodoroMode,
  startedAt: number | null,
  completed: boolean,
  onSaved: () => void,
) {
  if (!startedAt) return;

  const endedAt = Date.now();
  // Segmen < 1 detik memang ditolak backend, tapi disaring di sini juga
  // supaya tidak buang-buang request.
  if (endedAt - startedAt < 1000) return;

  try {
    await pomodoroApi.record({
      mode,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      completed,
    });
    onSaved();
  } catch (err) {
    console.error("POMODORO RECORD ERROR", err);
    toast.error("Gagal menyimpan sesi Pomodoro ke server.");
  }
}

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => ({
      mode: "focus",
      segmentStartedAt: null,
      durations: { focus: 25, short: 5, long: 15 },
      alertedThisSegment: false,
      savedCount: 0,

      setDuration: (mode, minutes) =>
        set((s) => ({
          durations: { ...s.durations, [mode]: Math.max(1, Math.round(minutes)) },
        })),

      start: () =>
        set({ segmentStartedAt: Date.now(), alertedThisSegment: false }),

      /**
       * Alur yang diminta user:
       *  - Sedang FOCUS lalu ditekan  -> "aku istirahat sebentar": segmen focus
       *    ditutup & dicatat, mode otomatis pindah ke Short Break dan LANGSUNG
       *    menghitung berapa lama istirahatnya.
       *  - Sedang BREAK lalu ditekan  -> "istirahat selesai": segmen break
       *    ditutup & dicatat, balik ke Focus dan langsung jalan.
       *  - Sedang berhenti            -> mulai segmen baru di mode saat ini.
       */
      primaryAction: () => {
        const { mode, segmentStartedAt, savedCount } = get();

        if (!segmentStartedAt) {
          set({ segmentStartedAt: Date.now(), alertedThisSegment: false });
          return;
        }

        const nextMode: PomodoroMode = mode === "focus" ? "short" : "focus";

        void flushSegment(mode, segmentStartedAt, false, () =>
          set({ savedCount: get().savedCount + 1 }),
        );

        set({
          mode: nextMode,
          segmentStartedAt: Date.now(),
          alertedThisSegment: false,
          savedCount,
        });
      },

      /** Hentikan total: catat yang sedang berjalan, lalu kembali ke 00 penuh. */
      reset: () => {
        const { mode, segmentStartedAt } = get();

        void flushSegment(mode, segmentStartedAt, false, () =>
          set({ savedCount: get().savedCount + 1 }),
        );

        set({ segmentStartedAt: null, alertedThisSegment: false });
      },

      /** Ganti mode manual: segmen berjalan dicatat dulu, lalu berhenti. */
      switchMode: (next) => {
        const { mode, segmentStartedAt } = get();

        if (next === mode && !segmentStartedAt) return;

        void flushSegment(mode, segmentStartedAt, false, () =>
          set({ savedCount: get().savedCount + 1 }),
        );

        set({ mode: next, segmentStartedAt: null, alertedThisSegment: false });
      },

      markAlerted: () => set({ alertedThisSegment: true }),
    }),
    {
      name: "baytasks-pomodoro",
      storage: createJSONStorage(() => localStorage),
      // `savedCount` sengaja tidak ikut disimpan -- itu cuma sinyal refetch
      // antar-komponen dalam satu sesi browser.
      partialize: (s) => ({
        mode: s.mode,
        segmentStartedAt: s.segmentStartedAt,
        durations: s.durations,
        alertedThisSegment: s.alertedThisSegment,
      }),
    },
  ),
);

/**
 * Nilai turunan yang berdetak tiap detik. Sengaja pakai state lokal per
 * komponen (bukan interval global di store) supaya tidak ada timer yatim
 * saat semua konsumennya unmount.
 */
export function usePomodoroTimer() {
  const mode = usePomodoro((s) => s.mode);
  const segmentStartedAt = usePomodoro((s) => s.segmentStartedAt);
  const durations = usePomodoro((s) => s.durations);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!segmentStartedAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [segmentStartedAt]);

  const running = segmentStartedAt !== null;
  const totalSeconds = durations[mode] * 60;
  const elapsed = running ? Math.floor((now - segmentStartedAt!) / 1000) : 0;

  // Boleh MINUS: kalau lewat dari preset, timer lanjut menghitung ke atas
  // (ditampilkan "+MM:SS"). Ini disengaja supaya istirahat panjang yang
  // molor -- mis. 1 jam 30 menit -- tetap terekam apa adanya, bukan
  // terpotong di preset.
  const remaining = totalSeconds - elapsed;
  const overtime = remaining < 0;

  const progress = totalSeconds > 0
    ? Math.min(100, Math.max(0, (Math.max(0, remaining) / totalSeconds) * 100))
    : 0;

  return { mode, running, elapsed, remaining, overtime, totalSeconds, progress };
}

/** Format detik -> "MM:SS" atau "H:MM:SS" kalau sudah lewat sejam. */
export function formatClock(totalSeconds: number): string {
  const s = Math.abs(Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const mm = String(h > 0 ? m : m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Format detik -> "1j 30m 20d" untuk tabel rekap. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s === 0) return "-";

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0 && h === 0) parts.push(`${sec}d`);

  return parts.join(" ") || `${sec}d`;
}
