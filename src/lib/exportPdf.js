import { jsPDF } from "jspdf";
import { runVizAgent } from "./vizAgent";

function parseNumeric(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[$,%]/g, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? val : num;
  }
  return val;
}

export async function exportQueryToPdf(queryData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(108, 77, 230);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Chat2DB — Query Report", margin, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleString(), pageW - margin, 18, { align: "right" });

  y = 38;

  // ── Question ────────────────────────────────────────────
  doc.setTextColor(30, 30, 60);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const questionLines = doc.splitTextToSize(queryData.question || "", contentW);
  doc.text(questionLines, margin, y);
  y += questionLines.length * 6 + 4;

  // Badges: intent + pipeline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const badges = [
    queryData.intent && `Intent: ${queryData.intent}`,
    queryData.pipeline && `Mode: ${queryData.pipeline}`,
  ].filter(Boolean);
  badges.forEach((badge) => {
    const w = doc.getTextWidth(badge) + 6;
    doc.setFillColor(240, 237, 255);
    doc.setDrawColor(180, 160, 255);
    doc.roundedRect(margin, y, w, 6, 1.5, 1.5, "FD");
    doc.setTextColor(90, 60, 200);
    doc.text(badge, margin + 3, y + 4.2);
    margin + w + 4;
  });
  y += 10;

  // ── Summary ─────────────────────────────────────────────
  if (queryData.summary) {
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(200, 190, 255);
    const summaryLines = doc.splitTextToSize(queryData.summary, contentW - 8);
    doc.roundedRect(margin, y, contentW, summaryLines.length * 5.5 + 8, 3, 3, "FD");
    doc.setTextColor(40, 30, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(summaryLines, margin + 4, y + 6);
    y += summaryLines.length * 5.5 + 14;
  }

  // ── Stats Cards ──────────────────────────────────────────
  if (queryData.stats?.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("Key Metrics", margin, y);
    y += 6;

    const cardW = (contentW - (queryData.stats.length - 1) * 4) / Math.min(queryData.stats.length, 4);
    queryData.stats.slice(0, 4).forEach((stat, i) => {
      const x = margin + i * (cardW + 4);
      doc.setFillColor(250, 249, 255);
      doc.setDrawColor(220, 215, 255);
      doc.roundedRect(x, y, cardW, 16, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 90, 140);
      doc.text(stat.label, x + 4, y + 6);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 60);
      doc.text(String(stat.value), x + 4, y + 13);
    });
    y += 22;
  }

  // ── Data Table ───────────────────────────────────────────
  if (queryData.columns?.length > 0 && queryData.rows?.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("Results", margin, y);
    y += 6;

    const cols = queryData.columns;
    const colW = contentW / cols.length;

    // Header row
    doc.setFillColor(108, 77, 230);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    cols.forEach((col, i) => {
      doc.text(col.label, margin + i * colW + 2, y + 5);
    });
    y += 7;

    // Data rows
    const maxRows = 30;
    queryData.rows.slice(0, maxRows).forEach((row, ri) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor(ri % 2 === 0 ? 250 : 255, ri % 2 === 0 ? 249 : 255, ri % 2 === 0 ? 255 : 255);
      doc.rect(margin, y, contentW, 6.5, "F");
      doc.setDrawColor(230, 225, 245);
      doc.line(margin, y + 6.5, margin + contentW, y + 6.5);
      doc.setTextColor(40, 40, 70);
      doc.setFont("helvetica", "normal");
      cols.forEach((col, i) => {
        const val = String(row[col.key] ?? "");
        const truncated = val.length > 20 ? val.slice(0, 18) + "…" : val;
        doc.text(truncated, margin + i * colW + 2, y + 4.8);
      });
      y += 6.5;
    });

    if (queryData.rows.length > maxRows) {
      y += 3;
      doc.setFontSize(7);
      doc.setTextColor(130, 120, 160);
      doc.text(`… and ${queryData.rows.length - maxRows} more rows`, margin, y);
      y += 6;
    }
    y += 4;
  }

  // ── SQL Query ────────────────────────────────────────────
  if (queryData.sql_query) {
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("SQL Query", margin, y);
    y += 5;
    doc.setFillColor(245, 245, 255);
    doc.setDrawColor(200, 190, 240);
    const sqlLines = doc.splitTextToSize(queryData.sql_query, contentW - 8);
    doc.roundedRect(margin, y, contentW, sqlLines.length * 4.5 + 6, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("courier", "normal");
    doc.setTextColor(60, 40, 120);
    doc.text(sqlLines, margin + 4, y + 5);
    y += sqlLines.length * 4.5 + 10;
  }

  // ── Explanation ──────────────────────────────────────────
  if (queryData.explanation) {
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("Explanation", margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 80);
    const expLines = doc.splitTextToSize(queryData.explanation, contentW);
    doc.text(expLines, margin, y);
    y += expLines.length * 5 + 6;
  }

  // ── Footer ───────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 150, 190);
    doc.text(`Generated by Chat2DB · Page ${i} of ${pageCount}`, pageW / 2, 292, { align: "center" });
  }

  doc.save(`chat2db-report-${Date.now()}.pdf`);
}