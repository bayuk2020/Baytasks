/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { StatCard, formatCurrency } from "@/components/finance/StatCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CashflowTrendChart,
  DebtProgressChart,
  ExpenseByCategoryChart,
  IncomeBySourceChart,
} from "@/components/finance/charts";
import { useFinanceStore } from "@/lib/finance/store";
import { useAnalyticsStore } from "@/lib/finance/analyticsStore";

export const Route = createFileRoute("/finance/analytics")({
  component: AnalyticsPage,
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

function AnalyticsPage() {
  // Ambil data pendukung filter dari store utama
  const accounts = useFinanceStore((s) => s.accounts);
  const contacts = useFinanceStore((s) => s.contacts);

  // Filter State UI
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterBulan, setFilterBulan] = useState("all");
  const [filterTahun, setFilterTahun] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");

  // Ambil data hasil kalkulasi SQL dari store isolasi baru
  const { reportData, loading, fetchAnalyticsData } = useAnalyticsStore();

  // KUNCI UTAMA: Setiap kali filter diubah, langsung tembak query SQL baru ke Laravel!
  useEffect(() => {
    fetchAnalyticsData({
      tahun: filterTahun,
      bulan: filterBulan,
      tanggal: filterTanggal,
      account_id: accountFilter,
      contact_id: contactFilter
    });
  }, [filterTahun, filterBulan, filterTanggal, accountFilter, contactFilter, fetchAnalyticsData]);

  // Judul teks dinamis untuk penanda periode kartu stat
  const labelDinamis = useMemo(() => {
    const namaBulan = filterBulan !== "all" ? BULAN_LIST.find(b => b.value === filterBulan)?.label : "Semua Bulan";
    const namaTahun = filterTahun !== "all" ? filterTahun : "Semua Tahun";
    if (filterBulan === "all" && filterTahun === "all") return "Sepanjang Masa";
    if (filterBulan === "all") return `Tahun ${namaTahun}`;
    return `${namaBulan} ${namaTahun}`;
  }, [filterBulan, filterTahun]);

  // Tampilkan loading spinner bawaan Lucide jika database sedang menghitung query
  if (loading || !reportData) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Database sedang menghitung query keuangan...</p>
      </div>
    );
  }

  // Destrukturisasi data bersih hasil olahan MySQL / PostgreSQL Laravel
  const { cards, charts } = reportData;

  return (
    <div className="grid gap-5">
      {/* FILTER PANEL */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-center bg-card/40 p-4 rounded-2xl border border-border backdrop-blur">
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="number" min="1" max="31" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} placeholder="Tgl (1-31) / Semua" className="pl-9" />
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
            {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={contactFilter} onValueChange={setContactFilter}>
          <SelectTrigger><SelectValue placeholder="Semua Kontak" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kontak</SelectItem>
            {contacts.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* STAT CARDS - MENAMPILKAN DATA SIAP PAKAI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kekayaan Bersih" value={formatCurrency(cards.netWorth)} tone={cards.netWorth >= 0 ? "positive" : "negative"} />
        <StatCard label="Total Kas" value={formatCurrency(cards.totalCash)} />
        <StatCard label={`Pendapatan (${labelDinamis})`} value={formatCurrency(cards.income)} tone="positive" />
        <StatCard label={`Pengeluaran (${labelDinamis})`} value={formatCurrency(cards.expense)} tone="negative" />
        <StatCard label={`Arus Kas Bersih (${labelDinamis})`} value={formatCurrency(cards.cashflow)} tone={cards.cashflow >= 0 ? "positive" : "negative"} />
        <StatCard label="Sisa Utang Aktif" value={formatCurrency(cards.debtRemaining)} tone={cards.debtRemaining > 0 ? "warning" : "positive"} />
      </div>

      {/* CHARTS - RENDER VISUAL RECHARTS DARI HASIL GROUP BY LARAVEL */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pendapatan berdasarkan Sumber"><IncomeBySourceChart data={charts.bySource} /></Panel>
        <Panel title="Pengeluaran berdasarkan Kategori"><ExpenseByCategoryChart data={charts.byCategory} /></Panel>
        <Panel title="Tren Arus Kas Keuangan"><CashflowTrendChart data={charts.trend} /></Panel>
        <Panel title="Progres Pengurangan Utang"><DebtProgressChart data={charts.debt} /></Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}