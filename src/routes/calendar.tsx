import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useStore,
} from "@/lib/store";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ListTree,
  EyeOff,
  Plus,
  Flag,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

import {
  TaskModal,
} from "@/components/TaskModal";

import {
  motion,
} from "framer-motion";

import {
  memoryApi,
  activityLogApi,
  type Memory,
  type TaskStatus,
  type ActivityTask,
} from "@/lib/api";

import {
  exportActivityPdf,
  exportActivityExcel,
} from "@/lib/activityReport";

import {
  STATUS_META,
  statusMeta,
} from "@/lib/statusMeta";

// Format tanggal LOKAL (bukan toISOString() yang UTC -- bisa geser tanggal
// kalau timezone user di belakang UTC) untuk dikirim sebagai query ?date=.
const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const Route =
  createFileRoute(
    "/calendar"
  )({

    head: () => ({

      meta: [
        {
          title:
            "Calendar — BayTasks",
        },
      ],
    }),

    component:
      CalendarPage,
  });

function CalendarPage() {

  // Grid & tabel di halaman ini menampilkan task dari SEMUA board -- jadi
  // `activeBoardId` TIDAK dipakai untuk memfilter. Ia hanya dipakai untuk
  // memberi tahu tombol "Tambah Task" akan menaruh task barunya di board
  // mana (TaskModal selalu membuat task di board yang sedang aktif).
  const { tasks, loadTasks, boards, activeBoardId } = useStore();

  const activeBoardName =
    boards.find((b) => b.id === activeBoardId)?.name ?? "board aktif";

  // BUG LAMA: halaman ini tidak pernah memuat task sendiri, jadi kalau
  // /calendar dibuka langsung (refresh / masuk dari URL), store masih kosong
  // dan grid tampil tanpa satu pun task.
  useEffect(() => {
    loadTasks();
  }, []);

  const [
    cursor,
    setCursor,
  ] = useState(() => {

    const d =
      new Date();

    d.setDate(1);

    return d;
  });

  const [
    openId,
    setOpenId,
  ] = useState<
    string | null
  >(null);

  // Mode "buat task baru" di TaskModal (tanpa taskId).
  const [creating, setCreating] = useState(false);

  // =========================
  // DAILY LOG / TIMELINE (Memories)
  // =========================

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);

  // Dinaikkan setiap TaskModal ditutup. Daily Log & tabel Activity Log
  // mengambil datanya sendiri dari API (bukan dari store zustand), jadi tanpa
  // pemicu ini task yang baru dibuat/diedit lewat modal tidak akan muncul
  // sampai halaman di-refresh manual.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadingMemories(true);

    memoryApi
      .getAll({ date: toLocalDateStr(selectedDate) })
      .then((data) => {
        if (!cancelled) setMemories(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (!cancelled) setLoadingMemories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, refreshKey]);

  // =========================
  // ACTIVITY LOG (Task/Subtask lintas board -- terpisah dari Daily Log
  // di atas, tapi sumbernya sama-sama perubahan Task, jadi keduanya
  // saling melengkapi)
  // =========================

  // Rentang default: bulan berjalan.
  const [rangeFrom, setRangeFrom] = useState(() =>
    toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  );
  const [rangeTo, setRangeTo] = useState(() =>
    toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
  );
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [activityTasks, setActivityTasks] = useState<ActivityTask[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingActivity(true);

    activityLogApi
      .list({ from: rangeFrom, to: rangeTo, statuses: statusFilter })
      .then((res) => {
        if (!cancelled) setActivityTasks(res.tasks);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rangeFrom, rangeTo, statusFilter, refreshKey]);

  const toggleStatus = (s: TaskStatus) =>
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  /**
   * Satu-satunya pintu untuk mengganti tanggal terpilih.
   *
   * Selain memindahkan Daily Log, ia juga MENYEMPITKAN rentang Activity Log
   * ke tanggal itu. Sebelumnya cuma Daily Log yang ikut berpindah, jadi
   * mengklik satu tanggal menghasilkan dua panel yang bicara tentang hari
   * yang berbeda -- kalender menyorot 20 November, Activity Log tetap
   * menampilkan sebulan penuh.
   *
   * Rentangnya tetap bisa dilebarkan lagi lewat kolom tanggal atau tombol
   * preset di Activity Log; yang diatur di sini hanya titik awalnya.
   */
  const pilihTanggal = (d: Date) => {
    setSelectedDate(d);

    const teks = toLocalDateStr(d);

    setRangeFrom(teks);
    setRangeTo(teks);
  };

  /** Rentang Activity Log sedang menunjuk tepat satu hari? */
  const rentangSatuHari = rangeFrom === rangeTo;

  // Tombol pintas yang MENGISI kolom tanggal (bukan menggantikannya) --
  // rentangnya tetap terbaca jelas di input, itu yang bikin lebih informatif
  // ketimbang preset buta.
  const applyPreset = (preset: "month" | "last_month" | "year" | "last_year" | "7d" | "30d") => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last_month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "year":
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      case "last_year":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "7d":
        from = new Date(now);
        from.setDate(now.getDate() - 6);
        to = now;
        break;
      case "30d":
        from = new Date(now);
        from.setDate(now.getDate() - 29);
        to = now;
        break;
    }

    setRangeFrom(toLocalDateStr(from));
    setRangeTo(toLocalDateStr(to));
  };

  // STATUS_META sekarang diimpor dari @/lib/statusMeta supaya kartu di
  // kalender, chip filter, dan tabel Activity Log memakai warna yang sama
  // persis -- dan supaya warnanya ikut berganti di tema terang.

  const PRESETS: { id: Parameters<typeof applyPreset>[0]; label: string }[] = [
    { id: "7d", label: "7 hari" },
    { id: "30d", label: "30 hari" },
    { id: "month", label: "Bulan ini" },
    { id: "last_month", label: "Bulan lalu" },
    { id: "year", label: "Tahun ini" },
    { id: "last_year", label: "Tahun lalu" },
  ];

  // =========================
  // CALENDAR CELLS
  // =========================

  const cells =
    useMemo(() => {

      const first =
        new Date(
          cursor
        );

      first.setDate(1);

      const startWeekday =
        first.getDay();

      const daysInMonth =
        new Date(

          cursor.getFullYear(),

          cursor.getMonth() + 1,

          0
        ).getDate();

      const cells:
        {
          date:
            Date | null;
        }[] = [];

      for (
        let i = 0;
        i < startWeekday;
        i++
      ) {

        cells.push({
          date: null,
        });
      }

      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        cells.push({

          date:
            new Date(

              cursor.getFullYear(),

              cursor.getMonth(),

              d
            ),
        });
      }

      while (
        cells.length % 7
      ) {

        cells.push({
          date: null,
        });
      }

      return cells;

    }, [cursor]);

  // =========================
  // TASKS BY DAY
  // =========================

  // Tiap sel kalender bisa menampung dua jenis penanda untuk task yang sama:
  //  - "created": tanggal task DIBUAT (abu-abu, penanda lingkaran kosong)
  //  - "due"    : tanggal DEADLINE (berwarna sesuai prioritas / merah kalau lewat)
  // Lintas SEMUA board, bukan cuma board yang sedang aktif.
  type DayMarker = { task: (typeof tasks)[number]; kind: "created" | "due" };

  const markersByDay = useMemo(() => {
    const m = new Map<string, DayMarker[]>();

    const push = (key: string, marker: DayMarker) => {
      const arr = m.get(key) ?? [];
      arr.push(marker);
      m.set(key, arr);
    };

    for (const t of tasks) {
      if (t.createdAt) {
        push(new Date(t.createdAt).toDateString(), { task: t, kind: "created" });
      }
      if (t.dueAt) {
        push(new Date(t.dueAt).toDateString(), { task: t, kind: "due" });
      }
    }

    // Deadline ditaruh di atas dalam satu sel -- itu yang lebih mendesak
    // dilihat ketimbang "hari ini aku bikin task apa".
    for (const arr of m.values()) {
      arr.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "due" ? -1 : 1));
    }

    return m;
  }, [tasks]);

  // =========================
  // MONTH LABEL
  // =========================

  const monthLabel =
    cursor.toLocaleString(

      undefined,

      {
        month:
          "long",

        year:
          "numeric",
      }
    );

  // Dulu di sini ada priorityClass() yang mewarnai kartu kalender menurut
  // PRIORITAS. Sudah dihapus: kartu sekarang diwarnai menurut STATUS (lihat
  // @/lib/statusMeta), dan prioritas tetap terbaca lewat tooltip kartu serta
  // kolom Prioritas di tabel Activity Log. Kelasnya juga memakai palet
  // Tailwind mati seperti `text-cyan-100` / `text-red-200` yang hampir tidak
  // terlihat di tema terang.

  return (

    <div className="space-y-6">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <motion.header

        initial={{
          opacity: 0,
          y: 10,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        className="
          relative

          overflow-hidden

          rounded-3xl

          border
          border-cyan-500/10

          bg-gradient-to-br
          from-cyan-500/[0.04]
          via-background
          to-blue-500/[0.03]

          p-6

          shadow-[0_0_50px_rgba(34,211,238,0.06)]
        "
      >

        {/* AURA */}
        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_35%)]

            pointer-events-none
          "
        />

        <div className="relative z-10 flex items-center justify-between">

          {/* LEFT */}
          <div>

            <div className="flex items-center gap-2">

              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight

                  heading-gradient
                "
              >
                {monthLabel}
              </h1>

              <Sparkles
                className="
                  h-5
                  w-5
                  text-[var(--neon)]
                "
              />

            </div>

            <p
              className="
                text-sm
                text-muted-foreground
                mt-1
              "
            >
              Visualize deadlines,
              priorities,
              and productivity flow.
            </p>

          </div>

          {/* RIGHT */}
          <div className="flex gap-2">

            <button

              onClick={() =>

                setCursor(

                  new Date(

                    cursor.getFullYear(),

                    cursor.getMonth() - 1,

                    1
                  )
                )
              }

              className="
                h-10
                w-10

                grid
                place-items-center

                rounded-xl

                border
                border-border

                bg-secondary/40

                hover:border-[color-mix(in_oklab,var(--neon)_35%,transparent)]
                hover:bg-[var(--neon-soft)]

                transition
              "
            >

              <ChevronLeft
                className="
                  h-4
                  w-4
                "
              />

            </button>

            <button

              onClick={() => {

                const d =
                  new Date();

                d.setDate(1);

                setCursor(d);
              }}

              className="
                px-4

                rounded-xl

                border
                border-[color-mix(in_oklab,var(--neon)_35%,transparent)]

                bg-[var(--neon-soft)]

                text-[var(--neon)]
                text-sm

                hover:bg-[color-mix(in_oklab,var(--neon)_18%,transparent)]

                transition
              "
            >
              Today
            </button>

            <button

              onClick={() =>

                setCursor(

                  new Date(

                    cursor.getFullYear(),

                    cursor.getMonth() + 1,

                    1
                  )
                )
              }

              className="
                h-10
                w-10

                grid
                place-items-center

                rounded-xl

                border
                border-border

                bg-secondary/40

                hover:border-[color-mix(in_oklab,var(--neon)_35%,transparent)]
                hover:bg-[var(--neon-soft)]

                transition
              "
            >

              <ChevronRight
                className="
                  h-4
                  w-4
                "
              />

            </button>
          </div>
        </div>
      </motion.header>

      {/* ========================= */}
      {/* CALENDAR */}
      {/* ========================= */}

      <motion.div

        initial={{
          opacity: 0,
        }}

        animate={{
          opacity: 1,
        }}

        className="
          glass

          rounded-3xl

          p-4

          border
          border-border/40
        "
      >

        {/* DAYS */}
        <div
          className="
            grid
            grid-cols-7

            text-[10px]
            uppercase

            tracking-[0.18em]

            text-muted-foreground

            mb-3
            px-1
          "
        >

          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((d) => (

            <div
              key={d}
              className="py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-7

            gap-2
          "
        >

          {cells.map((c, i) => {

            const today =

              c.date &&

              c.date.toDateString() ===

                new Date()
                  .toDateString();

            const isSelected =

              c.date &&

              c.date.toDateString() ===
                selectedDate.toDateString();

            const items =

              c.date

                ? markersByDay.get(
                    c.date.toDateString()
                  ) ?? []

                : [];

            return (

              <motion.div

                whileHover={{
                  y: -2,
                }}

                key={i}

                onClick={() => {
                  // pilihTanggal, bukan setSelectedDate: Activity Log di
                  // bawah ikut menyempit ke tanggal yang diklik.
                  if (c.date) pilihTanggal(c.date);
                }}

                className={`
                  min-h-[120px]

                  rounded-2xl

                  p-2.5

                  border

                  transition-all

                  ${c.date ? "cursor-pointer" : ""}

                  ${isSelected ? "ring-2 ring-cyan-400/60" : ""}

                  ${
                    c.date

                      ? today

                        ? `
                          border-cyan-400/40
                          bg-cyan-500/[0.06]

                          shadow-[0_0_30px_rgba(34,211,238,0.08)]
                        `

                        : `
                          border-border
                          bg-secondary/20

                          hover:border-cyan-400/20
                          hover:bg-cyan-500/[0.03]
                        `

                      : "border-transparent"
                  }
                `}
              >

                {c.date && (

                  <>

                    {/* DATE */}
                    <div
                      className={`
                        text-xs

                        ${
                          today

                            ? `
                              text-[var(--neon)]
                              font-semibold
                            `

                            : `
                              text-muted-foreground
                            `
                        }
                      `}
                    >
                      {c.date.getDate()}
                    </div>

                    {/* TASKS */}
                    <div
                      className="
                        mt-2

                        space-y-1.5
                      "
                    >

                      {items
                        .slice(0, 3)
                        .map(({ task: t, kind }) => {

                          const overdue = t.dueAt && t.dueAt < Date.now() && t.column !== "done";

                          // Warna kartu = STATUS task, bukan prioritas.
                          // Sebelumnya penanda "dibuat" selalu abu-abu dan
                          // penanda "deadline" diwarnai menurut prioritas,
                          // jadi tidak ada cara membedakan task yang sudah
                          // selesai dari yang belum disentuh.
                          const st = statusMeta(t.column);

                          return (

                            <button

                              key={`${t.id}-${kind}`}

                              onClick={(e) => {
                                // Jangan sampai klik kartu ikut memindahkan
                                // tanggal terpilih di sel induknya.
                                e.stopPropagation();
                                setOpenId(t.id);
                              }}

                              title={
                                `${kind === "created" ? "Dibuat" : "Deadline"}: ${t.title}` +
                                `\nStatus: ${st.label}` +
                                (t.priority ? `\nPrioritas: ${t.priority}` : "") +
                                (overdue ? "\nSudah lewat jatuh tempo" : "")
                              }

                              className={`
                                flex
                                items-center
                                gap-1

                                w-full

                                text-left

                                text-[11px]

                                rounded-lg

                                border

                                px-2
                                py-1

                                transition-all

                                hover:scale-[1.02]

                                ${st.pill}

                                ${
                                  /* Dua jenis penanda dibedakan oleh BENTUK
                                     garis, bukan warna, supaya warna tetap
                                     bebas dipakai untuk status: garis putus
                                     = tanggal dibuat, garis utuh = deadline. */
                                  kind === "created"
                                    ? "border-dashed"
                                    : ""
                                }

                                ${
                                  /* Lewat jatuh tempo ditandai cincin merah,
                                     BUKAN dengan menimpa warna status --
                                     kalau ditimpa, statusnya ikut hilang. */
                                  overdue
                                    ? "ring-1 ring-[color-mix(in_oklab,var(--priority-urgent)_60%,transparent)]"
                                    : ""
                                }
                              `}
                            >
                              {kind === "created" ? (
                                <Plus className="h-2.5 w-2.5 shrink-0 opacity-70" />
                              ) : (
                                <Flag className="h-2.5 w-2.5 shrink-0 opacity-70" />
                              )}
                              <span className="truncate">{t.title}</span>
                            </button>
                          );
                        })}

                      {items.length > 3 && (

                        <div
                          className="
                            text-[10px]
                            text-muted-foreground
                            px-1
                          "
                        >
                          +
                          {
                            items.length - 3
                          }{" "}
                          more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* LEGENDA
            Dua hal yang perlu dijelaskan dan gampang tertukar:
            WARNA menandakan status, BENTUK GARIS menandakan jenis penanda. */}
        <div className="mt-4 space-y-2 px-1 text-[11px] text-muted-foreground">

          {/* Warna = status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="uppercase tracking-wider opacity-70 mr-1">Status</span>

            {STATUS_META.map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 ${s.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </span>
            ))}
          </div>

          {/* Bentuk garis = jenis penanda */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/50 px-1.5 py-0.5">
                <Plus className="h-2.5 w-2.5 opacity-70" />
              </span>
              Garis putus = tanggal task dibuat
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-muted-foreground/50 px-1.5 py-0.5">
                <Flag className="h-2.5 w-2.5 opacity-70" />
              </span>
              Garis utuh = deadline
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-muted-foreground/30 px-1.5 py-0.5 ring-1 ring-[color-mix(in_oklab,var(--priority-urgent)_60%,transparent)]">
                <Flag className="h-2.5 w-2.5 opacity-70" />
              </span>
              Cincin merah = lewat jatuh tempo
            </span>

            <span className="ml-auto">Semua board</span>
          </div>
        </div>
      </motion.div>

      {/* ========================= */}
      {/* ACTIVITY LOG -- daftar task yang pernah dibuat, lintas semua board */}
      {/* ========================= */}
      {/* Letaknya SENGAJA tepat di bawah kalender, di atas Daily Log: isinya
          task, sama seperti kalender di atasnya, jadi keduanya terbaca sebagai
          satu kesatuan. Daily Log (catatan memori) turun ke paling bawah. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-border/40"
      >
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListTree className="h-4 w-4 text-[var(--status-review)]" />
              <h2 className="text-sm font-semibold tracking-tight">Activity Log</h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Task yang kamu buat pada rentang tanggal ini — semua board, termasuk yang
              sudah selesai maupun disembunyikan dari papan.
            </p>

            {/* Kalau rentangnya tepat satu hari, hampir pasti karena tanggal
                itu baru diklik di kalender. Dikatakan terang-terangan supaya
                tidak terlihat seperti datanya tiba-tiba hilang. */}
            {rentangSatuHari && (
              <p className="text-[11px] text-[var(--neon)] mt-1">
                Mengikuti tanggal yang dipilih di kalender. Pakai tombol preset di
                bawah untuk melihat rentang yang lebih lebar.
              </p>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground">
            {loadingActivity ? "…" : `${activityTasks.length} task`}
          </div>
        </div>

        {/* FILTER: rentang tanggal */}
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dari tanggal dibuat
            </span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sampai
            </span>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-violet-400/30 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* FILTER: status */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
            Status
          </span>
          {STATUS_META.map((s) => {
            const active = statusFilter.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleStatus(s.id)}
                // Chip yang aktif memakai warna statusnya sendiri, jadi
                // filter yang menyala langsung cocok dengan warna kartu di
                // kalender. Warna lamanya (ungu untuk SEMUA status, dengan
                // teks violet-100) tidak memberi petunjuk apa-apa dan nyaris
                // tidak terbaca di tema terang.
                className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  active
                    ? s.pill
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            );
          })}
          {statusFilter.length > 0 && (
            <button
              onClick={() => setStatusFilter([])}
              className="text-[11px] px-2 py-1 text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              reset
            </button>
          )}
          {statusFilter.length === 0 && (
            <span className="text-[10px] text-muted-foreground">(semua status)</span>
          )}

          {/* AKSI -- didorong ke ujung kanan baris filter */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Export mengikuti PERSIS data yang sedang tampil di tabel,
                jadi apa pun yang difilter user itulah isi laporannya. */}
            <button
              onClick={() =>
                exportActivityPdf(activityTasks, {
                  from: rangeFrom,
                  to: rangeTo,
                  statuses: statusFilter,
                })
              }
              disabled={loadingActivity || activityTasks.length === 0}
              title="Unduh laporan PDF sesuai filter di atas"
              // Warnanya diambil dari variabel tema, bukan palet Tailwind.
              // `text-rose-100` di atas latar rose-500/10 bagus di tema gelap
              // tapi rasio kontrasnya cuma 2,4:1 di tema terang -- tulisannya
              // praktis hilang. Variabel ini punya nilai sendiri untuk terang.
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-[color-mix(in_oklab,var(--priority-urgent)_38%,transparent)] bg-[color-mix(in_oklab,var(--priority-urgent)_14%,transparent)] text-[var(--priority-urgent)] hover:bg-[color-mix(in_oklab,var(--priority-urgent)_24%,transparent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </button>

            <button
              onClick={() =>
                exportActivityExcel(activityTasks, {
                  from: rangeFrom,
                  to: rangeTo,
                  statuses: statusFilter,
                })
              }
              disabled={loadingActivity || activityTasks.length === 0}
              title="Unduh laporan Excel sesuai filter di atas"
              // Sama seperti tombol PDF: `text-emerald-100` hanya 1,6:1 di
              // tema terang. Hijau "selesai" dipakai ulang di sini karena
              // sudah punya versi terang maupun gelap.
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-done)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-done)_14%,transparent)] text-[var(--status-done)] hover:bg-[color-mix(in_oklab,var(--status-done)_24%,transparent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>

            <button
              onClick={() => setCreating(true)}
              title={`Task baru akan masuk ke board "${activeBoardName}"`}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-[color-mix(in_oklab,var(--neon)_35%,transparent)] bg-[color-mix(in_oklab,var(--neon)_14%,transparent)] text-[var(--neon)] hover:bg-[color-mix(in_oklab,var(--neon)_24%,transparent)] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Task
            </button>
          </div>
        </div>

        {loadingActivity ? (
          <div className="text-center text-sm text-muted-foreground py-8">Memuat daftar task…</div>
        ) : activityTasks.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Tidak ada task yang dibuat pada rentang ini.
          </div>
        ) : (
          // Tabel dibungkus overflow-x sendiri supaya di layar sempit dia yang
          // menggeser, bukan seluruh halaman melar ke samping.
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Task</th>
                  <th className="py-2 px-3 font-medium">Board</th>
                  <th className="py-2 px-3 font-medium">Dibuat</th>
                  <th className="py-2 px-3 font-medium">Deadline</th>
                  <th className="py-2 px-3 font-medium">Subtask</th>
                  <th className="py-2 pl-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activityTasks.map((t) => {
                  const meta = STATUS_META.find((s) => s.id === t.column);
                  const overdue =
                    t.dueAt && t.dueAt < Date.now() && t.column !== "done";

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setOpenId(String(t.id))}
                      className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/30 transition"
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          {t.hidden && (
                            <EyeOff
                              className="h-3 w-3 shrink-0 text-muted-foreground"
                              aria-label="Disembunyikan dari papan"
                            />
                          )}
                          <span className={t.column === "done" ? "text-muted-foreground" : ""}>
                            {t.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        {t.boardEmoji} {t.boardName}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td
                        className={`py-2 px-3 whitespace-nowrap text-xs ${
                          overdue ? "text-[var(--priority-urgent)]" : "text-muted-foreground"
                        }`}
                      >
                        {t.dueAt
                          ? new Date(t.dueAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {t.subtaskTotal > 0 ? `${t.subtaskDone}/${t.subtaskTotal}` : "—"}
                      </td>
                      <td className="py-2 pl-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border border-border bg-secondary/50">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
                          {meta?.label ?? t.column}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ========================= */}
      {/* DAILY LOG / TIMELINE (Memories) */}
      {/* ========================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-border/40"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--neon)]" />
            <h2 className="text-sm font-semibold tracking-tight">
              Daily Log —{" "}
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          {selectedDate.toDateString() !== new Date().toDateString() && (
            <button
              onClick={() => pilihTanggal(new Date())}
              className="text-xs text-[var(--neon)] hover:brightness-110 transition"
            >
              Kembali ke hari ini
            </button>
          )}
        </div>

        {loadingMemories ? (
          <div className="text-center text-sm text-muted-foreground py-8">Memuat aktivitas…</div>
        ) : memories.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Belum ada aktivitas tercatat di tanggal ini.
          </div>
        ) : (
          <ol className="relative border-l border-border pl-5 space-y-5">
            {memories.map((m) => (
              <li key={m.id} className="relative">
                {/* Titik timeline memakai warna tema, bukan bg-cyan-400 mati:
                    cyan-400 pucat nyaris tak terlihat di latar terang. */}
                <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-[var(--neon)] shadow-[0_0_10px_color-mix(in_oklab,var(--neon)_60%,transparent)]" />
                <div className="text-[11px] text-muted-foreground">
                  {m.occurredAt
                    ? new Date(m.occurredAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
                <div className="text-sm font-medium mt-0.5">{m.title}</div>
                {m.content && m.content !== m.title && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {m.content}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </motion.div>

      {/* ========================= */}
      {/* TASK MODAL */}
      {/* ========================= */}

      {(openId || creating) && (

        <TaskModal

          taskId={openId ?? undefined}

          // Task baru dari halaman ini default-nya masuk kolom "To Do";
          // kolomnya masih bisa diganti di dropdown Status dalam modal.
          createInColumn={creating ? "todo" : undefined}

          onClose={() => {
            setOpenId(null);
            setCreating(false);
            // Daily Log & tabel Activity Log menarik datanya sendiri dari
            // API, jadi harus dipicu ulang supaya perubahan langsung terlihat.
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}