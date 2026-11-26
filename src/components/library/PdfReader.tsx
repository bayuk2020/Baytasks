/* eslint-disable prettier/prettier */

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  Bookmark,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

/**
 * Pembaca PDF yang menggambar sendiri tiap halaman ke canvas.
 *
 * Sebelumnya PDF ditampilkan dengan <iframe src={file}>, artinya yang membaca
 * adalah viewer bawaan browser. Dari dalam aplikasi, isi iframe itu kotak
 * tertutup: kita tidak tahu sedang di halaman berapa, tidak bisa menyuruhnya
 * pindah halaman, dan tidak bisa menggambar apa pun di atasnya. Karena itu
 * animasi membalik halaman maupun coret-coret mustahil dibuat di sana.
 *
 * Dengan pdf.js, tiap halaman kita render sendiri jadi gambar. Begitu halaman
 * berupa gambar milik kita, membaliknya seperti lembar kertas hanya soal
 * memutarnya di sumbu Y.
 *
 * Catatan pemuatan: pdf.js HANYA boleh dimuat di browser. Aplikasi ini
 * dirender juga di server (TanStack Start), dan pdf.js menyentuh `window`
 * serta Worker begitu diimpor -- impornya karena itu dinamis, di dalam
 * useEffect.
 */

type Props = {
  /** Alamat PDF. Harus lewat rute API supaya header CORS ikut terpasang. */
  url: string;

  /** Halaman yang dibuka pertama kali (halaman terakhir dibaca). */
  halamanAwal: number;

  /** Nomor halaman yang sudah ditandai, untuk pita penanda di pojok. */
  halamanDitandai: number[];

  /** Dipanggil ketika pembaca berpindah halaman (sudah ditahan 1,2 detik). */
  onPindahHalaman: (halaman: number) => void;

  /** Dipanggil saat tombol penanda di pembaca ditekan. */
  onTandai: (halaman: number) => void;
};

type Arah = "maju" | "mundur";

