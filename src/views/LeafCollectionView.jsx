import LeafCollectionTable from "../components/LeafCollectionTable";
import { useLeafCollectionViewModel } from "../viewmodels/useLeafCollectionViewModel";

function fmtN(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const selectCls =
  "h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm outline-none " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-overline text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function TotalPill({ label, value, featured = false }) {
  return (
    <div className={[
      "flex flex-col gap-1 px-3.5 py-2.5 rounded-xl border flex-1 basis-0 min-w-[90px]",
      featured
        ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md shadow-emerald-100"
        : "bg-white/80 border-black/[0.06] shadow-sm",
    ].join(" ")}>
      <span className={`text-overline truncate ${featured ? "text-emerald-600" : "text-slate-400"}`}>
        {label}
      </span>
      <strong className={`text-sm font-tabular leading-tight truncate ${featured ? "text-emerald-700" : "text-slate-700"}`}>
        {value}
      </strong>
    </div>
  );
}

function LeafCollectionView() {
  const {
    factories,
    selectedFactoryId,
    setSelectedFactoryId,
    filterOptions,
    filters,
    updateFilter,
    dayOptions,
    dashboard,
    selectedRowId,
    setSelectedRowId,
    busy,
    errorMessage,
  } = useLeafCollectionViewModel();

  const totals = dashboard.totals || {};
  const alerts = dashboard.factory?.alerts || { abnormalWeightThresholdKg: 0 };

  return (
    <div className="h-screen flex flex-col gap-2.5 px-4 pt-4 pb-3 overflow-hidden">

      {/* ── Top row: two separate cards ────────────── */}
      <div className="flex-shrink-0 flex gap-3 items-stretch">

        {/* Card 1 — Factory selection */}
        <div className="flex flex-col justify-between gap-3 bg-white/80 backdrop-blur-md rounded-2xl
          border border-black/[0.06] shadow-lg px-5 py-4 min-w-[220px]">
          <div>
            <p className="text-overline text-emerald-600 mb-0.5">
              Leaf Collection
            </p>
            <h2 className="font-display text-lg text-slate-800 leading-tight">Factory Scope</h2>
          </div>
          <FilterField label="Select Factory">
            <select
              className={selectCls + " w-full"}
              value={selectedFactoryId}
              onChange={(e) => setSelectedFactoryId(e.target.value)}
            >
              {factories.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </FilterField>
        </div>

        {/* Card 2 — Filters + status */}
        <div className="flex-1 flex items-end justify-between gap-4 flex-wrap
          bg-white/80 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-lg px-5 py-4">

          {/* Filter controls */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <p className="text-overline text-slate-400 mb-3">
                Filter Deck
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <FilterField label="Mode">
                  <select className={selectCls} value={filters.mode} onChange={(e) => updateFilter("mode", e.target.value)}>
                    {filterOptions.modeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FilterField>

                <FilterField label="Month">
                  <select className={selectCls} value={filters.month} onChange={(e) => updateFilter("month", e.target.value)}>
                    {filterOptions.months.map((m) => <option key={m.monthId} value={m.monthName}>{m.monthName}</option>)}
                  </select>
                </FilterField>

                <FilterField label="Date">
                  <select className={selectCls} value={filters.day} onChange={(e) => updateFilter("day", e.target.value)}>
                    {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FilterField>

                <FilterField label="Route">
                  <select className={selectCls} value={filters.route} onChange={(e) => updateFilter("route", e.target.value)}>
                    {filterOptions.routes.map((r) => (
                      <option key={`${r.routeCode}-${r.route}`} value={r.route}>{r.route}</option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Reg No">
                  <input
                    className={selectCls + " w-24"}
                    value={filters.regNo}
                    onChange={(e) => updateFilter("regNo", e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </FilterField>
              </div>
            </div>
          </div>

          {/* Status + error */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {errorMessage && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                {errorMessage}
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className={[
                "w-2.5 h-2.5 rounded-full shrink-0",
                busy ? "bg-amber-400 animate-warn-dot" : "bg-emerald-500 animate-live-dot",
              ].join(" ")} />
              <span className="text-xs font-semibold text-emerald-700">
                {busy ? "Syncing…" : "Live"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Totals strip ───────────────────────────── */}
      <div className="flex-shrink-0 flex items-stretch gap-2">
        <TotalPill featured label="Net Weight"   value={fmtN(totals.totalNetWeight)} />
        <TotalPill label="Suppliers"  value={totals.totalSupplierCount ?? 0} />
        <TotalPill label="Bags"       value={totals.totalBagCount ?? 0} />
        <TotalPill label="Gross"      value={fmtN(totals.totalGrossWeight)} />
        <TotalPill label="Bag Wt"     value={fmtN(totals.totalBagWeight)} />
        <TotalPill label="Coarse"     value={totals.totalCoarse ?? 0} />
        <TotalPill label="Water"      value={totals.totalWater ?? 0} />
        <TotalPill label="Rejected"   value={totals.totalRejected ?? 0} />
        <TotalPill label="Norm Dedu"  value={totals.normalDeduction ?? 0} />
        <TotalPill label="Super Dedu" value={fmtN(totals.superDeduction)} />
      </div>

      {/* ── Table (only this scrolls) ───────────────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-black/[0.06] shadow-lg bg-white/85 overflow-hidden">
        <LeafCollectionTable
          rows={dashboard.rows}
          selectedRowId={selectedRowId}
          onSelectRow={setSelectedRowId}
          abnormalThresholdKg={alerts.abnormalWeightThresholdKg}
        />
      </div>
    </div>
  );
}

export default LeafCollectionView;
