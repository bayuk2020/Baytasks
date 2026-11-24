/* eslint-disable prettier/prettier */

import { useCallback, useEffect, useState } from "react";

import { Bookmark, BookmarkPlus, Check, Loader2, Trash2, X } from "lucide-react";

import { toast } from "sonner";

import { bookmarkApi, type BookBookmark } from "@/lib/api";

import { BOOKMARK_COLORS, bookmarkColor } from "@/lib/bookmarkColors";

/**
 * Pita penanda halaman sebuah buku.
 *
 * Komponen ini mengambil datanya sendiri dari API, bukan dari store zustand,
 * mengikuti pola Daily Log di halaman Calendar: penanda jarang berubah dan
 * hanya dipakai di layar ini, jadi tidak perlu ikut membebani store global.
 */
export function BookmarkPanel({
  bookId,
  currentPage,
  totalPages,
  onJump,
  onDaftarBerubah,
  tandaiRef,
}: {
  bookId: string;
  currentPage: number;
  totalPages: number;
  /** Dipanggil saat user mengetuk sebuah penanda: pindah ke halaman itu. */
  onJump: (page: number) => void;

  /**
   * Daftar nomor halaman yang ditandai, dikabarkan tiap kali berubah.
   * Dipakai pembaca PDF untuk menyalakan tombol penandanya sendiri tanpa
   * perlu mengambil data yang sama dua kali.
   */
  onDaftarBerubah?: (halaman: number[]) => void;

  /**
   * Celah kecil supaya pembaca PDF bisa menyalakan/mematikan penanda lewat
   * panel ini. Tanpa ini keduanya akan punya salinan daftar sendiri dan
   * gampang berbeda setelah satu klik.
   */
  tandaiRef?: { current: ((halaman: number) => void) | null };
}) {
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [sibuk, setSibuk] = useState(false);

  const [sedangDiubah, setSedangDiubah] = useState<number | null>(null);
  const [labelDraf, setLabelDraf] = useState("");

  const muat = useCallback(async () => {
    try {
      const data = await bookmarkApi.list(bookId);
      setBookmarks(data.bookmarks ?? []);
    } catch (err) {
      console.error("LOAD BOOKMARKS ERROR", err);
    } finally {
      setMemuat(false);
    }
  }, [bookId]);

  useEffect(() => {
    muat();
  }, [muat]);

  // Setiap perubahan daftar dikabarkan ke atas, jadi pembaca PDF selalu
  // melihat daftar yang sama persis dengan panel ini.
  useEffect(() => {
    onDaftarBerubah?.(bookmarks.map((b) => b.page_number));
  }, [bookmarks, onDaftarBerubah]);

  const halamanIniDitandai = bookmarks.some((b) => b.page_number === currentPage);

  const tandaiHalaman = useCallback(
    async (halaman: number) => {
      if (halaman < 1) {
        toast.error("Buka dulu halaman yang mau ditandai.");
        return;
      }

      setSibuk(true);

      try {
        const hasil = await bookmarkApi.toggle(bookId, { page_number: halaman });

        toast.success(
          hasil.action === "ditambah"
            ? `Halaman ${halaman} ditandai`
            : `Penanda halaman ${halaman} dilepas`,
        );

        await muat();
      } catch (err) {
        console.error("TOGGLE BOOKMARK ERROR", err);
        toast.error(pesanGalat(err) ?? "Gagal mengubah penanda");
      } finally {
        setSibuk(false);
      }
    },
    [bookId, muat],
  );

  // Pembaca PDF memanggil fungsi yang SAMA, bukan salinannya.
  useEffect(() => {
    if (!tandaiRef) return;

    tandaiRef.current = tandaiHalaman;

    return () => {
      tandaiRef.current = null;
    };
  }, [tandaiRef, tandaiHalaman]);

  const tandaiHalamanIni = () => tandaiHalaman(currentPage);

  const hapus = async (b: BookBookmark) => {
    try {
      await bookmarkApi.remove(b.id);
      setBookmarks((lama) => lama.filter((x) => x.id !== b.id));
      toast.success(`Penanda halaman ${b.page_number} dihapus`);
    } catch {
      toast.error("Gagal menghapus penanda");
    }
  };

  const simpanLabel = async (b: BookBookmark) => {
    const label = labelDraf.trim();

    setSedangDiubah(null);

    if (label === (b.label ?? "")) return;

    try {
      await bookmarkApi.update(b.id, { label });
      setBookmarks((lama) =>
        lama.map((x) => (x.id === b.id ? { ...x, label: label || null } : x)),
      );
    } catch {
      toast.error("Gagal menyimpan catatan penanda");
    }
  };

  const gantiWarna = async (b: BookBookmark, warna: string) => {
    // Tampilan diperbarui dulu supaya pilihan warna terasa langsung.
    setBookmarks((lama) => lama.map((x) => (x.id === b.id ? { ...x, color: warna } : x)));

    try {
      await bookmarkApi.update(b.id, { color: warna });
    } catch {
      toast.error("Gagal mengganti warna");
      await muat();
    }
  };

  return (
    <section className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[var(--status-in-progress)]" />
            Penanda halaman
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tandai halaman yang mau kamu datangi lagi. Ketuk penandanya untuk
            melompat ke sana.
          </p>
        </div>

        <span className="text-[11px] text-muted-foreground shrink-0">
          {memuat ? "…" : `${bookmarks.length}`}
        </span>
      </div>

      <button
        onClick={tandaiHalamanIni}
        disabled={sibuk}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50 ${
          halamanIniDitandai
            ? "border-[color-mix(in_oklab,var(--status-in-progress)_38%,transparent)] bg-[color-mix(in_oklab,var(--status-in-progress)_16%,transparent)] text-[var(--status-in-progress)]"
            : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
        }`}
      >
        {sibuk ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : halamanIniDitandai ? (
          <Check className="h-4 w-4" />
        ) : (
          <BookmarkPlus className="h-4 w-4" />
        )}

        {halamanIniDitandai
          ? `Halaman ${currentPage} sudah ditandai`
          : `Tandai halaman ${currentPage || "—"}`}
      </button>

      {memuat ? (
        <div className="text-center text-xs text-muted-foreground py-4">Memuat penanda…</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          Belum ada penanda di buku ini.
        </div>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((b) => {
            const warna = bookmarkColor(b.color);
            const sedangDibaca = b.page_number === currentPage;

            return (
              <li
                key={b.id}
                className={`rounded-xl border px-3 py-2 ${warna.pita} ${
                  sedangDibaca ? "ring-1 ring-[var(--neon)]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onJump(b.page_number)}
                    title={`Lompat ke halaman ${b.page_number}`}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium tabular-nums ${warna.teks}`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    Hal {b.page_number}
                  </button>

                  {totalPages > 1 && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {Math.round((b.page_number / totalPages) * 100)}%
                    </span>
                  )}

                  <span className="ml-auto flex items-center gap-1">
                    {BOOKMARK_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => gantiWarna(b, c.id)}
                        title={c.label}
                        aria-label={`Warna ${c.label}`}
                        className={`h-3 w-3 rounded-full ${c.titik} ${
                          (b.color ?? "amber") === c.id
                            ? "ring-2 ring-offset-1 ring-offset-transparent ring-[var(--neon)]"
                            : "opacity-50 hover:opacity-100"
                        }`}
                      />
                    ))}

                    <button
                      onClick={() => hapus(b)}
                      title="Hapus penanda"
                      className="ml-1 text-muted-foreground hover:text-[var(--priority-urgent)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>

                {sedangDiubah === b.id ? (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={labelDraf}
                      onChange={(e) => setLabelDraf(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") simpanLabel(b);
                        if (e.key === "Escape") setSedangDiubah(null);
                      }}
                      placeholder="Catatan singkat, mis. bab tentang aset"
                      className="flex-1 min-w-0 rounded-md bg-secondary/60 border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => simpanLabel(b)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Simpan"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSedangDiubah(null)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Batal"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSedangDiubah(b.id);
                      setLabelDraf(b.label ?? "");
                    }}
                    className="mt-1 block w-full text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    {b.label || "+ tambah catatan singkat"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Menggali pesan server dari error yang dilempar helper `request`. */
function pesanGalat(err: unknown): string | null {
  const pesan = err instanceof Error ? err.message : String(err ?? "");

  try {
    const data = JSON.parse(pesan);
    if (typeof data?.error === "string") return data.error;
  } catch {
    // Bukan JSON -- biarkan pemanggil memakai pesan bawaannya.
  }

  return null;
}
