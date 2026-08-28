/* eslint-disable prettier/prettier */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ActivityTask, TaskStatus } from "@/lib/api";

/**
 * Pembuat laporan kegiatan (PDF & Excel) dari data Activity Log yang SEDANG
 * TERFILTER di halaman Calendar.
 *
 * Kolom "Board" sengaja TIDAK dicantumkan (permintaan user) -- laporan ini
 * dibaca sebagai daftar kegiatan, bukan rekap per papan.
 */

export interface ReportMeta {
  from: string;
  to: string;
  statuses: TaskStatus[];
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Rendah",
  med: "Sedang",
  high: "Tinggi",
  urgent: "Mendesak",
};

const fmtDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

/** Untuk kolom "Selesai" -- jamnya ikut, karena sering perlu tahu kapan persisnya. */
const fmtDateTime = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

/** "2026-08-01" -> "1 Agu 2026" untuk header laporan. */
const fmtIsoDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusSummary = (statuses: TaskStatus[]) =>
  statuses.length === 0
    ? "Semua status"
    : statuses.map((s) => STATUS_LABEL[s]).join(", ");

/** Nama file seragam untuk kedua format, memuat periodenya. */
const fileBase = (meta: ReportMeta) =>
  `laporan-kegiatan_${meta.from}_sd_${meta.to}`;

function buildSummary(tasks: ActivityTask[]) {
  const selesai = tasks.filter((t) => t.column === "done").length;
  const subtaskTotal = tasks.reduce((a, t) => a + t.subtaskTotal, 0);
  const subtaskDone = tasks.reduce((a, t) => a + t.subtaskDone, 0);

  return {
    total: tasks.length,
    selesai,
    belum: tasks.length - selesai,
    subtaskTotal,
    subtaskDone,
  };
}

// =====================================================================
// EXCEL
// =====================================================================

/**
 * Tiga sheet, masing-masing punya satu tugas yang jelas:
 *  - "Info"     : konteks filter, supaya file yang dikirim ke orang lain
 *                 tetap bisa dibaca tanpa penjelasan tambahan.
 *  - "Kegiatan" : satu baris per task, DATAR -- baris header di baris 1 supaya
 *                 AutoFilter/sort Excel langsung jalan.
 *  - "Subtask"  : satu baris per subtask + nama kegiatan induknya, jadi bisa
 *                 di-pivot/difilter sendiri.
 *
 * Subtask sengaja TIDAK ditempel sebagai baris indent di sheet "Kegiatan":
 * baris campuran begitu merusak sort & filter bawaan Excel, yang justru
 * alasan utama orang memilih format Excel ketimbang PDF.
 */
