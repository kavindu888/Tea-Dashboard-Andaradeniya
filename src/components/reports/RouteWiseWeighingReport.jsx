
// ── Number formatting ──────────────────────────────────────────────────────────
function fmt(value, decimals = 2) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtInt(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

// ── Sub-table (Normal / Super / Total columns) ────────────────────────────────
function LeafBlock({ data, label, accent }) {
  if (!data) return null;
  return (
    <td colSpan={9} className="p-0 align-top">
      <table className="w-full text-right text-xs leading-tight border-collapse">
        <tbody>
          <tr>
            <td className={`px-2 py-1.25 font-semibold text-center text-[10px] uppercase tracking-widest ${accent} w-[90px]`}>
              {label}
            </td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.bags)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmt(data.grossWeight)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmt(data.bagWeight)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.water)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.coarse)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.boiled)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.spd)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmtInt(data.rejected)}</td>
            <td className="px-2 py-1.25 font-tabular">{fmt(data.excessLeaf)}</td>
            <td className="px-2 py-1.25 font-tabular font-semibold">{fmt(data.netWeight)}</td>
          </tr>
        </tbody>
      </table>
    </td>
  );
}

// ── Main report component ─────────────────────────────────────────────────────
function RouteWiseWeighingReport({ data }) {
  if (!data) return null;

  const { factoryName, generatedAt, filters, routes = [], grandTotals } = data;
  const genDate = generatedAt ? new Date(generatedAt) : new Date();

  const filterLabel = [
    filters?.month && filters.month !== "All" ? filters.month : null,
    filters?.day   > 0                        ? `Day ${filters.day}` : null,
    filters?.route && filters.route !== "All" ? filters.route : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const HEADER_COLS = [
    "Bags", "Gross (kg)", "Bag Wt", "Water", "Coarse",
    "Boiled", "SPD", "Rejected", "Excess", "Net Wt (kg)",
  ];

  return (
    <div className="report-page font-ui bg-white text-slate-800">

      {/* ── Report Header ──────────────────────────────────────────────── */}
      <div className="report-header flex items-start justify-between mb-5 pb-4 border-b-2 border-emerald-700">
        <div>
          <p className="text-overline text-emerald-600 mb-1">Leaf Collection Dashboard</p>
          <h1 className="font-display text-2xl text-slate-900 leading-tight">
            Route-Wise Weighing Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">{factoryName}</p>
        </div>
        <div className="text-right text-xs text-slate-400 leading-relaxed shrink-0 ml-4">
          <p className="font-semibold text-slate-600">{filterLabel || "All Records"}</p>
          <p>Generated: {genDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
          <p>{genDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* ── Summary pills ─────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-5 flex-wrap no-print-break">
        {[
          { label: "Routes",        value: routes.length },
          { label: "Total Gross",   value: `${fmt(grandTotals?.overall?.grossWeight)} kg` },
          { label: "Normal Net",    value: `${fmt(grandTotals?.normal?.netWeight)} kg`   },
          { label: "Super Net",     value: `${fmt(grandTotals?.super?.netWeight)} kg`    },
          { label: "Grand Net",     value: `${fmt(grandTotals?.overall?.netWeight)} kg`, highlight: true },
        ].map((pill) => (
          <div
            key={pill.label}
            className={[
              "flex flex-col px-4 py-2.5 rounded-lg border text-sm",
              pill.highlight
                ? "bg-emerald-700 border-emerald-700 text-white"
                : "bg-slate-50 border-slate-200 text-slate-700",
            ].join(" ")}
          >
            <span className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
              {pill.label}
            </span>
            <span className="font-tabular font-semibold">{pill.value}</span>
          </div>
        ))}
      </div>

      {/* ── No data state ─────────────────────────────────────────────── */}
      {routes.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm border rounded-xl border-dashed border-slate-200">
          No weighing records found for the selected filters.
        </div>
      )}

      {/* ── Routes ────────────────────────────────────────────────────── */}
      {routes.map((routeRow, idx) => (
        <div key={routeRow.route} className={`mb-6 ${idx > 0 ? "page-break-inside-avoid" : ""}`}>

          {/* Route label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              {routeRow.route}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse text-xs">

              {/* Column header */}
              <thead>
                <tr className="bg-slate-100 text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide w-[90px]">
                    Type
                  </th>
                  {HEADER_COLS.map((col) => (
                    <th key={col} className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Normal row */}
                {routeRow.normal && (
                  <tr className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-1.25 font-semibold text-center text-[10px] uppercase tracking-widest text-emerald-700 bg-emerald-50">
                      Normal
                    </td>
                    {[
                      fmtInt(routeRow.normal.bags),
                      fmt(routeRow.normal.grossWeight),
                      fmt(routeRow.normal.bagWeight),
                      fmtInt(routeRow.normal.water),
                      fmtInt(routeRow.normal.coarse),
                      fmtInt(routeRow.normal.boiled),
                      fmtInt(routeRow.normal.spd),
                      fmtInt(routeRow.normal.rejected),
                      fmt(routeRow.normal.excessLeaf),
                      fmt(routeRow.normal.netWeight),
                    ].map((val, i) => (
                      <td key={i} className="px-2 py-1.25 text-right font-tabular">
                        {val}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Super row */}
                {routeRow.super && (
                  <tr className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-1.25 font-semibold text-center text-[10px] uppercase tracking-widest text-violet-700 bg-violet-50">
                      Super
                    </td>
                    {[
                      fmtInt(routeRow.super.bags),
                      fmt(routeRow.super.grossWeight),
                      fmt(routeRow.super.bagWeight),
                      fmtInt(routeRow.super.water),
                      fmtInt(routeRow.super.coarse),
                      fmtInt(routeRow.super.boiled),
                      fmtInt(routeRow.super.spd),
                      fmtInt(routeRow.super.rejected),
                      fmt(routeRow.super.excessLeaf),
                      fmt(routeRow.super.netWeight),
                    ].map((val, i) => (
                      <td key={i} className="px-2 py-1.25 text-right font-tabular">
                        {val}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Route total */}
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                  <td className="px-3 py-1.25 text-center text-[10px] uppercase tracking-widest text-slate-600">
                    Total
                  </td>
                  {[
                    fmtInt(routeRow.totals.bags),
                    fmt(routeRow.totals.grossWeight),
                    fmt(routeRow.totals.bagWeight),
                    fmtInt(routeRow.totals.water),
                    fmtInt(routeRow.totals.coarse),
                    fmtInt(routeRow.totals.boiled),
                    fmtInt(routeRow.totals.spd),
                    fmtInt(routeRow.totals.rejected),
                    fmt(routeRow.totals.excessLeaf),
                    fmt(routeRow.totals.netWeight),
                  ].map((val, i) => (
                    <td key={i} className="px-2 py-1.25 text-right font-tabular">
                      {val}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Grand Totals ───────────────────────────────────────────────── */}
      {routes.length > 0 && grandTotals && (
        <div className="mt-2 rounded-xl border-2 border-emerald-700 overflow-hidden">
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">
            Grand Totals — All Routes
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50 text-slate-500">
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide w-[90px]">
                  Type
                </th>
                {HEADER_COLS.map((col) => (
                  <th key={col} className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Grand Normal */}
              <tr className="border-t border-emerald-100">
                <td className="px-3 py-1.25 font-semibold text-center text-[10px] uppercase tracking-widest text-emerald-700 bg-emerald-50">
                  Normal
                </td>
                {[
                  fmtInt(grandTotals.normal.bags),
                  fmt(grandTotals.normal.grossWeight),
                  fmt(grandTotals.normal.bagWeight),
                  fmtInt(grandTotals.normal.water),
                  fmtInt(grandTotals.normal.coarse),
                  fmtInt(grandTotals.normal.boiled),
                  fmtInt(grandTotals.normal.spd),
                  fmtInt(grandTotals.normal.rejected),
                  fmt(grandTotals.normal.excessLeaf),
                  fmt(grandTotals.normal.netWeight),
                ].map((val, i) => (
                  <td key={i} className="px-2 py-1.25 text-right font-tabular">
                    {val}
                  </td>
                ))}
              </tr>

              {/* Grand Super */}
              <tr className="border-t border-emerald-100">
                <td className="px-3 py-1.25 font-semibold text-center text-[10px] uppercase tracking-widest text-violet-700 bg-violet-50">
                  Super
                </td>
                {[
                  fmtInt(grandTotals.super.bags),
                  fmt(grandTotals.super.grossWeight),
                  fmt(grandTotals.super.bagWeight),
                  fmtInt(grandTotals.super.water),
                  fmtInt(grandTotals.super.coarse),
                  fmtInt(grandTotals.super.boiled),
                  fmtInt(grandTotals.super.spd),
                  fmtInt(grandTotals.super.rejected),
                  fmt(grandTotals.super.excessLeaf),
                  fmt(grandTotals.super.netWeight),
                ].map((val, i) => (
                  <td key={i} className="px-2 py-1.25 text-right font-tabular">
                    {val}
                  </td>
                ))}
              </tr>

              {/* Grand Total */}
              <tr className="border-t-2 border-emerald-600 bg-emerald-700 text-white font-bold">
                <td className="px-3 py-2 text-center text-[10px] uppercase tracking-widest">
                  Grand
                </td>
                {[
                  fmtInt(grandTotals.overall.bags),
                  fmt(grandTotals.overall.grossWeight),
                  fmt(grandTotals.overall.bagWeight),
                  fmtInt(grandTotals.overall.water),
                  fmtInt(grandTotals.overall.coarse),
                  fmtInt(grandTotals.overall.boiled),
                  fmtInt(grandTotals.overall.spd),
                  fmtInt(grandTotals.overall.rejected),
                  fmt(grandTotals.overall.excessLeaf),
                  fmt(grandTotals.overall.netWeight),
                ].map((val, i) => (
                  <td key={i} className="px-2 py-2 text-right font-tabular">
                    {val}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="report-footer mt-6 pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
        <span>Leaf Weighing System · {factoryName}</span>
        <span>Route-Wise Weighing Report · {filterLabel || "All Records"}</span>
      </div>
    </div>
  );
}

export default RouteWiseWeighingReport;
