/**
 * Programmatic PDF generation using jsPDF + jspdf-autotable.
 * Builds reports directly from data — no DOM capture, no oklch issues.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Palette (hex → [r,g,b]) ────────────────────────────────────────────────────
const C = {
  emerald:      [21,  128,  61],
  emeraldDark:  [4,   120,  87],
  emeraldLight: [209, 250, 229],
  blue:         [29,   78, 216],
  blueLight:    [219, 234, 254],
  amber:        [180,  83,   9],
  amberLight:   [254, 243, 199],
  violet:       [109,  40, 217],
  violetLight:  [237, 233, 254],
  slate900:     [15,   23,  42],
  slate700:     [51,   65,  85],
  slate500:     [100, 116, 139],
  slate300:     [203, 213, 225],
  slate100:     [241, 245, 249],
  white:        [255, 255, 255],
  red:          [220,  38,  38],
};

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(v, d = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Page layout helpers ────────────────────────────────────────────────────────
const PAGE_W = 297;  // A4 landscape mm
const PAGE_H = 210;
const MARGIN  = 10;

function addPageHeader(pdf, title, subtitle, factoryName, filterLabel, accent) {
  // Accent banner
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, PAGE_W, 20, "F");

  // Report title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...C.white);
  pdf.text(title, MARGIN, 8);

  // Factory + subtitle on second line
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`${factoryName}  ·  ${subtitle}`, MARGIN, 14);

  // Generated date (right-aligned)
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  pdf.text(`Generated: ${dateStr}  ${timeStr}`, PAGE_W - MARGIN, 8, { align: "right" });
  if (filterLabel) pdf.text(filterLabel, PAGE_W - MARGIN, 14, { align: "right" });

  return 24; // cursor Y after banner
}

function addSectionLabel(pdf, y, label, count, accent) {
  pdf.setFillColor(...accent);
  pdf.roundedRect(MARGIN, y, 60, 6, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.white);
  pdf.text(label.toUpperCase(), MARGIN + 3, y + 4.2);

  if (count != null) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...C.slate500);
    pdf.setFontSize(7);
    pdf.text(`${count} record${count !== 1 ? "s" : ""}`, MARGIN + 65, y + 4.2);
  }
  return y + 8;
}

function addGrandTotalBanner(pdf, y, accent) {
  pdf.setFillColor(...accent);
  pdf.rect(MARGIN, y, PAGE_W - MARGIN * 2, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.white);
  pdf.text("GRAND TOTAL — ALL ROUTES", MARGIN + 3, y + 4);
  return y + 6;
}

function leafTypeCell(type) {
  return type === "Super" ? "Super" : "Normal";
}

function filterLabel(filters) {
  return [
    filters?.month && filters.month !== "All" ? filters.month : null,
    filters?.day   > 0                        ? `Day ${filters.day}` : null,
    filters?.route && filters.route !== "All" ? filters.route : null,
  ].filter(Boolean).join("  ·  ") || "All Records";
}

// ────────────────────────────────────────────────────────────────────────────────
// REPORT 1 — Route-Wise Weighing
// ────────────────────────────────────────────────────────────────────────────────
function buildRouteWiseWeighingPdf(data) {
  const { factoryName = "Factory", filters, routes = [], grandTotals } = data;
  const fl = filterLabel(filters);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPageHeader(pdf, "Route-Wise Weighing Report", "Collection breakdown by transport route", factoryName, fl, C.emerald);

  const HEAD = ["Type", "Bags", "Gross (kg)", "Bag Wt", "Water", "Coarse", "Boiled", "SPD", "Rejected", "Excess (kg)", "Net Wt (kg)"];

  const leafRow = (label, d, fillColor, textColor) => [
    { content: label, styles: { fillColor, textColor, fontStyle: "bold", halign: "center" } },
    { content: fmtInt(d.bags),        styles: { halign: "right" } },
    { content: fmt(d.grossWeight),    styles: { halign: "right" } },
    { content: fmt(d.bagWeight),      styles: { halign: "right" } },
    { content: fmtInt(d.water),       styles: { halign: "right" } },
    { content: fmtInt(d.coarse),      styles: { halign: "right" } },
    { content: fmtInt(d.boiled),      styles: { halign: "right" } },
    { content: fmtInt(d.spd),         styles: { halign: "right" } },
    { content: fmtInt(d.rejected),    styles: { halign: "right" } },
    { content: fmt(d.excessLeaf),     styles: { halign: "right" } },
    { content: fmt(d.netWeight),      styles: { halign: "right", fontStyle: "bold" } },
  ];

  const totalRow = (d) => [
    { content: "TOTAL", styles: { fillColor: C.slate100, textColor: C.slate700, fontStyle: "bold", halign: "center" } },
    { content: fmtInt(d.bags),        styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmt(d.grossWeight),    styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmt(d.bagWeight),      styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmtInt(d.water),       styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmtInt(d.coarse),      styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmtInt(d.boiled),      styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmtInt(d.spd),         styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmtInt(d.rejected),    styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmt(d.excessLeaf),     styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
    { content: fmt(d.netWeight),      styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
  ];

  for (const route of routes) {
    if (y > PAGE_H - 50) { pdf.addPage(); y = MARGIN; }
    y = addSectionLabel(pdf, y, route.route, null, C.emerald);

    const body = [];
    if (route.normal?.bags > 0 || route.normal?.grossWeight > 0)
      body.push(leafRow("Normal", route.normal, C.emeraldLight, C.emerald));
    if (route.super?.bags > 0 || route.super?.grossWeight > 0)
      body.push(leafRow("Super",  route.super,  C.violetLight,  C.violet));
    body.push(totalRow(route.totals));

    autoTable(pdf, {
      head:      [HEAD],
      body,
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineColor: C.slate300, lineWidth: 0.2 },
      headStyles:{ fillColor: C.emerald, textColor: C.white, fontStyle: "bold", fontSize: 7.5, halign: "right" },
      columnStyles: { 0: { halign: "center", cellWidth: 18 } },
      didDrawPage: (d) => { y = d.cursor.y; },
    });
    y = pdf.lastAutoTable.finalY + 5;
  }

  // Grand totals
  if (grandTotals) {
    if (y > PAGE_H - 45) { pdf.addPage(); y = MARGIN; }
    y = addGrandTotalBanner(pdf, y, C.emerald);

    const grandBody = [
      leafRow("Normal", grandTotals.normal,  C.emeraldLight, C.emerald),
      leafRow("Super",  grandTotals.super,   C.violetLight,  C.violet),
      [
        { content: "GRAND", styles: { fillColor: C.emerald, textColor: C.white, fontStyle: "bold", halign: "center" } },
        ...[fmtInt(grandTotals.overall.bags), fmt(grandTotals.overall.grossWeight), fmt(grandTotals.overall.bagWeight),
            fmtInt(grandTotals.overall.water), fmtInt(grandTotals.overall.coarse), fmtInt(grandTotals.overall.boiled),
            fmtInt(grandTotals.overall.spd), fmtInt(grandTotals.overall.rejected), fmt(grandTotals.overall.excessLeaf),
            fmt(grandTotals.overall.netWeight)].map(v => ({
          content: v, styles: { halign: "right", fontStyle: "bold", fillColor: C.emerald, textColor: C.white },
        })),
      ],
    ];

    autoTable(pdf, {
      head:      [HEAD],
      body:      grandBody,
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineColor: C.slate300, lineWidth: 0.2 },
      headStyles:{ fillColor: C.emeraldDark, textColor: C.white, fontStyle: "bold", fontSize: 7.5, halign: "right" },
      columnStyles: { 0: { halign: "center", cellWidth: 18 } },
    });
  }

  addFooters(pdf, factoryName, "Route-Wise Weighing Report", fl);
  return pdf;
}

// ────────────────────────────────────────────────────────────────────────────────
// REPORT 2 — Leaf Transfer
// ────────────────────────────────────────────────────────────────────────────────
function buildLeafTransferPdf(data) {
  const { factoryName = "Factory", filters, records = [], totals } = data;
  const fl = filterLabel(filters);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPageHeader(pdf, "Leaf Transfer Report", "Cross-factory transfer records", factoryName, fl, C.blue);

  const HEAD = ["Reg No", "Supplier", "Type", "Bags", "Gross (kg)", "Transfer (kg)", "Net Wt (kg)", "Date", "Time"];

  // Group by route
  const routeMap = new Map();
  for (const rec of records) {
    const route = rec.route || "Unassigned";
    if (!routeMap.has(route)) routeMap.set(route, []);
    routeMap.get(route).push(rec);
  }

  for (const [route, recs] of routeMap) {
    if (y > PAGE_H - 50) { pdf.addPage(); y = MARGIN; }
    y = addSectionLabel(pdf, y, route, recs.length, C.blue);

    const routeTotals = recs.reduce((a, r) => ({
      bags:        a.bags        + (r.bags        || 0),
      grossWeight: a.grossWeight + (r.grossWeight || 0),
      transferQty: a.transferQty + (r.transferQty || 0),
      netWeight:   a.netWeight   + (r.netWeight   || 0),
    }), { bags: 0, grossWeight: 0, transferQty: 0, netWeight: 0 });

    const body = recs.map((r) => [
      { content: String(r.regNo),       styles: { halign: "right",  textColor: C.slate500 } },
      { content: r.supplierName || "—", styles: { fontStyle: "bold" } },
      { content: leafTypeCell(r.leafType),
        styles: { halign: "center", fontStyle: "bold",
          fillColor: r.leafType === "Super" ? C.violetLight : C.emeraldLight,
          textColor: r.leafType === "Super" ? C.violet      : C.emerald } },
      { content: fmtInt(r.bags),        styles: { halign: "right" } },
      { content: fmt(r.grossWeight),    styles: { halign: "right" } },
      { content: fmt(r.transferQty),    styles: { halign: "right", fontStyle: "bold", textColor: C.blue } },
      { content: fmt(r.netWeight),      styles: { halign: "right", fontStyle: "bold" } },
      { content: fmtDate(r.logTime),    styles: { halign: "right", textColor: C.slate500 } },
      { content: fmtTime(r.logTime),    styles: { halign: "right", textColor: C.slate500 } },
    ]);

    // Route subtotal row
    body.push([
      { content: "Route Total", colSpan: 3, styles: { fontStyle: "bold", halign: "right", fillColor: C.slate100, textColor: C.slate700 } },
      { content: fmtInt(routeTotals.bags),        styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
      { content: fmt(routeTotals.grossWeight),    styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
      { content: fmt(routeTotals.transferQty),    styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100, textColor: C.blue } },
      { content: fmt(routeTotals.netWeight),      styles: { halign: "right", fontStyle: "bold", fillColor: C.slate100 } },
      { content: "", colSpan: 2, styles: { fillColor: C.slate100 } },
    ]);

    autoTable(pdf, {
      head:      [HEAD],
      body,
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, lineColor: C.slate300, lineWidth: 0.2 },
      headStyles:{ fillColor: C.blue, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 18, halign: "right" },
        2: { cellWidth: 18, halign: "center" },
        3: { halign: "right" }, 4: { halign: "right" },
        5: { halign: "right" }, 6: { halign: "right" },
        7: { halign: "right" }, 8: { halign: "right" },
      },
    });
    y = pdf.lastAutoTable.finalY + 5;
  }

  // Grand total
  if (totals && records.length > 0) {
    if (y > PAGE_H - 25) { pdf.addPage(); y = MARGIN; }
    y = addGrandTotalBanner(pdf, y, C.blue);

    autoTable(pdf, {
      body: [[
        { content: "Grand Total — All Routes", colSpan: 3, styles: { fontStyle: "bold", halign: "right", fillColor: C.blue, textColor: C.white } },
        { content: fmtInt(totals.bags),        styles: { halign: "right", fontStyle: "bold", fillColor: C.blue, textColor: C.white } },
        { content: fmt(totals.grossWeight),    styles: { halign: "right", fontStyle: "bold", fillColor: C.blue, textColor: C.white } },
        { content: fmt(totals.transferQty),    styles: { halign: "right", fontStyle: "bold", fillColor: C.blue, textColor: C.white } },
        { content: fmt(totals.netWeight),      styles: { halign: "right", fontStyle: "bold", fillColor: C.blue, textColor: C.white } },
        { content: "", colSpan: 2, styles: { fillColor: C.blue } },
      ]],
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: C.blue, lineWidth: 0.3 },
      columnStyles: {
        0: { cellWidth: 18 }, 2: { cellWidth: 18 },
        3: { halign: "right" }, 4: { halign: "right" },
        5: { halign: "right" }, 6: { halign: "right" },
      },
    });
  }

  addFooters(pdf, factoryName, "Leaf Transfer Report", fl);
  return pdf;
}

// ────────────────────────────────────────────────────────────────────────────────
// REPORT 3 — Weighing Details
// ────────────────────────────────────────────────────────────────────────────────
function buildWeighingDetailsPdf(data) {
  const { factoryName = "Factory", filters, records = [], totals } = data;
  const fl = filterLabel(filters);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPageHeader(pdf, "Weighing Details Report", "Full detail with deduction breakdown", factoryName, fl, C.amber);

  const HEAD = ["Reg", "Supplier", "Type", "Mode", "Bags", "Bag Wt", "Gross (kg)", "Water", "Coarse", "Boiled", "SPD", "Rej", "Excess", "Net Wt (kg)", "Date", "Time"];

  const routeMap = new Map();
  for (const rec of records) {
    const route = rec.route || "Unassigned";
    if (!routeMap.has(route)) routeMap.set(route, []);
    routeMap.get(route).push(rec);
  }

  for (const [route, recs] of routeMap) {
    if (y > PAGE_H - 50) { pdf.addPage(); y = MARGIN; }
    y = addSectionLabel(pdf, y, route, recs.length, C.amber);

    const rt = recs.reduce((a, r) => ({
      bags: a.bags + (r.bags || 0), grossWeight: a.grossWeight + (r.grossWeight || 0),
      bagWeight: a.bagWeight + (r.bagWeight || 0), netWeight: a.netWeight + (r.netWeight || 0),
      water: a.water + (r.water || 0), coarse: a.coarse + (r.coarse || 0),
      boiled: a.boiled + (r.boiled || 0), spd: a.spd + (r.spd || 0),
      rejected: a.rejected + (r.rejected || 0), excessLeaf: a.excessLeaf + (r.excessLeaf || 0),
    }), { bags:0,grossWeight:0,bagWeight:0,netWeight:0,water:0,coarse:0,boiled:0,spd:0,rejected:0,excessLeaf:0 });

    const body = recs.map((r) => [
      { content: String(r.regNo),    styles: { halign: "right", textColor: C.slate500, fontSize: 7 } },
      { content: r.supplierName || "—", styles: { fontSize: 7 } },
      { content: leafTypeCell(r.leafType),
        styles: { halign: "center", fontStyle: "bold", fontSize: 7,
          fillColor: r.leafType === "Super" ? C.violetLight : C.emeraldLight,
          textColor: r.leafType === "Super" ? C.violet      : C.emerald } },
      { content: r.mode || "—",     styles: { halign: "center", textColor: C.slate500, fontSize: 7 } },
      { content: fmtInt(r.bags),    styles: { halign: "right" } },
      { content: fmt(r.bagWeight),  styles: { halign: "right" } },
      { content: fmt(r.grossWeight),styles: { halign: "right" } },
      { content: fmtInt(r.water),   styles: { halign: "right", textColor: C.red } },
      { content: fmtInt(r.coarse),  styles: { halign: "right", textColor: C.red } },
      { content: fmtInt(r.boiled),  styles: { halign: "right", textColor: C.red } },
      { content: fmtInt(r.spd),     styles: { halign: "right", textColor: C.red } },
      { content: fmtInt(r.rejected),styles: { halign: "right", textColor: C.red } },
      { content: fmt(r.excessLeaf), styles: { halign: "right", textColor: C.red } },
      { content: fmt(r.netWeight),  styles: { halign: "right", fontStyle: "bold" } },
      { content: fmtDate(r.logTime),styles: { halign: "right", textColor: C.slate500, fontSize: 7 } },
      { content: fmtTime(r.logTime),styles: { halign: "right", textColor: C.slate500, fontSize: 7 } },
    ]);

    // Route subtotal
    const subStyle = (v, bold = false, color) => ({
      content: v,
      styles: { halign: "right", fontStyle: bold ? "bold" : "normal", fillColor: C.slate100,
                ...(color ? { textColor: color } : {}) },
    });
    body.push([
      { content: "Route Total", colSpan: 4, styles: { fontStyle: "bold", halign: "right", fillColor: C.slate100, textColor: C.slate700 } },
      subStyle(fmtInt(rt.bags), true),
      subStyle(fmt(rt.bagWeight), true),
      subStyle(fmt(rt.grossWeight), true),
      subStyle(fmtInt(rt.water),    false, C.red),
      subStyle(fmtInt(rt.coarse),   false, C.red),
      subStyle(fmtInt(rt.boiled),   false, C.red),
      subStyle(fmtInt(rt.spd),      false, C.red),
      subStyle(fmtInt(rt.rejected), false, C.red),
      subStyle(fmt(rt.excessLeaf),  false, C.red),
      subStyle(fmt(rt.netWeight), true),
      { content: "", colSpan: 2, styles: { fillColor: C.slate100 } },
    ]);

    autoTable(pdf, {
      head:      [HEAD],
      body,
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 7.5, cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2.5 }, lineColor: C.slate300, lineWidth: 0.2 },
      headStyles:{ fillColor: C.amber, textColor: C.white, fontStyle: "bold", fontSize: 7, halign: "right" },
      columnStyles: {
        0: { cellWidth: 14, halign: "right" },
        1: { cellWidth: 32 },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 12, halign: "center" },
        4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
        7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" },
        10:{ halign: "right" }, 11:{ halign: "right" }, 12:{ halign: "right" },
        13:{ halign: "right" }, 14:{ halign: "right" }, 15:{ halign: "right" },
      },
    });
    y = pdf.lastAutoTable.finalY + 5;
  }

  // Grand total
  if (totals && records.length > 0) {
    if (y > PAGE_H - 25) { pdf.addPage(); y = MARGIN; }
    y = addGrandTotalBanner(pdf, y, C.amber);

    const gStyle = (v, color) => ({
      content: v,
      styles: { halign: "right", fontStyle: "bold", fillColor: C.amber, textColor: color || C.white },
    });
    autoTable(pdf, {
      body: [[
        { content: "Grand Total — All Routes", colSpan: 4, styles: { fontStyle: "bold", halign: "right", fillColor: C.amber, textColor: C.white } },
        gStyle(fmtInt(totals.bags)),
        gStyle(fmt(totals.bagWeight)),
        gStyle(fmt(totals.grossWeight)),
        gStyle(fmtInt(totals.water)),
        gStyle(fmtInt(totals.coarse)),
        gStyle(fmtInt(totals.boiled)),
        gStyle(fmtInt(totals.spd)),
        gStyle(fmtInt(totals.rejected)),
        gStyle(fmt(totals.excessLeaf)),
        gStyle(fmt(totals.netWeight)),
        { content: "", colSpan: 2, styles: { fillColor: C.amber } },
      ]],
      startY:    y,
      margin:    { left: MARGIN, right: MARGIN },
      styles:    { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 } },
      columnStyles: {
        0: { cellWidth: 14 }, 1: { cellWidth: 32 }, 2: { cellWidth: 14 }, 3: { cellWidth: 12 },
      },
    });
  }

  addFooters(pdf, factoryName, "Weighing Details Report", fl);
  return pdf;
}

// ── Footer on every page ───────────────────────────────────────────────────────
function addFooters(pdf, factoryName, reportTitle, fl) {
  const pageCount = pdf.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...C.slate300);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, PAGE_H - 8, PAGE_W - MARGIN, PAGE_H - 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.slate500);
    pdf.text(`Leaf Weighing System · ${factoryName}`, MARGIN, PAGE_H - 4);
    pdf.text(`${reportTitle}  ·  ${fl}`, PAGE_W / 2, PAGE_H - 4, { align: "center" });
    pdf.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 4, { align: "right" });
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function downloadPdf(reportType, data, filename = "report") {
  let pdf;

  if (reportType === "route-wise-weighing") {
    pdf = buildRouteWiseWeighingPdf(data);
  } else if (reportType === "leaf-transfer") {
    pdf = buildLeafTransferPdf(data);
  } else if (reportType === "weighing-details") {
    pdf = buildWeighingDetailsPdf(data);
  } else {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  pdf.save(`${filename}.pdf`);
}