export function PdfReader({
  url,
  halamanAwal,
  halamanDitandai,
  onPindahHalaman,
  onTandai,
}: Props) {
  const [jumlahHalaman, setJumlahHalaman] = useState(0);
  const [halaman, setHalaman] = useState(Math.max(1, halamanAwal || 1));
  const [gambar, setGambar] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string | null>(null);
  const [arah, setArah] = useState<Arah>("maju");

  const [zoom, setZoom] = useState(1.3);
  const [memuat, setMemuat] = useState(true);
  const [kemajuan, setKemajuan] = useState(0);
  const [galat, setGalat] = useState<string | null>(null);

  // Dokumen pdf.js disimpan di ref: ia bukan state tampilan, dan menaruhnya
  // di state akan memicu render ulang tiap kali dipakai.
  const dokumen = useRef<any>(null);
  const dibatalkan = useRef(false);

  // =========================================================
  // MEMUAT DOKUMEN
  // =========================================================

  useEffect(() => {
    dibatalkan.current = false;

    (async () => {
      try {
        setMemuat(true);
        setGalat(null);

        const pdfjs = await import("pdfjs-dist");

        // Worker dimuat sebagai URL terpisah; tanpa ini pdf.js menolak jalan.
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        // BERKASNYA DIUNDUH SEKALI, BUKAN SEPOTONG-SEPOTONG.
        //
        // Kalau pdf.js dibiarkan memakai permintaan Range, ia menembakkan
        // belasan permintaan kecil. Masalahnya `php artisan serve` melayani
        // SATU permintaan pada satu waktu -- jadi tiap potongan PDF ikut
        // mengantrekan seluruh API, dan aplikasi terasa membeku saat membaca
        // (terukur: panggilan API biasa melambat dari 150 ms jadi 5 detik).
        //
        // Satu unduhan penuh menahan server sekali saja, lalu semuanya
        // dikerjakan dari memori. Sekalian kita bisa menunjukkan kemajuannya.
        const res = await fetch(url, { cache: "force-cache" });

        if (!res.ok) {
          throw new Error(`Server menjawab HTTP ${res.status} saat mengambil PDF.`);
        }

        const total = Number(res.headers.get("content-length") ?? 0);
        const potongan: Uint8Array[] = [];
        let terunduh = 0;

        const reader = res.body?.getReader();

        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              potongan.push(value);
              terunduh += value.length;
              if (total > 0 && !dibatalkan.current) {
                setKemajuan(Math.round((terunduh / total) * 100));
              }
            }
          }
        }

        const data = new Uint8Array(terunduh);
        let posisi = 0;
        for (const p of potongan) {
          data.set(p, posisi);
          posisi += p.length;
        }

        if (dibatalkan.current) return;

        const doc = await pdfjs.getDocument({ data }).promise;

        if (dibatalkan.current) {
          doc.destroy();
          return;
        }

        dokumen.current = doc;
        setJumlahHalaman(doc.numPages);
        setHalaman((h) => Math.min(Math.max(1, h), doc.numPages));
      } catch (err) {
        console.error("PDF LOAD ERROR", err);
        if (!dibatalkan.current) {
          setGalat(err instanceof Error ? err.message : "PDF gagal dimuat.");
          setMemuat(false);
        }
      }
    })();

    return () => {
      dibatalkan.current = true;
      dokumen.current?.destroy?.();
      dokumen.current = null;
    };
  }, [url]);

  // =========================================================
  // MENGGAMBAR SATU HALAMAN
  // =========================================================

  const gambarHalaman = useCallback(
    async (nomor: number): Promise<string | null> => {
      const doc = dokumen.current;
      if (!doc) return null;

      const page = await doc.getPage(nomor);

      // devicePixelRatio dipakai supaya huruf tidak buram di layar tajam.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: zoom * dpr });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Disimpan sebagai gambar supaya halaman lama tetap utuh selama
      // animasi balik -- canvas-nya sendiri akan dipakai ulang halaman baru.
      return canvas.toDataURL("image/jpeg", 0.88);
    },
    [zoom],
  );

  useEffect(() => {
    if (!jumlahHalaman) return;

    let batal = false;

    (async () => {
      try {
        setMemuat(true);
        const hasil = await gambarHalaman(halaman);
        if (!batal && hasil) {
          setGambar(hasil);
          setMemuat(false);
        }
      } catch (err) {
        console.error("PDF RENDER ERROR", err);
        if (!batal) {
          setGalat("Halaman ini gagal digambar.");
          setMemuat(false);
        }
      }
    })();

    return () => {
      batal = true;
    };
  }, [halaman, jumlahHalaman, gambarHalaman]);

  // =========================================================
  // MELAPORKAN HALAMAN KE LUAR (ditahan dulu)
  // =========================================================

  // Callback disimpan di ref, dan efek di bawah TIDAK boleh bergantung
  // padanya.
  //
  // Induk memberikan fungsi anonim (`onPindahHalaman={(h) => ...}`), jadi
  // identitasnya berubah tiap kali induk render ulang. Kalau efek penyimpan
  // ikut bergantung pada identitas itu, rantainya berputar: simpan ->
  // store berubah -> induk render -> callback baru -> efek jalan lagi ->
  // simpan lagi. Terbukti: empat kali membalik halaman menghasilkan 54 baris
  // reading_sessions.
  const simpanRef = useRef(onPindahHalaman);

  useEffect(() => {
    simpanRef.current = onPindahHalaman;
  }, [onPindahHalaman]);

  const halamanTersimpan = useRef<number | null>(null);

  useEffect(() => {
    if (!jumlahHalaman) return;

    // Halaman yang sudah pernah disimpan tidak ditulis ulang.
    if (halamanTersimpan.current === halaman) return;

    // Ditahan 1,2 detik: membalik lima halaman berturut-turut seharusnya
    // menyimpan sekali, bukan lima kali.
    const id = window.setTimeout(() => {
      halamanTersimpan.current = halaman;
      simpanRef.current(halaman);
    }, 1200);

    return () => window.clearTimeout(id);
  }, [halaman, jumlahHalaman]);

  // =========================================================
  // NAVIGASI
  // =========================================================

  const pindah = useCallback(
    (tujuan: number) => {
      if (!jumlahHalaman) return;

      const aman = Math.min(Math.max(1, tujuan), jumlahHalaman);
      if (aman === halaman) return;

      setArah(aman > halaman ? "maju" : "mundur");
      setGambarLama(gambar);
      setHalaman(aman);
    },
    [gambar, halaman, jumlahHalaman],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Jangan bajak panah saat user sedang mengetik di kolom isian.
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") pindah(halaman + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") pindah(halaman - 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [halaman, pindah]);

  const ditandai = halamanDitandai.includes(halaman);

  // =========================================================
  // TAMPILAN
  // =========================================================

  if (galat) {
    return (
      <div className="rounded-xl border border-[color-mix(in_oklab,var(--priority-urgent)_35%,transparent)] bg-[color-mix(in_oklab,var(--priority-urgent)_10%,transparent)] p-4 text-sm">
        <p className="text-[var(--priority-urgent)] font-medium">PDF gagal dibuka</p>
        <p className="text-xs text-muted-foreground mt-1">{galat}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---------- KENDALI ---------- */}
      {/* Panah maju/mundur SENGAJA tidak ada di sini. Tempatnya di sisi kiri
          dan kanan halaman, sejajar mata saat membaca -- kalau di baris atas,
          tiap ganti halaman harus menggulir naik dulu. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm tabular-nums">
          {/* Pindah halaman hanya saat selesai mengetik (blur / Enter),
              BUKAN tiap ketikan. Dengan onChange, mengetik "12" sempat
              terbaca sebagai halaman 1 lebih dulu, dan tiap angka antara
              ikut tersimpan sebagai perpindahan halaman. */}
          <input
            type="number"
            defaultValue={halaman}
            key={halaman}
            min={1}
            max={jumlahHalaman || 1}
            onBlur={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) pindah(n);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            // Roda mouse di atas input angka diam-diam mengubah nilainya
            // kalau input sedang fokus -- sumber perpindahan halaman yang
            // tidak pernah diminta siapa pun.
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="w-16 rounded-lg bg-secondary/60 border border-border px-2 py-1.5 text-center outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">/ {jumlahHalaman || "…"}</span>
        </div>

        <button
          onClick={() => onTandai(halaman)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
            ditandai
              ? "border-[color-mix(in_oklab,var(--status-in-progress)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-in-progress)_16%,transparent)] text-[var(--status-in-progress)]"
              : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
          title={ditandai ? "Lepas penanda halaman ini" : "Tandai halaman ini"}
        >
          {ditandai ? <Bookmark className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
          {ditandai ? "Ditandai" : "Tandai"}
        </button>

        <span className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-accent"
            title="Perkecil"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-accent"
            title="Perbesar"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {/* ---------- LEMBAR + PANAH DI SISINYA ---------- */}
      {/* perspective memberi kedalaman; tanpa ini putaran di sumbu Y terlihat
          seperti gambar yang dipipihkan, bukan kertas yang dibalik.
          overflow dibiarkan visible supaya panah yang menempel (sticky) tidak
          terpotong saat halaman digulir. */}
      <div
        className="relative flex w-full items-stretch gap-1 rounded-xl bg-secondary/30 p-2 sm:gap-2 sm:p-3"
        style={{ perspective: "2200px" }}
      >
        <SisiPanah
          arah="mundur"
          onKlik={() => pindah(halaman - 1)}
          nonaktif={halaman <= 1}
        />

        <div className="relative mx-auto min-w-0 flex-1" style={{ transformStyle: "preserve-3d" }}>
          {gambar ? (
            <img
              src={gambar}
              alt={`Halaman ${halaman}`}
              className="mx-auto block w-full max-w-3xl rounded-lg shadow-lg"
            />
          ) : (
            <div className="mx-auto grid h-[600px] w-full max-w-3xl place-items-center gap-3 rounded-lg bg-secondary/40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

              {kemajuan > 0 && kemajuan < 100 && (
                <div className="w-48 text-center">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-[var(--neon)] transition-all"
                      style={{ width: `${kemajuan}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Mengunduh PDF {kemajuan}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lembar yang sedang dibalik: gambar halaman LAMA, diputar menjauh
              dari sisi sesuai arah. Setelah selesai ia dibuang, menyisakan
              halaman baru yang sudah ada di bawahnya. */}
          <AnimatePresence
            onExitComplete={() => setGambarLama(null)}
          >
            {gambarLama && (
              <motion.img
                key={gambarLama.slice(-24)}
                src={gambarLama}
                alt=""
                aria-hidden
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 0 }}
                exit={{
                  rotateY: arah === "maju" ? -165 : 165,
                  transition: { duration: 0.55, ease: [0.4, 0.0, 0.2, 1] },
                }}
                onAnimationComplete={() => setGambarLama(null)}
                style={{
                  transformOrigin: arah === "maju" ? "left center" : "right center",
                  backfaceVisibility: "hidden",
                }}
                className="absolute inset-0 mx-auto block w-full max-w-3xl rounded-lg shadow-2xl"
              />
            )}
          </AnimatePresence>
        </div>

        <SisiPanah
          arah="maju"
          onKlik={() => pindah(halaman + 1)}
          nonaktif={!jumlahHalaman || halaman >= jumlahHalaman}
        />

        {memuat && gambar && (
          <div className="absolute right-14 top-4 rounded-full bg-background/80 p-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Panah di kiri/kanan halaman, atau tombol panah di keyboard. Halaman
        terakhir yang kamu buka tersimpan otomatis.
      </p>
    </div>
  );
}

/**
 * Panah pembalik halaman yang duduk di sisi kiri/kanan lembar.
 *
 * `sticky` dengan patokan 45vh membuatnya tetap sejajar mata selama halaman
 * digulir: halaman PDF jauh lebih tinggi dari layar, dan kalau panahnya ikut
 * tergulir ke atas, tiap ganti halaman harus menggulir balik dulu.
 *
 * Ia berhenti menempel sendiri begitu seluruh pembaca lewat dari layar --
 * itu sifat bawaan sticky, dan di sini justru yang diinginkan: panah tidak
 * mengambang di atas bagian halaman lain.
 */
function SisiPanah({
  arah,
  onKlik,
  nonaktif,
}: {
  arah: "maju" | "mundur";
  onKlik: () => void;
  nonaktif: boolean;
}) {
  const Ikon = arah === "maju" ? ChevronRight : ChevronLeft;

  return (
    <div className="flex w-9 shrink-0 justify-center sm:w-12">
      <button
        onClick={onKlik}
        disabled={nonaktif}
        title={
          arah === "maju"
            ? "Halaman berikutnya (panah kanan)"
            : "Halaman sebelumnya (panah kiri)"
        }
        aria-label={arah === "maju" ? "Halaman berikutnya" : "Halaman sebelumnya"}
        style={{ top: "45vh" }}
        className="sticky grid h-11 w-9 shrink-0 place-items-center self-start rounded-xl border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30 sm:h-14 sm:w-12"
      >
        <Ikon className="h-5 w-5" />
      </button>
    </div>
  );
}