export function exportActivityExcel(tasks: ActivityTask[], meta: ReportMeta) {
  const s = buildSummary(tasks);

  const infoRows = [
    ["LAPORAN KEGIATAN — BayTasks"],
    [],
    ["Periode dibuat", `${fmtIsoDate(meta.from)} s/d ${fmtIsoDate(meta.to)}`],
    ["Filter status", statusSummary(meta.statuses)],
    ["Dibuat pada", new Date().toLocaleString("id-ID")],
    [],
    ["Total kegiatan", s.total],
    ["Selesai", s.selesai],
    ["Belum selesai", s.belum],
    ["Subtask selesai", `${s.subtaskDone} dari ${s.subtaskTotal}`],
  ];

  const taskRows = tasks.map((t, i) => ({
    No: i + 1,
    Kegiatan: t.title,
    Deskripsi: t.description || "-",
    Dibuat: fmtDate(t.createdAt),
    Deadline: fmtDate(t.dueAt),
    Status: STATUS_LABEL[t.column],
    Attachment:
      t.attachments.length > 0
        ? t.attachments.map((a) => a.name).join(", ")
        : "-",
    Notes: t.notes || "-",
    Selesai: fmtDateTime(t.completedAt),
    Prioritas: PRIORITY_LABEL[t.priority] ?? t.priority,
    "Subtask Selesai": t.subtaskDone,
    "Subtask Total": t.subtaskTotal,
    Progres:
      t.subtaskTotal > 0
        ? `${Math.round((t.subtaskDone / t.subtaskTotal) * 100)}%`
        : "-",
    Disembunyikan: t.hidden ? "Ya" : "Tidak",
  }));

  const subtaskRows = tasks.flatMap((t, i) =>
    t.subtasks.map((s2) => ({
      "No Kegiatan": i + 1,
      Kegiatan: t.title,
      Subtask: s2.title,
      Status: s2.done ? "Selesai" : "Belum",
    })),
  );

  const wb = XLSX.utils.book_new();

  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  wsInfo["!cols"] = [{ wch: 20 }, { wch: 42 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  wsTasks["!cols"] = [
    { wch: 5 },  // No
    { wch: 40 }, // Kegiatan
    { wch: 50 }, // Deskripsi
    { wch: 14 }, // Dibuat
    { wch: 14 }, // Deadline
    { wch: 13 }, // Status
    { wch: 28 }, // Attachment
    { wch: 40 }, // Notes
    { wch: 20 }, // Selesai
    { wch: 10 }, // Prioritas
    { wch: 15 }, // Subtask Selesai
    { wch: 13 }, // Subtask Total
    { wch: 9 },  // Progres
    { wch: 14 }, // Disembunyikan
  ];
  // Baris header dibekukan supaya tetap terlihat saat menggulir daftar panjang.
  wsTasks["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Jadikan sel Attachment tautan yang benar-benar bisa diklik di Excel.
  // Kalau satu task punya >1 lampiran, sel tetap menampilkan semua namanya
  // tapi tautannya diarahkan ke lampiran PERTAMA -- satu sel Excel hanya
  // bisa menampung satu hyperlink. Daftar lengkap + tautan per berkas ada
  // di sheet "Attachment".
  const ATTACHMENT_COL = 6; // kolom ke-7 (0-based), sesuai urutan taskRows
  tasks.forEach((t, i) => {
    if (t.attachments.length === 0) return;
    const ref = XLSX.utils.encode_cell({ r: i + 1, c: ATTACHMENT_COL });
    const cell = wsTasks[ref];
    if (cell) {
      cell.l = { Target: t.attachments[0].url, Tooltip: t.attachments[0].name };
    }
  });

  XLSX.utils.book_append_sheet(wb, wsTasks, "Kegiatan");

  const wsSubs = XLSX.utils.json_to_sheet(
    subtaskRows.length > 0
      ? subtaskRows
      : // Sheet kosong tetap diberi header supaya strukturnya konsisten
        // dan tidak bikin bingung saat dibuka.
        [{ "No Kegiatan": "", Kegiatan: "", Subtask: "", Status: "" }],
  );
  wsSubs["!cols"] = [{ wch: 12 }, { wch: 46 }, { wch: 46 }, { wch: 10 }];
  wsSubs["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsSubs, "Subtask");

  // Sheet lampiran: satu baris per berkas, masing-masing dengan tautannya
  // sendiri -- ini yang menutupi keterbatasan "satu hyperlink per sel" di
  // sheet Kegiatan saat sebuah task punya banyak lampiran.
  const attachmentRows = tasks.flatMap((t, i) =>
    t.attachments.map((a) => ({
      "No Kegiatan": i + 1,
      Kegiatan: t.title,
      "Nama Berkas": a.name,
      Tautan: a.url,
    })),
  );

  const wsAtt = XLSX.utils.json_to_sheet(
    attachmentRows.length > 0
      ? attachmentRows
      : [{ "No Kegiatan": "", Kegiatan: "", "Nama Berkas": "", Tautan: "" }],
  );
  wsAtt["!cols"] = [{ wch: 12 }, { wch: 46 }, { wch: 34 }, { wch: 60 }];
  wsAtt["!freeze"] = { xSplit: 0, ySplit: 1 };

  attachmentRows.forEach((row, i) => {
    const ref = XLSX.utils.encode_cell({ r: i + 1, c: 3 }); // kolom "Tautan"
    const cell = wsAtt[ref];
    if (cell) cell.l = { Target: row.Tautan, Tooltip: row["Nama Berkas"] };
  });

  XLSX.utils.book_append_sheet(wb, wsAtt, "Attachment");

  XLSX.writeFile(wb, `${fileBase(meta)}.xlsx`);
}

// =====================================================================
// PDF
// =====================================================================

/**
 * Dokumen A4 potret. Subtask ditulis sebagai baris indent DI DALAM sel
 * "Kegiatan" (bukan baris tabel terpisah) supaya satu kegiatan tetap
 * menyatu secara visual dan tidak terpotong antar halaman.
 */
export function exportActivityPdf(tasks: ActivityTask[], meta: ReportMeta) {
  // LANDSCAPE, bukan portrait: dengan tambahan kolom Deskripsi, Attachment,
  // Notes, dan Selesai, sepuluh kolom tidak muat dibaca di lebar A4 potret
  // (182mm) -- teksnya akan terpotong jadi satu-dua kata per baris.
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const s = buildSummary(tasks);

  // ---- Judul ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN KEGIATAN", pageW / 2, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("BayTasks", pageW / 2, 24, { align: "center" });
  doc.setTextColor(0);

  // ---- Meta filter ----
  doc.setFontSize(9);
  let y = 34;
  const metaLines: [string, string][] = [
    ["Periode dibuat", `${fmtIsoDate(meta.from)} s/d ${fmtIsoDate(meta.to)}`],
    ["Filter status", statusSummary(meta.statuses)],
    ["Dicetak", new Date().toLocaleString("id-ID")],
  ];
  for (const [k, v] of metaLines) {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${v}`, 45, y);
    y += 5;
  }

  // ---- Ringkasan ----
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan", 14, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(
    `Total kegiatan: ${s.total}    Selesai: ${s.selesai}    Belum selesai: ${s.belum}    ` +
      `Subtask selesai: ${s.subtaskDone}/${s.subtaskTotal}`,
    14,
    y,
  );

  // ---- Tabel ----
  const ATTACHMENT_COL = 6;

  const body = tasks.map((t, i) => {
    // Judul kegiatan + daftar subtask di baris-baris berikutnya dalam sel
    // yang sama. Simbol dipilih yang aman di font standar PDF (WinAnsi):
    // "[v]" untuk selesai dan "[ ]" untuk belum, BUKAN karakter centang
    // unicode yang akan tampil jadi kotak/berantakan di Helvetica bawaan jsPDF.
    const lines = [t.title];
    for (const st of t.subtasks) {
      lines.push(`    ${st.done ? "[v]" : "[  ]"} ${st.title}`);
    }

    return [
      String(i + 1),
      lines.join("\n"),
      t.description || "-",
      fmtDate(t.createdAt),
      fmtDate(t.dueAt),
      STATUS_LABEL[t.column],
      t.attachments.length > 0
        ? t.attachments.map((a) => a.name).join("\n")
        : "-",
      t.notes || "-",
      fmtDateTime(t.completedAt),
      t.subtaskTotal > 0 ? `${t.subtaskDone}/${t.subtaskTotal}` : "-",
    ];
  });

  autoTable(doc, {
    startY: y + 6,
    head: [
      [
        "No",
        "Kegiatan",
        "Deskripsi",
        "Dibuat",
        "Deadline",
        "Status",
        "Attachment",
        "Notes",
        "Selesai",
        "Subtask",
      ],
    ],
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.8,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.5,
    },
    // Total 263mm, muat di area cetak A4 landscape (~269mm).
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 48 },
      2: { cellWidth: 46 },
      3: { cellWidth: 19, halign: "center" },
      4: { cellWidth: 19, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 32, textColor: [37, 99, 235] },
      7: { cellWidth: 40 },
      8: { cellWidth: 20, halign: "center" },
      9: { cellWidth: 14, halign: "center" },
    },
    // Jangan memotong satu kegiatan (beserta subtask-nya) di tengah halaman.
    rowPageBreak: "avoid",
    // Jadikan sel Attachment benar-benar bisa diklik. Area link dipasang
    // menutupi seluruh sel; kalau lampirannya lebih dari satu, tautannya
    // mengarah ke berkas pertama (satu area = satu tujuan), sementara daftar
    // namanya tetap tercetak lengkap.
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== ATTACHMENT_COL) return;
      const t = tasks[data.row.index];
      if (!t || t.attachments.length === 0) return;
      doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
        url: t.attachments[0].url,
      });
    },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      const page = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(`Halaman ${page}`, pageW - 14, pageH - 8, { align: "right" });
      doc.text("Dibuat otomatis oleh BayTasks", 14, pageH - 8);
      doc.setTextColor(0);
    },
  });

  if (tasks.length === 0) {
    doc.setFontSize(9);
    doc.text("Tidak ada kegiatan pada rentang ini.", 14, y + 14);
  }

  doc.save(`${fileBase(meta)}.pdf`);
}
