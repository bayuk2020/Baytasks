import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  Activity,
  AlarmClock,
  Bell,
  BellOff,
  Check,
  CircleAlert,
  FlaskConical,
  Loader2,
  Moon,
  RefreshCw,
  Send,
  Sun,
} from "lucide-react";

import { toast } from "sonner";

import { useStore } from "@/lib/store";

import {
  appSettingApi,
  boardApi,
  periksaDomainDariBrowser,
  type AppSettingItem,
  type AppSettingsResponse,
  type BarisKoneksi,
  type KeadaanTidur,
  type StatusPengirim,
} from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — BayTasks" }],
  }),

  component: Settings,
});

/** Nilai setting dipetakan per kunci supaya gampang dibaca di JSX. */
type PetaSetting = Record<string, AppSettingItem>;

/**
 * Menggali alasan penolakan dari error yang dilempar helper `request`.
 * Isinya body mentah respons 422: { ditolak: { "kunci": "alasan" } }.
 */
function alasanPenolakan(err: unknown): string | null {
  const pesan = err instanceof Error ? err.message : String(err ?? "");

  try {
    const data = JSON.parse(pesan);
    const ditolak = Object.entries(data?.ditolak ?? {});

    if (ditolak.length > 0) {
      return `${ditolak[0][0]}: ${ditolak[0][1]}`;
    }
    if (typeof data?.message === "string" && data.message !== "") {
      return data.message;
    }
  } catch {
    // Body bukan JSON -- biarkan pemanggil memakai pesan bawaannya.
  }

  return null;
}

