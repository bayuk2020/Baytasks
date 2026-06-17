/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2, Calendar, Wallet, Upload, User, LayoutGrid, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore, type Transaction, type TransactionType } from "@/lib/finance/store";
import { TransactionFormModal } from "@/components/finance/TransactionFormModal";
import { IncomeSourceModal } from "@/components/finance/IncomeSourceModal";
import { formatCurrency, StatCard } from "@/components/finance/StatCard";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/finance/transactions")({
  component: TransactionsPage,
});

const BULAN_LIST = [
  { value: "all", label: "Semua Bulan" },
  { value: "01", label: "Januari" },   { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },     { value: "04", label: "April" },
  { value: "05", label: "Mei" },       { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },       { value: "08", label: "Agustus" },
  { value: "09", label: "September" }, { value: "10", label: "Oktober" },
  { value: "11", label: "November" },  { value: "12", label: "Desember" }
];

const TAHUN_LIST = ["all", "2022", "2023", "2024", "2025", "2026", "2027"];

const formatYAxis = (value: number) => {
  if (value === 0) return "0";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}rb`;
  }
  return String(value);
};

function TransactionsPage() {
  const allTransactions = useFinanceStore((state) => state.allTransactions || state.transactions);
  const accountMap = useFinanceStore((state) => state.accountMap);
  const contactMap = useFinanceStore((state) => state.contactMap);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const loadAccounts = useFinanceStore((state) => state.loadAccounts);
  const loadTransactions = useFinanceStore((state) => state.loadTransactions);
  const loadIncomeSources = useFinanceStore((state) => state.loadIncomeSources);
  const loadContacts = useFinanceStore((state) => state.loadContacts);

  const [open, setOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("expense");
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterBulan, setFilterBulan] = useState("all");
  const [filterTahun, setFilterTahun] = useState("all");
  
  // TAMBAHAN STATE FILTER BARU
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  
  const [itemsPerPage, setItemsPerPage] = useState<string>("50");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([loadAccounts(), loadTransactions(), loadIncomeSources(), loadContacts()]).catch(
      (error) => {
        console.error(error);
        toast.error("Gagal memuat data keuangan");
      },
    );
  }, []);

  // Ambil daftar kategori unik dari data transaksi buat dropdown filter otomatis
  const daftarKategori = useMemo(() => {
    const setKat = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.category) setKat.add(t.category);
    });
    return Array.from(setKat).sort();
  }, [allTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, typeFilter, accountFilter, filterTanggal, filterBulan, filterTahun, categoryFilter, contactFilter, itemsPerPage]);

  const accountName = (id: string) => accountMap?.[id]?.name ?? "—";
  const contactName = (id?: string) => (id ? (contactMap?.[id]?.name ?? "—") : "—");

  // 1. FILTER UTUT DATA (TERMASUK KATEGORI & KONTAK BARU)
  const filteredList = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...allTransactions]
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => accountFilter === "all" || t.accountId === accountFilter)
      .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
      .filter((t) => contactFilter === "all" || t.contactId === contactFilter)
      .filter((t) => {
        if (!t.transactionDate) return false;

        let dateStr = "";
        const rawDate = t.transactionDate as any; 

        if (typeof rawDate === "number" || rawDate instanceof Date) {
          const localDate = new Date(rawDate);
          const y = localDate.getFullYear();
          const m = String(localDate.getMonth() + 1).padStart(2, "0");
          const d = String(localDate.getDate()).padStart(2, "0");
          dateStr = `${y}-${m}-${d}`;
        } else if (rawDate) {
          dateStr = String(rawDate).substring(0, 10);
        }

        const parts = dateStr.split("-");
        if (parts.length !== 3) return false;

        if (filterTahun !== "all" && parts[0] !== filterTahun) return false;
        if (filterBulan !== "all" && parts[1] !== filterBulan) return false;
        if (filterTanggal !== "" && String(parseInt(parts[2], 10)) !== filterTanggal) return false;
        return true;
      })
      .filter((t) => {
        if (!search) return true;
        return (
          t.category.toLowerCase().includes(search) ||
          (t.description ?? "").toLowerCase().includes(search) ||
          (contactMap?.[t.contactId ?? ""]?.name ?? "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [allTransactions, query, typeFilter, accountFilter, filterTanggal, filterBulan, filterTahun, categoryFilter, contactFilter, contactMap]);

  // 2. CLIENT SIDE PAGINATION
  const paginatedList = useMemo(() => {
    if (itemsPerPage === "all") return filteredList;
    const limit = Number(itemsPerPage);
    const startIndex = (currentPage - 1) * limit;
    return filteredList.slice(startIndex, startIndex + limit);
  }, [filteredList, currentPage, itemsPerPage]);

  const lastPage = useMemo(() => {
    if (itemsPerPage === "all") return 1;
    return Math.ceil(filteredList.length / Number(itemsPerPage)) || 1;
  }, [filteredList, itemsPerPage]);

  // 3. REKAP TOTAL SEPANJANG FILTER AKTIF
  const rekap = useMemo(() => {
    let pemasukan = 0;
    let pengeluaran = 0;

    filteredList.forEach((t) => {
      if (t.type === "income") pemasukan += Number(t.amount || 0);
      if (t.type === "expense") pengeluaran += Number(t.amount || 0);
      if (t.type === "transfer" && accountFilter !== "all" && t.accountId === accountFilter) {
        pengeluaran += Number(t.amount || 0);
      }
    });

    return { pemasukan, pengeluaran, sisaSaldo: pemasukan - pengeluaran };
  }, [filteredList, accountFilter]);

  const chartData = useMemo(() => {
    return [{ name: "Rekap Transaksi", Pemasukan: rekap.pemasukan, Pengeluaran: rekap.pengeluaran }];
  }, [rekap]);

  const openCreate = () => {
    setEditing(undefined);
    setDefaultType("expense");
    setOpen(true);
  };

  const remove = async (transaction: Transaction) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await removeTransaction(transaction.id);
      toast.success("Transaksi berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus transaksi");
    }
  };


    // FUNGSI EXPORT KE EXCEL
    const exportToExcel = () => {
      if (filteredList.length === 0) {
        toast.error("Tidak ada data transaksi untuk diexport!");
        return;
      }
  
      // 1. Susun ulang data biar kolom Excel-nya rapi berbahasa Indonesia
      const dataToExport = filteredList.map((t, index) => {
        const d = new Date(t.transactionDate);
        const tglStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        
        return {
          "No": index + 1,
          "Tanggal": tglStr,
          "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
          "Kategori": t.category,
          "Akun": accountName(t.accountId),
          "Kontak": contactName(t.contactId),
          "Keterangan": t.description || "-",
          "Mutasi": t.type === "expense" ? -t.amount : t.amount // Biar gampang dijumlah di Excel
        };
      });
  
      // 2. Bikin Worksheet & Workbook pakai library xlsx
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mutasi Keuangan");
  
      // 3. Buat nama file dinamis sesuai filter (contoh: Rekap_Bulan_05_Tahun_2026.xlsx)
      const namaBulan = filterBulan !== "all" ? `Bulan_${filterBulan}` : "SemuaBulan";
      const namaTahun = filterTahun !== "all" ? `Tahun_${filterTahun}` : "SemuaTahun";
      
      XLSX.writeFile(workbook, `Rekap_Keuangan_${namaBulan}_${namaTahun}.xlsx`);
      toast.success("File Excel berhasil didownload!");
    };

  return (
    <div className="grid gap-4">
      {/* ACTION BAR ATAS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Transaksi Keuangan</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSourcesOpen(true)}><Tag className="mr-1 h-4 w-4" /> Sumber Pendapatan</Button>
          <Button variant="outline" asChild><Link to="/finance/import"><Upload className="mr-1 h-4 w-4" /> Import Transaksi</Link></Button>
          <Button variant="outline" onClick={exportToExcel} className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
            <Download className="mr-1 h-4 w-4" /> Export Excel
          </Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Baru</Button>
        </div>
      </div>

      {/* FILTER PANEL PANEL (Sekarang muat 2 baris biar muat banyak filter) */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center bg-card/20 p-4 rounded-2xl border border-border">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari keterangan..." className="pl-9" />
        </div>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="number" min="1" max="31" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} placeholder="Tgl (1-31) / Kosong" className="pl-9" />
        </div>

        <Select value={filterBulan} onValueChange={setFilterBulan}>
          <SelectTrigger><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
          <SelectContent>{BULAN_LIST.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}</SelectContent>
        </Select>

        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
          <SelectContent>{TAHUN_LIST.map((th) => (<SelectItem key={th} value={th}>{th === "all" ? "Semua Tahun" : th}</SelectItem>))}</SelectContent>
        </Select>

        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger><SelectValue placeholder="Semua Akun" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Akun Bank</SelectItem>
            {Object.values(accountMap || {}).map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* REVISI: Tambahan Dropdown Filter Kategori */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="relative pl-9">
            <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {daftarKategori.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* REVISI: Tambahan Dropdown Filter Kontak */}
        <Select value={contactFilter} onValueChange={setContactFilter}>
          <SelectTrigger className="relative pl-9">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SelectValue placeholder="Semua Kontak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kontak</SelectItem>
            {Object.values(contactMap || {}).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* REVISI: Filter Tipe Transaksi (Income / Expense / Transfer) */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe Transaksi</SelectItem>
            <SelectItem value="income">Income (Masuk)</SelectItem>
            <SelectItem value="expense">Expense (Keluar)</SelectItem>
            <SelectItem value="transfer">Transfer (Internal)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DATATABLE */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-card/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-3 text-center w-10">No</th>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Keterangan</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Akun</th>
              <th className="px-4 py-3 text-left">Kontak</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedList.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Tidak ada transaksi yang cocok dengan filter.</td></tr> // REVISI: colSpan ganti jadi 8 karena kolom nambah
            )}
            {/* GANTI DI SINI: Tambahkan parameter 'index' */}
            {paginatedList.map((transaction, index) => {
              // Rumus hitung nomor urut reaktif mengikuti halaman aktif
              const limit = itemsPerPage === "all" ? filteredList.length : Number(itemsPerPage);
              const nomorUrut = (currentPage - 1) * limit + index + 1;

              return (
                <tr key={transaction.id} className="hover:bg-accent/40">
                  {/* TAMBAHKAN TD NOMOR INI */}
                  <td className="px-2 py-3 text-center text-xs text-muted-foreground tabular-nums">
                    {nomorUrut}
                  </td>
                  
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(transaction.transactionDate).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">{transaction.description || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{transaction.category}</td>
                  <td className="px-4 py-3">{accountName(transaction.accountId)}{transaction.toAccountId && (<span className="text-muted-foreground"> → {accountName(transaction.toAccountId)}</span>)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{contactName(transaction.contactId)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${transaction.type === "income" ? "text-emerald-400" : transaction.type === "expense" ? "text-rose-400" : "text-muted-foreground"}`}>
                    {transaction.type === "expense" ? "−" : transaction.type === "income" ? "+" : ""}{formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(transaction); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(transaction)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* CONTROLS PAGINASI FRONTEND */}
        <div className="flex flex-wrap gap-4 justify-between items-center p-4 border-t border-border bg-card/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tampilkan baris:</span>
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="w-[85px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {itemsPerPage !== "all" && (
            <div className="flex items-center gap-3">
              <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} size="sm" variant="outline">Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">Halaman {currentPage} dari {lastPage}</span>
              <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} disabled={currentPage >= lastPage} size="sm" variant="outline">Selanjutnya</Button>
            </div>
          )}
        </div>
      </div>

      {/* STATS & RECHARTS */}
      <div className="grid gap-4 md:grid-cols-3 mt-2">
        <div className="md:col-span-1 grid gap-3">
          <StatCard label="Total Pemasukan" value={formatCurrency(rekap.pemasukan)} tone="positive" />
          <StatCard label="Total Pengeluaran" value={formatCurrency(rekap.pengeluaran)} tone="negative" />
          <StatCard label="Sisa Saldo Rekap" value={formatCurrency(rekap.sisaSaldo)} tone={rekap.sisaSaldo >= 0 ? "positive" : "negative"} hint="Berdasarkan Filter Aktif" />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2"><Wallet className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Visualisasi Arus Keuangan Terfilter</span></div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={11} tickFormatter={formatYAxis} />
                <Tooltip shared={false} contentStyle={{ backgroundColor: "#1a1a1a", borderColor: "#333", borderRadius: 8 }} itemStyle={{ color: "#fff" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <TransactionFormModal open={open} onClose={() => setOpen(false)} editing={editing} defaultType={defaultType} />
      <IncomeSourceModal open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </div>
  );
}