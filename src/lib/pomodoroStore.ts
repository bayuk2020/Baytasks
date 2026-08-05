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

  /**
   * Id baris sesi TERBUKA di server (ended_at masih NULL), kalau ada.
   *
   * Sesi Pomodoro bisa dimulai dari mana saja -- widget header, halaman
   * Pomodoro, bot Telegram, atau chat AI. Server yang jadi sumber kebenaran,
   * jadi kalau id ini ada, penutupan sesi dilakukan lewat /pomodoro/stop
   * (server yang menghitung durasinya pakai jamnya sendiri). Kalau null
   * (mis. saat start gagal karena offline), sesi ditutup lewat jalur lama
   * dengan mengirim rentang waktu lokal.
   */
  serverSessionId: number | null;

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
  /** Adopsi sesi yang sedang berjalan di server (mis. dimulai lewat Telegram). */
  syncFromServer: () => Promise<void>;
}

/**
 * Tutup segmen yang sedang berjalan dan kirim ke backend.
 *
 * Dua jalur:
 *  - Server sudah punya sesi terbuka -> cukup /pomodoro/stop, server yang
 *    menghitung durasi pakai jamnya sendiri (lebih tepercaya, dan bekerja
 *    walau sesi tadi dimulai dari Telegram).
 *  - Server tidak tahu apa-apa (start gagal saat offline) -> kirim rentang
 *    waktu lokal sebagai satu baris utuh, supaya data tidak hilang.
 */
async function flushSegment(
  mode: PomodoroMode,
  startedAt: number | null,
  serverSessionId: number | null,
  completed: boolean,
  onSaved: () => void,
) {
  if (!startedAt && !serverSessionId) return;

  try {
    if (serverSessionId) {
      await pomodoroApi.stop();
      onSaved();
      return;
    }

    const endedAt = Date.now();
    // Segmen < 1 detik memang ditolak backend, tapi disaring di sini juga
    // supaya tidak buang-buang request.
    if (endedAt - startedAt! < 1000) return;

    await pomodoroApi.record({
      mode,
      startedAt: new Date(startedAt!).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      completed,
    });
    onSaved();
  } catch (err) {
    console.error("POMODORO RECORD ERROR", err);
    toast.error("Gagal menyimpan sesi Pomodoro ke server.");
  }
}

/**
 * Buka sesi baru di server. Dipanggil setelah state lokal sudah berjalan
 * (optimistis) supaya UI tidak menunggu jaringan.
 */
async function openOnServer(mode: PomodoroMode, apply: (id: number, startedAt: number) => void) {
  try {
    const res = await pomodoroApi.start(mode);
    if (res?.session) {
      apply(res.session.id, new Date(res.session.startedAt).getTime());
    }
  } catch (err) {
    // Bukan kondisi fatal: timer lokal tetap jalan, dan saat ditutup nanti
    // datanya dikirim lewat jalur cadangan di flushSegment().
    console.error("POMODORO START ERROR", err);
  }
}

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => ({
      mode: "focus",
      segmentStartedAt: null,
      serverSessionId: null,
      durations: { focus: 25, short: 5, long: 15 },
      alertedThisSegment: false,
      savedCount: 0,

      setDuration: (mode, minutes) =>
        set((s) => ({
          durations: { ...s.durations, [mode]: Math.max(1, Math.round(minutes)) },
        })),

      start: () => {
        const { mode } = get();
        set({ segmentStartedAt: Date.now(), serverSessionId: null, alertedThisSegment: false });
        void openOnServer(mode, (id, startedAt) =>
          set({ serverSessionId: id, segmentStartedAt: startedAt }),
        );
      },

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
        const { mode, segmentStartedAt, serverSessionId } = get();

        if (!segmentStartedAt) {
          get().start();
          return;
        }

        const nextMode: PomodoroMode = mode === "focus" ? "short" : "focus";

        // Tutup segmen lama LALU buka yang baru -- dijalankan berurutan supaya
        // server tidak menutup sesi baru yang belum sempat terdaftar.
        void (async () => {
          await flushSegment(mode, segmentStartedAt, serverSessionId, false, () =>
            set({ savedCount: get().savedCount + 1 }),
          );
          await openOnServer(nextMode, (id, startedAt) =>
            set({ serverSessionId: id, segmentStartedAt: startedAt }),
          );
        })();

        set({
          mode: nextMode,
          segmentStartedAt: Date.now(),
          serverSessionId: null,
          alertedThisSegment: false,
        });
      },

      /** Hentikan total: catat yang sedang berjalan, lalu kembali ke 00 penuh. */
      reset: () => {
        const { mode, segmentStartedAt, serverSessionId } = get();

        void flushSegment(mode, segmentStartedAt, serverSessionId, false, () =>
          set({ savedCount: get().savedCount + 1 }),
        );

        set({ segmentStartedAt: null, serverSessionId: null, alertedThisSegment: false });
      },

      /** Ganti mode manual: segmen berjalan dicatat dulu, lalu berhenti. */
      switchMode: (next) => {
        const { mode, segmentStartedAt, serverSessionId } = get();

        if (next === mode && !segmentStartedAt) return;

        void flushSegment(mode, segmentStartedAt, serverSessionId, false, () =>
          set({ savedCount: get().savedCount + 1 }),
        );

        set({
          mode: next,
          segmentStartedAt: null,
          serverSessionId: null,
          alertedThisSegment: false,
        });
      },

      markAlerted: () => set({ alertedThisSegment: true }),

      /**
       * Samakan state lokal dengan sesi terbuka di server. Inilah yang
       * membuat sesi yang dinyalakan lewat "aku mau fokus" di Telegram
       * langsung muncul berjalan di header web.
       */
      syncFromServer: async () => {
        try {
          const { active } = await pomodoroApi.active();

          if (active) {
            set({
              mode: active.mode,
              segmentStartedAt: new Date(active.startedAt).getTime(),
              serverSessionId: active.id,
            });
            return;
          }

          // Server bilang tidak ada sesi berjalan, tapi lokal mengira ada
          // (mis. dihentikan lewat Telegram) -> ikuti server.
          if (get().serverSessionId !== null) {
            set({ segmentStartedAt: null, serverSessionId: null, alertedThisSegment: false });
          }
        } catch (err) {
          // Offline / server tak terjangkau: biarkan state lokal apa adanya.
          console.error("POMODORO SYNC ERROR", err);
        }
      },
    }),
    {
      name: "baytasks-pomodoro",
      storage: createJSONStorage(() => localStorage),
      // `savedCount` sengaja tidak ikut disimpan -- itu cuma sinyal refetch
      // antar-komponen dalam satu sesi browser.
      partialize: (s) => ({
        mode: s.mode,
        segmentStartedAt: s.segmentStartedAt,
        serverSessionId: s.serverSessionId,
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