function Settings() {
  const { boards, loadBoards, setTelegram } = useStore();

  const [setting, setSetting] = useState<PetaSetting>({});
  const [telegram, setTelegramLokal] = useState({ chat_id: "", enabled: false });
  const [tidur, setTidur] = useState<KeadaanTidur | null>(null);
  const [status, setStatus] = useState<StatusPengirim[]>([]);

  const [memuat, setMemuat] = useState(true);
  const [sibuk, setSibuk] = useState<string | null>(null);

  const [koneksi, setKoneksi] = useState<BarisKoneksi[]>([]);
  const [koneksiDiperiksa, setKoneksiDiperiksa] = useState<string | null>(null);

  // =========================================================
  // MUAT
  // =========================================================

  const terapkan = useCallback(
    (data: AppSettingsResponse) => {
      const peta: PetaSetting = {};
      for (const item of data.settings) peta[item.key] = item;

      setSetting(peta);
      setTelegramLokal(data.telegram);
      setTidur(data.sleep);
      setStatus(data.status);

      // Store lama masih menyimpan bentuk ini; dijaga tetap sinkron supaya
      // bagian lain aplikasi tidak melihat nilai basi.
      setTelegram({
        chatId: data.telegram.chat_id,
        enabled: data.telegram.enabled,
        dailyBriefing: Boolean(peta["notif.daily_briefing.enabled"]?.value),
      });
    },
    [setTelegram],
  );

  const muat = useCallback(async () => {
    try {
      terapkan(await appSettingApi.get());
    } catch (err) {
      console.error("LOAD SETTINGS ERROR", err);
      toast.error("Gagal memuat setting");
    } finally {
      setMemuat(false);
    }
  }, [terapkan]);

  /**
   * Status koneksi digabung dari dua sumber: yang hanya bisa dilihat server
   * (token bot, webhook, denyut worker) dan yang hanya jujur kalau diukur
   * browser (domain publik lewat tunnel).
   */
  const periksaKoneksi = useCallback(async () => {
    setSibuk("koneksi");

    const [dariServer, dariBrowser] = await Promise.allSettled([
      appSettingApi.koneksi(),
      periksaDomainDariBrowser(),
    ]);

    const baris: BarisKoneksi[] = [];

    if (dariBrowser.status === "fulfilled") baris.push(dariBrowser.value);

    if (dariServer.status === "fulfilled") {
      baris.push(...dariServer.value.koneksi);
      setKoneksiDiperiksa(dariServer.value.diperiksa);
    } else {
      baris.push({
        nama: "API BayTasks",
        sehat: false,
        catatan: "Tidak bisa dihubungi — server lokal atau tunnel sedang mati.",
      });
    }

    setKoneksi(baris);
    setSibuk(null);
  }, []);

  useEffect(() => {
    muat();
    loadBoards();
    periksaKoneksi();
  }, [muat, loadBoards, periksaKoneksi]);

  // =========================================================
  // SIMPAN
  // =========================================================

  const nilai = (kunci: string) => setting[kunci]?.value;

  const simpan = async (
    patch: Record<string, boolean | number | string>,
    telegramPatch?: { chat_id?: string; enabled?: boolean },
  ) => {
    // Tampilan diperbarui lebih dulu supaya toggle terasa langsung,
    // lalu dikoreksi dari jawaban server.
    setSetting((lama) => {
      const baru = { ...lama };
      for (const [k, v] of Object.entries(patch)) {
        if (baru[k]) baru[k] = { ...baru[k], value: v };
      }
      return baru;
    });

    try {
      const hasil = await appSettingApi.save({
        settings: patch,
        telegram: telegramPatch,
      });

      if (hasil?.status) setStatus(hasil.status);
      if (hasil?.sleep) setTidur(hasil.sleep);

      return true;
    } catch (err) {
      // Helper `request` di api.ts MELEMPAR untuk status non-2xx dan
      // memasang body mentahnya sebagai message. Server memulangkan 422
      // berisi { ditolak: { kunci: alasan } } saat ada nilai tidak sah, jadi
      // alasan aslinya digali dari situ -- bukan ditimpa "Gagal menyimpan"
      // yang tidak memberi tahu apa pun.
      const alasan = alasanPenolakan(err);

      console.error("SAVE SETTINGS ERROR", err);
      toast.error(alasan ?? "Gagal menyimpan");

      await muat();
      return false;
    }
  };

  const ubahTidur = async (aktif: boolean) => {
    setSibuk("tidur");
    try {
      const hasil = await appSettingApi.sleep(aktif);
      setTidur(hasil.sleep);
      toast.success(aktif ? "Sleep Mode menyala" : "Sleep Mode dimatikan");
      await muat();
    } catch {
      toast.error("Gagal mengubah Sleep Mode");
    } finally {
      setSibuk(null);
    }
  };

  const kirimReminderUji = async () => {
    setSibuk("reminder");

    try {
      const hasil = await appSettingApi.testReminder();

      if (hasil?.success) {
        toast.success(hasil.message ?? "Reminder uji coba dikirim");
      } else {
        toast.error(hasil?.message ?? "Tidak ada reminder yang bisa diuji");
      }

      await periksaKoneksi();
    } catch (err) {
      console.error("TEST REMINDER ERROR", err);
      toast.error(alasanPenolakan(err) ?? "Gagal mengirim reminder uji coba");
    } finally {
      setSibuk(null);
    }
  };

  const kirimSekarang = async (jenis: string, nama: string) => {
    setSibuk(jenis);
    try {
      const hasil = await appSettingApi.sendNow(jenis);

      if (hasil?.success) {
        toast.success(`${nama} terkirim ke Telegram`);
      } else {
        // Command bisa "berhasil jalan" tapi tidak mengirim apa pun karena
        // saklarnya mati atau Sleep Mode aktif — alasannya ditampilkan apa
        // adanya, bukan disamarkan jadi sukses.
        toast.error(hasil?.message ?? `${nama} tidak terkirim`);
      }

      if (hasil?.status) setStatus(hasil.status);
      await muat();
    } catch (err) {
      console.error("SEND NOW ERROR", err);
      toast.error(alasanPenolakan(err) ?? `${nama} gagal dikirim`);
    } finally {
      setSibuk(null);
    }
  };

  // =========================================================
  // BOARD
  // =========================================================

  const ubahBoard = async (id: string, name: string, emoji: string) => {
    try {
      // Dulu di sini ada URL http://127.0.0.1:8000 yang ditulis langsung,
      // jadi edit & hapus board MATI TOTAL di baytasks.kabyra.my.id.
      // Sekarang lewat boardApi yang memakai base URL yang sama dengan
      // seluruh aplikasi.
      await boardApi.update(id, { project_id: 1, name, emoji, position: 0 });
      await loadBoards();
      toast.success("Board diperbarui");
    } catch {
      toast.error("Gagal memperbarui board");
    }
  };

  const hapusBoard = async (id: string, name: string) => {
    if (!window.confirm(`Hapus board "${name}"? Task di dalamnya ikut terpengaruh.`)) {
      return;
    }

    try {
      await boardApi.remove(id);
      await loadBoards();
      toast.success("Board dihapus");
    } catch {
      toast.error("Gagal menghapus board");
    }
  };

  // =========================================================
  // TAMPILAN
  // =========================================================

  if (memuat) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat setting…
      </div>
    );
  }

  const indukMati = nilai("notif.master") === false;

  return (
    <div className="space-y-6 max-w-3xl pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        <button
          onClick={muat}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat ulang
        </button>
      </div>

      {/* ============ STATUS KONEKSI ============ */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Status koneksi
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Mengirim reminder <b>tidak</b> butuh tunnel — bot memanggil
              Telegram dari dalam. Tunnel hanya dipakai untuk yang masuk:
              balasan tombol dan website ini.
            </p>
          </div>

          <button
            onClick={periksaKoneksi}
            disabled={sibuk === "koneksi"}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-50"
          >
            {sibuk === "koneksi" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Periksa
          </button>
        </div>

        <ul className="space-y-2">
          {koneksi.length === 0 ? (
            <li className="text-xs text-muted-foreground py-2">Memeriksa…</li>
          ) : (
            koneksi.map((k) => (
              <li
                key={k.nama}
                className={`rounded-xl border px-3 py-2 ${
                  k.sehat
                    ? "border-[color-mix(in_oklab,var(--status-done)_30%,transparent)] bg-[color-mix(in_oklab,var(--status-done)_10%,transparent)]"
                    : "border-[color-mix(in_oklab,var(--priority-urgent)_35%,transparent)] bg-[color-mix(in_oklab,var(--priority-urgent)_10%,transparent)]"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      k.sehat ? "bg-[var(--status-done)]" : "bg-[var(--priority-urgent)]"
                    }`}
                  />
                  {k.nama}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">{k.catatan}</p>
              </li>
            ))
          )}
        </ul>

        {koneksiDiperiksa && (
          <p className="text-[11px] text-muted-foreground">
            Diperiksa {koneksiDiperiksa}.
          </p>
        )}
      </section>

      {/* ============ PANEL STATUS ============ */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Status notifikasi
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Kapan tiap notifikasi terakhir benar-benar terkirim. Kalau sekarang
            tidak akan terkirim, alasannya ditulis di sini.
          </p>
        </div>

        <ul className="space-y-2">
          {status.map((s) => (
            <li
              key={s.key}
              className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {s.akan_terkirim ? (
                    <Bell className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}

                  <span className="truncate">{s.label}</span>

                  {s.time && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {s.time}
                    </span>
                  )}

                  {s.tertinggal && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 shrink-0">
                      <CircleAlert className="h-3 w-3" />
                      tertinggal
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.last_sent_at
                    ? `Terakhir terkirim ${s.last_sent_at}`
                    : "Belum pernah tercatat terkirim"}
                  {s.alasan ? ` — ${s.alasan}` : ""}
                </p>
              </div>

              {(s.key === "morning_brief" || s.key === "nightly_summary") && (
                <button
                  onClick={() =>
                    kirimSekarang(
                      s.key === "morning_brief" ? "morning-brief" : "nightly-summary",
                      s.label,
                    )
                  }
                  disabled={sibuk !== null}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  {sibuk ===
                  (s.key === "morning_brief" ? "morning-brief" : "nightly-summary") ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Kirim sekarang"
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          Catatan: &quot;tertinggal&quot; berarti jam kirimnya hari ini sudah
          lewat tapi belum ada jejak terkirim hari ini.
        </p>

        {/* Reminder habit hanya menyala kalau jamnya pas di jendela 60 detik,
            jadi tanpa tombol ini satu-satunya cara memastikan adalah menunggu
            sampai jam habit berikutnya tiba. */}
        <div className="border-t border-border pt-4">
          <button
            onClick={kirimReminderUji}
            disabled={sibuk !== null}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--status-review)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-review)_14%,transparent)] px-3 py-2 text-sm text-[var(--status-review)] hover:bg-[color-mix(in_oklab,var(--status-review)_24%,transparent)] disabled:opacity-50"
          >
            {sibuk === "reminder" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            Kirim reminder habit uji coba
          </button>

          <p className="text-[11px] text-muted-foreground mt-1.5">
            Mengirim ulang satu habit — yang paling dekat akan datang, atau
            yang terakhir terlewat kalau hari ini sudah habis. Formatnya sama
            persis dengan reminder asli, termasuk tombolnya; kalau tombol itu
            berfungsi, berarti webhook juga sehat.
          </p>
        </div>
      </section>

      {/* ============ SLEEP MODE ============ */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-medium flex items-center gap-2">
            {tidur?.active ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
            Sleep Mode
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Saat menyala, semua notifikasi proaktif dibungkam. Sleep Mode
            berakhir sendiri jam {tidur?.auto_wake_at ?? "05:00"} supaya tidak
            pernah lagi membungkam berhari-hari tanpa disadari.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => ubahTidur(!tidur?.active)}
            disabled={sibuk === "tidur"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              tidur?.active
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {sibuk === "tidur" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tidur?.active ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}

            {tidur?.active ? "Bangunkan sekarang" : "Tidurkan"}
          </button>

          <div className="text-xs text-muted-foreground">
            {tidur?.active ? (
              <>
                Mulai tidur {tidur.since ?? "-"}
                {tidur.wake_time ? ` · bangun otomatis ${tidur.wake_time}` : ""}
              </>
            ) : (
              "Sedang bangun — notifikasi jalan normal."
            )}
          </div>
        </div>
      </section>

      {/* ============ TELEGRAM ============ */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-medium flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Koneksi Telegram
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Chat ID tujuan semua notifikasi. Lihat{" "}
            <a className="text-primary underline" href="/docs">
              Install &amp; API
            </a>{" "}
            untuk cara menyiapkan bot.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Chat ID
            </span>

            <input
              value={telegram.chat_id}
              onChange={(e) =>
                setTelegramLokal((t) => ({ ...t, chat_id: e.target.value }))
              }
              // Disimpan saat selesai mengetik, BUKAN tiap ketikan. Versi lama
              // menyimpan di onChange, jadi mengetik 10 digit = 10 request —
              // dan endpoint lamanya mengirim satu pesan Telegram per simpan.
              onBlur={(e) => simpan({}, { chat_id: e.target.value.trim() })}
              placeholder="123456789"
              className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <div className="flex items-end gap-3">
            <Toggle
              label="Telegram aktif"
              value={telegram.enabled}
              onChange={(v) => {
                setTelegramLokal((t) => ({ ...t, enabled: v }));
                simpan({}, { enabled: v });
              }}
            />
          </div>
        </div>

        <button
          onClick={() => kirimSekarang("test", "Pesan uji coba")}
          disabled={sibuk !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {sibuk === "test" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Kirim pesan uji coba
        </button>
      </section>

      {/* ============ NOTIFIKASI ============ */}
      <section className="glass rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="font-medium flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-primary" />
            Notifikasi &amp; briefing
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Saklar induk mematikan semuanya sekaligus — termasuk brief pagi dan
            rekap malam, yang dulu lolos dari saklar &quot;Enabled&quot;.
          </p>
        </div>

        <Toggle
          label="Semua notifikasi Telegram"
          value={nilai("notif.master") !== false}
          onChange={(v) => simpan({ "notif.master": v })}
        />

        <div
          className={
            indukMati ? "opacity-40 pointer-events-none space-y-5" : "space-y-5"
          }
        >
          <Baris
            judul="Morning Quest Log"
            catatan="Habit + task hari ini, dikelompokkan per board."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.morning_brief.enabled") !== false}
              onChange={(v) => simpan({ "notif.morning_brief.enabled": v })}
            />
            <JamInput
              nilai={String(nilai("notif.morning_brief.time") ?? "08:00")}
              onSimpan={(v) => simpan({ "notif.morning_brief.time": v })}
            />
          </Baris>

          <Baris
            judul="Nightly Summary"
            catatan="Rekap habit, task, dan subtask yang selesai hari ini."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.nightly_summary.enabled") !== false}
              onChange={(v) => simpan({ "notif.nightly_summary.enabled": v })}
            />
            <JamInput
              nilai={String(nilai("notif.nightly_summary.time") ?? "21:00")}
              onSimpan={(v) => simpan({ "notif.nightly_summary.time": v })}
            />
          </Baris>

          <Baris
            judul="Daily Briefing (ringkas)"
            catatan="Pesan hitungan singkat: open task, due today, overdue, streak. Tumpang tindih dengan Morning Quest Log."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.daily_briefing.enabled") !== false}
              onChange={(v) => simpan({ "notif.daily_briefing.enabled": v })}
            />
            <JamInput
              nilai={String(nilai("notif.daily_briefing.time") ?? "10:00")}
              onSimpan={(v) => simpan({ "notif.daily_briefing.time": v })}
            />
          </Baris>

          <Baris
            judul="Reminder jatuh tempo task"
            catatan="Dikirim 1 hari / 1 jam / 10 menit sebelum due_at."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.task_reminders.enabled") !== false}
              onChange={(v) => simpan({ "notif.task_reminders.enabled": v })}
            />
          </Baris>

          <Baris
            judul="Reminder habit"
            catatan="Mengikuti jam pengingat tiap habit."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.habit_reminders.enabled") !== false}
              onChange={(v) => simpan({ "notif.habit_reminders.enabled": v })}
            />
          </Baris>

          <Baris
            judul='Pulse "sedang apa?"'
            catatan="Pertanyaan berkala soal aktivitasmu, dilewati kalau sedang di tengah menu bot."
          >
            <Toggle
              label="Aktif"
              value={nilai("notif.pulse.enabled") !== false}
              onChange={(v) => simpan({ "notif.pulse.enabled": v })}
            />
            <AngkaInput
              nilai={Number(nilai("notif.pulse.interval_minutes") ?? 60)}
              satuan="menit"
              min={1}
              max={1440}
              onSimpan={(v) => simpan({ "notif.pulse.interval_minutes": v })}
            />
          </Baris>
        </div>
      </section>

      {/* ============ JAM DIAM ============ */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-medium">Jam diam</h2>

          <p className="text-sm text-muted-foreground mt-1">
            Membungkam reminder task, reminder habit, dan pulse di rentang jam
            ini. Morning Quest Log, Nightly Summary, dan Daily Briefing TIDAK
            terpengaruh — jamnya kamu pilih sendiri di atas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Toggle
            label="Aktif"
            value={nilai("notif.quiet_hours.enabled") === true}
            onChange={(v) => simpan({ "notif.quiet_hours.enabled": v })}
          />

          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">dari</span>
            <JamInput
              nilai={String(nilai("notif.quiet_hours.start") ?? "22:00")}
              onSimpan={(v) => simpan({ "notif.quiet_hours.start": v })}
            />
            <span className="text-xs text-muted-foreground">sampai</span>
            <JamInput
              nilai={String(nilai("notif.quiet_hours.end") ?? "06:00")}
              onSimpan={(v) => simpan({ "notif.quiet_hours.end": v })}
            />
          </div>
        </div>
      </section>

      {/* ============ BOARDS ============ */}
      <section className="glass rounded-2xl p-5">
        <h2 className="font-medium mb-3">Boards</h2>

        <ul className="divide-y divide-border">
          {boards.map((b) => (
            <li key={b.id} className="py-2 flex items-center gap-2">
              <input
                defaultValue={b.emoji}
                onBlur={(e) => ubahBoard(b.id, b.name, e.target.value)}
                className="w-14 bg-secondary/40 rounded-md px-2 py-1 text-sm outline-none"
              />

              <input
                defaultValue={b.name}
                onBlur={(e) => ubahBoard(b.id, e.target.value, b.emoji)}
                className="flex-1 bg-transparent outline-none text-sm rounded-md px-2 py-1 focus:bg-secondary/60"
              />

              <button
                onClick={() => hapusBoard(b.id, b.name)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// =========================================================
// KOMPONEN KECIL
// =========================================================

function Baris({
  judul,
  catatan,
  children,
}: {
  judul: string;
  catatan?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4 first:border-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{judul}</div>
        {catatan && (
          <p className="text-xs text-muted-foreground mt-0.5">{catatan}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

function JamInput({
  nilai,
  onSimpan,
}: {
  nilai: string;
  onSimpan: (v: string) => void;
}) {
  const [teks, setTeks] = useState(nilai);

  // Nilai dari server bisa berubah (mis. sesudah muat ulang); input diselaraskan
  // tanpa mengganggu pengetikan karena hanya bereaksi pada perubahan prop.
  useEffect(() => setTeks(nilai), [nilai]);

  return (
    <input
      type="time"
      value={teks}
      onChange={(e) => setTeks(e.target.value)}
      onBlur={() => {
        if (teks !== nilai) onSimpan(teks);
      }}
      className="bg-secondary/60 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function AngkaInput({
  nilai,
  satuan,
  min,
  max,
  onSimpan,
}: {
  nilai: number;
  satuan: string;
  min: number;
  max: number;
  onSimpan: (v: number) => void;
}) {
  const [teks, setTeks] = useState(String(nilai));

  useEffect(() => setTeks(String(nilai)), [nilai]);

  return (
    <span className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        onBlur={() => {
          const n = Number(teks);

          if (!Number.isFinite(n) || n < min || n > max) {
            toast.error(`Harus ${min}–${max} ${satuan}`);
            setTeks(String(nilai));
            return;
          }

          if (n !== nilai) onSimpan(n);
        }}
        className="w-20 bg-secondary/60 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-xs text-muted-foreground">{satuan}</span>
    </span>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        value
          ? "border-primary text-primary bg-primary/10"
          : "border-border text-muted-foreground"
      }`}
    >
      <span
        className={`h-4 w-4 rounded grid place-items-center ${
          value ? "bg-primary" : "border border-border"
        }`}
      >
        {value && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>

      {label}
    </button>
  );
}
