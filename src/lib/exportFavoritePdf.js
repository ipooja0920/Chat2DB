import { jsPDF } from "jspdf";

/** Exports a single favorite item as a compact PDF: summary, chart (placeholder), SQL */
export async function exportFavoriteToPdf(queryData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(108, 77, 230);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Chat2DB — Favorites Report", margin, 17);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleString(), pageW - margin, 17, { align: "right" });

  y = 36;

  // ── Question ─────────────────────────────────────────────
  doc.setTextColor(30, 30, 60);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const qLines = doc.splitTextToSize(queryData.question || "", contentW);
  doc.text(qLines, margin, y);
  y += qLines.length * 6 + 3;

  // Metadata badges (intent + pipeline)
  const badges = [
    queryData.intent && `Intent: ${queryData.intent}`,
    queryData.pipeline && `Mode: ${queryData.pipeline}`,
  ].filter(Boolean);

  let bx = margin;
  doc.setFontSize(8);
  badges.forEach((badge) => {
    const w = doc.getTextWidth(badge) + 6;
    doc.setFillColor(240, 237, 255);
    doc.setDrawColor(180, 160, 255);
    doc.roundedRect(bx, y, w, 6, 1.5, 1.5, "FD");
    doc.setTextColor(90, 60, 200);
    doc.text(badge, bx + 3, y + 4.2);
    bx += w + 4;
  });
  y += 12;

  // ── Business Summary ──────────────────────────────────────
  if (queryData.summary) {
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(200, 190, 255);
    const sumLines = doc.splitTextToSize(queryData.summary, contentW - 8);
    const boxH = sumLines.length * 5.5 + 8;
    doc.roundedRect(margin, y, contentW, boxH, 3, 3, "FD");
    doc.setTextColor(40, 30, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(sumLines, margin + 4, y + 6);
    y += boxH + 10;
  }

  // ── Stats ─────────────────────────────────────────────────
  if (queryData.stats?.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("Key Metrics", margin, y);
    y += 6;
    const count = Math.min(queryData.stats.length, 4);
    const cardW = (contentW - (count - 1) * 4) / count;
    queryData.stats.slice(0, count).forEach((stat, i) => {
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

  // ── Chart note ───────────────────────────────────────────
  doc.setFillColor(249, 247, 255);
  doc.setDrawColor(210, 200, 250);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 60, 160);
  doc.text("📊 Chart Visualization", margin + 6, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 140);
  doc.text("View the interactive chart in Chat2DB for the full visualization.", margin + 6, y + 15);
  y += 26;

  // ── SQL Query ─────────────────────────────────────────────
  if (queryData.sql_query) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text("SQL Query", margin, y);
    y += 5;
    const sqlLines = doc.splitTextToSize(queryData.sql_query, contentW - 8);
    const sqlBoxH = sqlLines.length * 4.5 + 8;
    doc.setFillColor(245, 245, 255);
    doc.setDrawColor(200, 190, 240);
    doc.roundedRect(margin, y, contentW, sqlBoxH, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("courier", "normal");
    doc.setTextColor(60, 40, 120);
    doc.text(sqlLines, margin + 4, y + 6);
    y += sqlBoxH + 8;
  }

  // ── Footer ────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(160, 150, 190);
  doc.text(
    `Chat2DB Favorites Export · Generated ${new Date().toLocaleString()}`,
    pageW / 2, 292, { align: "center" }
  );

  const slug = (queryData.question || "favorite").slice(0, 30).replace(/\s+/g, "-").toLowerCase();
  doc.save(`chat2db-favorite-${slug}.pdf`);
}