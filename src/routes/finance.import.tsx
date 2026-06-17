/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, Pencil, Trash2, Check, Play, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/lib/finance/store";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/import")({
  component: ImportPage,
});

/* ----------------- types ----------------- */

interface RawRow {
  Bank?: string;
  Tanggal?: number | string;
  Bulan?: string;
  Tahun?: number | string;
  "Tanggal(tgl-bulan)"?: string;
  "Pemasukan / Pengeluaran"?: string;
  Via?: string;
  Kategori?: string;
  Keterangan?: string;
  Contact?: string;
  Mutasi?: number | string;
  "Sisa Saldo"?: number | string;
  [k: string]: unknown;
}

interface ParsedRow {
  id: string; // ID unik Sesi Import yang di-generate di frontend
  rowIndex: number;
  bank: string;
  transactionDate: number;
  type: "income" | "expense";
  category: string;
  description: string;
  contactName: string;
  amount: number;
  error?: string;
  status: "pending" | "success" | "failed"; // State Antrean Impor
  errorMessage?: string; // Menyimpan log error dari backend Laravel
}

/* ----------------- helpers ----------------- */

const MONTHS_ID: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

function parseMonth(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (s in MONTHS_ID) return MONTHS_ID[s];
  const n = Number(s);
  if (!Number.isNaN(n) && n >= 1 && n <= 12) return n - 1;
  return null;
}

function parseAmount(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const cleaned = String(v).replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeKeys(row: Record<string, unknown>): RawRow {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim()] = v;
  }
  return out as RawRow;
}

// Ganti fungsi generateUUID lama dengan generator UUID v4 standar ini
const generateUUID = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // fallback jika crypto di-block oleh browser non-HTTPS
    }
  }
  // Algoritma Math.random yang menghasilkan format standar: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function parseRows(rows: RawRow[]): ParsedRow[] {
  return rows.map((r, i) => {
    const bank = String(r.Bank ?? "").trim();
    const day = Number(r.Tanggal);
    const month = parseMonth(r.Bulan);
    const year = Number(r.Tahun);
    
    let typeRaw = "";
    for (const [key, val] of Object.entries(r)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, "");
      if (
        normalizedKey.includes("pemasukan") || 
        normalizedKey.includes("pengeluaran") || 
        normalizedKey === "type" || 
        normalizedKey === "tipe"
      ) {
        typeRaw = String(val ?? "").trim().toLowerCase();
        break;
      }
    }
    
    let type: "income" | "expense" = "expense"; 
    if (
      typeRaw.includes("pemasukan") || 
      typeRaw.includes("income") || 
      typeRaw === "masuk" || 
      typeRaw === "m" || 
      typeRaw === "i"
    ) {
      type = "income";
    } else if (
      typeRaw.includes("pengeluaran") || 
      typeRaw.includes("expense") || 
      typeRaw === "keluar" || 
      typeRaw === "k" || 
      typeRaw === "e"
    ) {
      type = "expense";
    }

    const amount = parseAmount(r.Mutasi);

    let error: string | undefined;
    if (!Number.isFinite(day) || !Number.isFinite(year) || month == null) {
      error = "Tanggal tidak valid";
    }
    if (amount <= 0) error = error ?? "Jumlah tidak valid";

    const date = error ? Date.now() : new Date(year, month!, day).getTime();

    return {
      id: generateUUID(), // KUNCI: Generate ID char(36) UUID langsung saat baca file Excel
      rowIndex: i + 2,
      bank,
      transactionDate: date,
      type,
      category: String(r.Kategori ?? "").trim() || "Tanpa Kategori",
      description: String(r.Keterangan ?? "").trim(),
      contactName: String(r.Contact ?? "").trim(),
      amount,
      error,
      status: "pending",
    };
  });
}

/* ----------------- page ----------------- */

function ImportPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const contacts = useFinanceStore((s) => (s as unknown as { contacts?: { id: string; name: string }[] }).contacts ?? []);
  const addContact = useFinanceStore((s) => (s as unknown as { addContact?: (p: { name: string; type: string }) => Promise<{ id: string }> }).addContact);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ParsedRow | null>(null);

  const summary = useMemo(() => {
    const valid = rows.filter((r) => !r.error);
    const income = valid.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const expense = valid.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    
    const processedSuccess = rows.filter((r) => r.status === "success").length;
    const processedFailed = rows.filter((r) => r.status === "failed").length;

    return {
      total: rows.length,
      validCount: valid.length,
      errorCount: rows.length - valid.length,
      income,
      expense,
      net: income - expense,
      processedSuccess,
      processedFailed
    };
  }, [rows]);

  const onFile = useCallback(async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const normalized = json.map(normalizeKeys);
      const parsed = parseRows(normalized);
      setRows(parsed);
      setFileName(file.name);

      const bank = parsed[0]?.bank?.toLowerCase();
      if (bank && !accountId) {
        const match = accounts.find((a) => a.name.toLowerCase().includes(bank));
        if (match) setAccountId(match.id);
      }
      toast.success(`Berhasil membaca ${parsed.length} baris dari ${file.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal membaca file XLSX");
    }
  }, [accounts, accountId]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const clear = () => {
    setRows([]);
    setFileName("");
    setEditingRowIndex(null);
    setEditFormData(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const startEdit = (row: ParsedRow) => {
    setEditingRowIndex(row.rowIndex);
    setEditFormData({ ...row });
  };

  const saveEdit = () => {
    if (!editFormData) return;
    let error: string | undefined = undefined;
    if (editFormData.amount <= 0) error = "Jumlah tidak valid";

  const updatedRow: ParsedRow = {
    ...editFormData,
    error,
    status: (error ? "failed" : "pending") as "pending" | "success" | "failed", // <-- Berikan kepastian tipe data
    errorMessage: error ? "Data diperbaiki tapi jumlah masih salah" : undefined
  };

    setRows((prev) => prev.map((r) => (r.rowIndex === updatedRow.rowIndex ? updatedRow : r)));
    setEditingRowIndex(null);
    setEditFormData(null);
    toast.success("Baris berhasil diperbarui lokal");
  };

  const deleteRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex));
    if (editingRowIndex === rowIndex) {
      setEditingRowIndex(null);
      setEditFormData(null);
    }
  };

// Fungsi penunda eksekusi (Jeda Milidetik) biar server Laravel bisa napas
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // LOGIKA ANTREAN IMPOR: Memproses baris demi baris dengan proteksi Web Locks API (Anti Tab Sleep)
  const executeImportQueue = async () => {
    if (!accountId) {
      toast.error("Silakan pilih akun terlebih dahulu");
      return;
    }

    // REVISI: Ambil antrean, dan PAKSA generate ID baru khusus buat data yang sempet 'failed'
    const queue = rows
      .filter((r) => !r.error && r.status !== "success")
      .map((r) => ({
        ...r,
        id: r.status === "failed" ? generateUUID() : r.id, 
      }));

    if (queue.length === 0) {
      toast.info("Semua data valid sudah berhasil diimpor.");
      return;
    }

    // Meminta "lock" ke browser agar tab ini diberi prioritas tinggi dan kebal dari pembekuan latar belakang
    if (typeof navigator !== "undefined" && "locks" in navigator) {
      try {
        await navigator.locks.request("finance_import_queue_lock", async () => {
          setImporting(true);

          const contactCache = new Map<string, string>();
          for (const c of contacts) contactCache.set(c.name.trim().toLowerCase(), c.id);

          // Mulai memproses antrean satu per satu
          for (const r of queue) {
            try {
              let contactId: string | undefined;
              const cname = r.contactName.trim();
              if (cname && addContact) {
                const key = cname.toLowerCase();
                if (contactCache.has(key)) {
                  contactId = contactCache.get(key);
                } else {
                  try {
                    const created = await addContact({ name: cname, type: "person" });
                    contactId = created.id;
                    contactCache.set(key, created.id);
                  } catch {
                    // Gagal membuat kontak
                  }
                }
              }

              const description = cname && !addContact
                ? `${r.description}${r.description ? " · " : ""}[${cname}]`
                : r.description || undefined;

              // REVISI AMAN: Ambil tanggal format YYYY-MM-DD murni zona lokal (WIB), Anti Mundur!
              const d = new Date(r.transactionDate);
              const stringDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              
              // Kirim data ke Laravel
              await addTransaction({
                id: r.id, 
                accountId,
                type: r.type,
                category: r.category,
                amount: r.amount,
                description,
                transactionDate: stringDate,
                ...(contactId ? ({ contactId } as Record<string, unknown>) : {}),
              });

              // Update status baris ke sukses
              setRows((prev) =>
                prev.map((item) => (item.rowIndex === r.rowIndex ? { ...item, status: "success", errorMessage: undefined } : item))
              );

              // KUNCI COOP: Berikan jeda 100 milidetik setelah tiap tembakan sukses!
              await delay(100);

            } catch (e) {
              console.error("Antrean Impor Terhenti", e);
              const msg = e instanceof Error ? e.message : "Ditolak backend Laravel / Server Sibuk";
              
              setRows((prev) =>
                prev.map((item) => (item.rowIndex === r.rowIndex ? { ...item, status: "failed", errorMessage: msg } : item))
              );

              setImporting(false);
              toast.error(`Impor Terhenti di baris #${r.rowIndex}! Server sibuk, silakan tunggu sebentar lalu klik Lanjutkan.`);
              throw new Error("StopQueue"); // Melempar error untuk memutus paksa antrean di dalam lock
            }
          }

          setImporting(false);
          toast.success("Seluruh antrean mutasi bank berhasil diimpor!");
        });
      } catch (lockError: any) {
        // Tangkap error internal pemutus antrean agar console tidak merah berlebihan
        if (lockError.message !== "StopQueue") {
          console.error("Web Lock Error:", lockError);
          setImporting(false);
        }
      }
    } else {
      // BAGIAN FALLBACK BROWSER JADUL (Tanpa Web Locks)
      setImporting(true);
      toast.warning("Browser kamu tidak mendukung Anti-Tab-Sleep. Mohon jangan tinggalkan halaman ini.");
      
      const contactCache = new Map<string, string>();
      for (const c of contacts) contactCache.set(c.name.trim().toLowerCase(), c.id);

      for (const r of queue) {
        try {
          let contactId: string | undefined;
          const cname = r.contactName.trim();
          if (cname && addContact) {
            const key = cname.toLowerCase();
            if (contactCache.has(key)) contactId = contactCache.get(key);
            else {
              try {
                const created = await addContact({ name: cname, type: "person" });
                contactId = created.id;
                contactCache.set(key, created.id);
              } catch { /* empty */ }
            }
          }
          const description = cname && !addContact ? `${r.description}${r.description ? " · " : ""}[${cname}]` : r.description || undefined;
          
          const d = new Date(r.transactionDate);
          const stringDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          
          await addTransaction({ id: r.id, accountId, type: r.type, category: r.category, amount: r.amount, description, transactionDate: stringDate, ...(contactId ? ({ contactId } as Record<string, unknown>) : {}) });
          setRows((prev) => prev.map((item) => (item.rowIndex === r.rowIndex ? { ...item, status: "success" } : item)));
          
          // KUNCI COOP: Berikan jeda 100 milidetik juga di fallback ini
          await delay(100);

        } catch (e) {
          const msg = e instanceof Error ? e.message : "Ditolak backend Laravel";
          setRows((prev) => prev.map((item) => (item.rowIndex === r.rowIndex ? { ...item, status: "failed", errorMessage: msg } : item)));
          setImporting(false);
          toast.error(`Impor Terhenti di baris #${r.rowIndex}! Server sibuk.`);
          return;
        }
      }
      setImporting(false);
      toast.success("Seluruh antrean mutasi bank berhasil diimpor!");
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/finance/transactions">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Impor Mutasi Bank</h2>
            <p className="text-sm text-muted-foreground">
              Sesi impor cerdas otomatis mengamankan transaksi ganda via ID Sesi Frontend.
            </p>
          </div>
        </div>
        {rows.length > 0 && (
          <Button variant="outline" onClick={clear} disabled={importing}>
            <X className="mr-1 h-4 w-4" /> Bersihkan
          </Button>
        )}
      </div>

      {/* Upload Card */}
      {!fileName && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-2xl border-2 border-dashed bg-card/40 p-8 text-center backdrop-blur transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Tarik & lepaskan file XLSX di sini</div>
              <div className="text-xs text-muted-foreground">atau klik untuk memilih file</div>
            </div>
            <Button onClick={() => inputRef.current?.click()}>Pilih File</Button>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Total Berkas" value={summary.total} hint={`${summary.processedSuccess} Berhasil Masuk`} />
            <StatCard label="Sukses (✅)" value={summary.processedSuccess} tone="positive" />
            <StatCard label="Gagal (❌)" value={summary.processedFailed} tone={summary.processedFailed > 0 ? "negative" : "default"} />
            <StatCard label="Total Pemasukan" value={formatCurrency(summary.income)} tone="positive" />
            <StatCard label="Total Pengeluaran" value={formatCurrency(summary.expense)} tone="negative" />
          </div>

          {/* Account + Action Queue */}
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Akun Rekening Tujuan</label>
              <Select value={accountId} onValueChange={setAccountId} disabled={importing || summary.processedSuccess > 0}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Pilih akun…" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={executeImportQueue}
                disabled={importing || !accountId || rows.filter(r => r.status !== 'success' && !r.error).length === 0}
                className={cn(summary.processedFailed > 0 && "bg-amber-500 hover:bg-amber-600 text-black")}
              >
                {importing ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Sedang Mengimpor Mutasi Rekening…</>
                ) : summary.processedFailed > 0 ? (
                  <><Play className="mr-1 h-4 w-4" /> Lanjutkan Impor Antrean ({rows.filter(r => r.status !== 'success' && !r.error).length})</>
                ) : (
                  <><CheckCircle2 className="mr-1 h-4 w-4" /> Mulai Eksekusi Impor Transaksi</>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-border bg-card/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 text-center w-[60px]">Status</th>
                    <th className="px-4 py-3 text-left w-[50px]">#</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Tipe</th>
                    <th className="px-4 py-3 text-left">Kategori</th>
                    <th className="px-4 py-3 text-left">Kontak</th>
                    <th className="px-4 py-3 text-left">Keterangan / Alasan Gagal</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3 text-center w-[100px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const isEditing = editingRowIndex === r.rowIndex;
                    return (
                      <tr
                        key={r.rowIndex}
                        className={cn(
                          "hover:bg-accent/40", 
                          r.error && "bg-rose-500/5", 
                          r.status === "success" && "bg-emerald-500/5 opacity-70",
                          r.status === "failed" && "bg-rose-500/10",
                          isEditing && "bg-primary/5"
                        )}
                      >
                        {/* Kolom Indikator Centang/Silang Antrean */}
                        <td className="px-4 py-2 text-center text-base">
                          {r.status === "success" && "✅"}
                          {r.status === "failed" && "❌"}
                          {r.status === "pending" && !r.error && "⏳"}
                          {r.error && "⚠️"}
                        </td>

                        <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">
                          {r.rowIndex}
                        </td>

                        {/* Tanggal */}
                        <td className="px-4 py-2 text-xs">
                          {isEditing && editFormData ? (
                            <Input
                              type="date"
                              className="h-7 text-xs w-[130px] p-1"
                              value={new Date(editFormData.transactionDate).toISOString().split('T')[0]}
                              onChange={(e) => setEditFormData({ ...editFormData, transactionDate: new Date(e.target.value).getTime() })}
                            />
                          ) : r.error && r.error.includes("Tanggal") ? (
                            <span className="text-rose-400 font-medium">{r.error}</span>
                          ) : (
                            new Date(r.transactionDate).toLocaleDateString("id-ID")
                          )}
                        </td>

                        {/* Tipe */}
                        <td className="px-4 py-2">
                          {isEditing && editFormData ? (
                            <select
                              className="h-7 text-xs rounded-md bg-background border border-input p-1"
                              value={editFormData.type}
                              onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as "income" | "expense" })}
                            >
                              <option value="income">Pemasukan</option>
                              <option value="expense">Pengeluaran</option>
                            </select>
                          ) : (
                            <span className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium",
                              r.type === "income" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                              {r.type === "income" ? "Pemasukan" : "Pengeluaran"}
                            </span>
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="px-4 py-2 text-muted-foreground">
                          {isEditing && editFormData ? (
                            <Input className="h-7 text-xs p-1" value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} />
                          ) : r.category}
                        </td>

                        {/* Kontak */}
                        <td className="px-4 py-2">
                          {isEditing && editFormData ? (
                            <Input className="h-7 text-xs p-1" value={editFormData.contactName} onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })} />
                          ) : r.contactName || <span className="text-muted-foreground">—</span>}
                        </td>

                        {/* Keterangan / Pesan Error Backend */}
                        <td className="px-4 py-2 max-w-[280px] truncate">
                          {isEditing && editFormData ? (
                            <Input className="h-7 text-xs p-1" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                          ) : r.status === "failed" && r.errorMessage ? (
                            <span className="text-xs text-rose-400 block font-medium animate-pulse">🛑 {r.errorMessage}</span>
                          ) : (
                            r.description || <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Jumlah */}
                        <td className={cn("px-4 py-2 text-right tabular-nums font-semibold", r.type === "income" ? "text-emerald-400" : "text-rose-400")}>
                          {isEditing && editFormData ? (
                            <Input type="number" className="h-7 text-xs p-1 text-right w-[110px]" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })} />
                          ) : (
                            <>{r.type === "expense" ? "−" : "+"}{formatCurrency(r.amount)}</>
                          )}
                        </td>

                        {/* Tombol Aksi */}
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10" onClick={saveEdit}>
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7 text-muted-foreground" 
                                onClick={() => startEdit(r)} 
                                disabled={importing || r.status === 'success'}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-rose-400" 
                              onClick={() => deleteRow(r.rowIndex)} 
                              disabled={importing || r.status === 'success'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}