
function fmt(value, decimals = 2) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function LeafTransferReport({ data }) {
  if (!data) return null;

  const { factoryName, generatedAt, filters, records = [], totals } = data;
  const genDate = generatedAt ? new Date(generatedAt) : new Date();

  const filterLabel = [
    filters?.month && filters.month !== "All" ? filters.month : null,
    filters?.day   > 0                        ? `Day ${filters.day}` : null,
    filters?.route && filters.route !== "All" ? filters.route : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Group records by route for display
  const routeGroups = [];
  const routeMap    = new Map();

  for (const rec of records) {
    const route = rec.route || "Unassigned";
    if (!routeMap.has(route)) {
      routeMap.set(route, []);
      routeGroups.push(route);
    }
    routeMap.get(route).push(rec);
  }

  return (
    <div className="report-page font-ui bg-white text-slate-800">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="report-header flex items-start justify-between mb-5 pb-4 border-b-2 border-blue-700">
        <div>
          <p className="text-overline text-blue-600 mb-1">Leaf Collection Dashboard</p>
          <h1 className="font-display text-2xl text-slate-900 leading-tight">
            Leaf Transfer Report
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
      <div className="flex gap-4 mb-5 flex-wrap">
        {[
          { label: "Transfer Records", value: totals?.recordCount ?? records.length },
          { label: "Total Bags",       value: totals?.bags         ?? "—"           },
          { label: "Total Gross",      value: `${fmt(totals?.grossWeight)} kg`      },
          { label: "Transfer Qty",     value: `${fmt(totals?.transferQty)} kg`, highlight: true },
          { label: "Net Weight",       value: `${fmt(totals?.netWeight)} kg`,   highlight: true },
        ].map((pill) => (
          <div
            key={pill.label}
            className={[
              "flex flex-col px-4 py-2.5 rounded-lg border text-sm",
              pill.highlight
                ? "bg-blue-700 border-blue-700 text-white"
                : "bg-slate-50 border-slate-200 text-slate-700",
            ].join(" ")}
          >
            <span className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
              {pill.label}
            </span>
            <span className="font-tabular font-semibold">{String(pill.value)}</span>
          </div>
        ))}
      </div>

      {/* ── No data ───────────────────────────────────────────────────── */}
      {records.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm border rounded-xl border-dashed border-slate-200">
          No transfer records found for the selected filters.
        </div>
      )}

      {/* ── Records grouped by route ───────────────────────────────────── */}
      {routeGroups.map((route) => {
        const routeRecords = routeMap.get(route);
        const routeTotal   = routeRecords.reduce(
          (acc, r) => ({
            bags:        acc.bags        + (r.bags        || 0),
            grossWeight: acc.grossWeight + (r.grossWeight || 0),
            transferQty: acc.transferQty + (r.transferQty || 0),
            netWeight:   acc.netWeight   + (r.netWeight   || 0),
          }),
          { bags: 0, grossWeight: 0, transferQty: 0, netWeight: 0 },
        );

        return (
          <div key={route} className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                {route}
              </span>
              <span className="text-[10px] text-slate-400">
                {routeRecords.length} record{routeRecords.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-right">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Reg No</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Supplier</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Type</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Bags</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Gross (kg)</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Transfer (kg)</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Net Wt (kg)</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Date</th>
                    <th className="px-2 py-2 font-semibold uppercase tracking-wide">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {routeRecords.map((rec) => (
                    <tr key={rec.ind} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-1.25 font-tabular text-slate-500">{rec.regNo}</td>
                      <td className="px-3 py-1.25 font-medium">{rec.supplierName || "—"}</td>
                      <td className="px-2 py-1.25 text-center">
                        <span className={[
                          "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                          rec.leafType === "Super"
                            ? "text-violet-700 bg-violet-50"
                            : "text-emerald-700 bg-emerald-50",
                        ].join(" ")}>
                          {rec.leafType}
                        </span>
                      </td>
                      <td className="px-2 py-1.25 text-right font-tabular">{rec.bags}</td>
                      <td className="px-2 py-1.25 text-right font-tabular">{fmt(rec.grossWeight)}</td>
                      <td className="px-2 py-1.25 text-right font-tabular font-semibold text-blue-700">
                        {fmt(rec.transferQty)}
                      </td>
                      <td className="px-2 py-1.25 text-right font-tabular font-semibold">
                        {fmt(rec.netWeight)}
                      </td>
                      <td className="px-2 py-1.25 text-right font-tabular text-slate-500">
                        {fmtDate(rec.logTime)}
                      </td>
                      <td className="px-2 py-1.25 text-right font-tabular text-slate-500">
                        {fmtTime(rec.logTime)}
                      </td>
                    </tr>
                  ))}

                  {/* Route subtotal */}
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                    <td colSpan={3} className="px-3 py-1.25 text-[10px] uppercase tracking-widest text-slate-500">
                      Route Total
                    </td>
                    <td className="px-2 py-1.25 text-right font-tabular">{routeTotal.bags}</td>
                    <td className="px-2 py-1.25 text-right font-tabular">{fmt(routeTotal.grossWeight)}</td>
                    <td className="px-2 py-1.25 text-right font-tabular text-blue-700">{fmt(routeTotal.transferQty)}</td>
                    <td className="px-2 py-1.25 text-right font-tabular">{fmt(routeTotal.netWeight)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ── Grand Total ───────────────────────────────────────────────── */}
      {records.length > 0 && totals && (
        <div className="mt-2 rounded-xl border-2 border-blue-700 overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="bg-blue-700 text-white font-bold">
                <td colSpan={3} className="px-4 py-2.5 text-[10px] uppercase tracking-widest">
                  Grand Total — All Routes
                </td>
                <td className="px-2 py-2.5 text-right font-tabular">{totals.bags}</td>
                <td className="px-2 py-2.5 text-right font-tabular">{fmt(totals.grossWeight)}</td>
                <td className="px-2 py-2.5 text-right font-tabular">{fmt(totals.transferQty)}</td>
                <td className="px-2 py-2.5 text-right font-tabular">{fmt(totals.netWeight)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="report-footer mt-6 pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
        <span>Leaf Weighing System · {factoryName}</span>
        <span>Leaf Transfer Report · {filterLabel || "All Records"}</span>
      </div>
    </div>
  );
}

export default LeafTransferReport;
