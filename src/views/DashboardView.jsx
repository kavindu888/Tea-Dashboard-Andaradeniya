import PieLegendChart from "../components/PieLegendChart";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";

function fmt(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ── Shared field label + select ──────────────────────────────────── */
function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-overline text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm outline-none " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";

/* ── Leaf-type progress bar row ──────────────────────────────────── */
function LeafBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-500">{label}</span>
        <strong className="text-sm font-tabular text-slate-800">
          {fmt(value)} <span className="text-xs font-normal text-slate-400">kg</span>
        </strong>
      </div>
      <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[0.65rem] text-right text-slate-400">{pct}%</span>
    </div>
  );
}

/* ── Summary card wrapper ────────────────────────────────────────── */
function SummaryCard({ tag, title, icon, children }) {
  return (
    <div className="animate-rise bg-white/75 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-lg p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-sm">
          {icon}
        </span>
        <div>
          <p className="text-overline text-slate-400">{tag}</p>
          <h3 className="font-display text-base text-slate-800 leading-tight">{title}</h3>
        </div>
      </div>
      <div className="border-t border-black/[0.05] pt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

/* ── Total footer row ────────────────────────────────────────────── */
function CardTotal({ label, value, unit = "kg" }) {
  return (
    <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-black/[0.05]">
      <span className="text-overline text-slate-400">{label}</span>
      <strong className="text-base font-tabular text-emerald-700">
        {fmt(value)} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </strong>
    </div>
  );
}

/* ── Conic-gradient builder for the mini pie ─────────────────────── */
function buildConicGradient(segments) {
  const total = segments.reduce((s, d) => s + Number(d.value || 0), 0);
  if (total <= 0) return "conic-gradient(#d1fae5 0deg 360deg)";
  let start = 0;
  const stops = segments.map((d) => {
    const deg = (Number(d.value || 0) / total) * 360;
    const stop = `${d.color} ${start.toFixed(1)}deg ${(start + deg).toFixed(1)}deg`;
    start += deg;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/* ── Deduction mini-pie + legend (right panel) ───────────────────── */
function DeductionPane({ deductions }) {
  const items = deductions.filter((d) => Number(d.value || 0) > 0);
  const total = items.reduce((s, d) => s + Number(d.value || 0), 0);

  if (items.length === 0) {
    return (
      <p className="text-[0.65rem] text-slate-300 text-center py-2">—</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Mini conic pie */}
      <div
        className="w-14 h-14 rounded-full shrink-0 grid place-items-center"
        style={{
          backgroundImage: buildConicGradient(items),
          boxShadow: "inset 0 0 0 5px rgba(255,255,255,0.45)",
        }}
      >
        <div className="w-[54%] h-[54%] rounded-full bg-white/90 grid place-items-center shadow-sm">
          <strong className="text-[0.52rem] text-slate-600 leading-none font-tabular">
            {Number(total).toFixed(0)}
          </strong>
        </div>
      </div>

      {/* Per-item legend */}
      <ul className="flex flex-col gap-1 w-full">
        {items.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[0.6rem] text-slate-400 truncate flex-1">{d.label}</span>
            <strong className="text-[0.6rem] font-tabular text-slate-600 shrink-0">
              {Number(d.value).toFixed(0)}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Per-factory card ────────────────────────────────────────────── */
function FactoryCard({ factory }) {
  const total      = factory.totalNetWeight || 0;
  const deductions = factory.deductions     || [];
  const hasData    =
    total > 0 ||
    factory.supplierCount > 0 ||
    deductions.some((d) => Number(d.value || 0) > 0);

  return (
    <div className="animate-rise bg-white/70 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-md
      p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold
          bg-emerald-100 text-emerald-800 border border-emerald-200">
          {factory.name}
        </span>
        <span className="text-xs text-slate-400">
          {factory.supplierCount > 0
            ? `${factory.supplierCount} supplier${factory.supplierCount !== 1 ? "s" : ""}`
            : "No activity"}
        </span>
      </div>

      {/* ── No-data empty state ── */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-5 gap-2">
          <span className="text-3xl opacity-20">🍃</span>
          <p className="text-xs text-slate-400 text-center">No data for this period</p>
        </div>
      ) : (
        <>
          {/* ── Body: weight (left) | separator | deductions (right) ── */}
          <div className="flex gap-3 items-start">

            {/* Left — Net weight bars */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <p className="text-overline text-slate-400">Net Weight</p>
              <LeafBar
                label="Normal"
                value={factory.normalNetWeight}
                total={total}
                color="#0b7d47"
              />
              <LeafBar
                label="Super"
                value={factory.superNetWeight}
                total={total}
                color="#3b82f6"
              />
            </div>

            {/* Vertical separator */}
            <div className="w-px self-stretch bg-black/[0.06]" />

            {/* Right — Deduction pie + legend */}
            <div className="flex flex-col gap-1.5 w-[6.5rem] shrink-0">
              <p className="text-overline text-slate-400">Deductions</p>
              <DeductionPane deductions={deductions} />
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-between items-center pt-2 border-t border-black/[0.05]">
            <span className="text-xs text-slate-400">Total Net Weight</span>
            <strong className="text-sm font-bold font-tabular text-slate-800">
              {fmt(total)} kg
            </strong>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
function DashboardView() {
  const { filters, filterOptions, updateFilter, dayOptions, summary, busy, errorMessage } =
    useDashboardViewModel();

  const ls       = summary?.allFactories?.leafSummary || {};
  const ex       = summary?.allFactories?.excess      || {};
  const ded      = summary?.allFactories?.deductions  || [];
  const factories = summary?.factories                || [];

  return (
    <div className="h-screen flex flex-col gap-4 px-5 py-4 overflow-y-auto">

      {/* ── Page header ────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 flex-shrink-0
        bg-white/75 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-lg px-5 py-3.5">
        <div>
          <p className="text-overline text-emerald-600">Overview</p>
          <h1 className="font-display text-2xl text-slate-900 leading-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <FilterField label="Month">
            <select
              className={selectCls}
              value={filters.month}
              onChange={(e) => updateFilter("month", e.target.value)}
            >
              {filterOptions.months.map((m) => (
                <option key={m.monthId} value={m.monthName}>{m.monthName}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Date">
            <select
              className={selectCls}
              value={filters.day}
              onChange={(e) => updateFilter("day", e.target.value)}
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FilterField>

          {busy && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full animate-pulse">
              Syncing…
            </span>
          )}

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              {errorMessage}
            </p>
          )}
        </div>
      </header>

      {/* ── Top 3 summary cards ────────────────────── */}
      <section className="grid grid-cols-3 gap-4 flex-shrink-0">

        {/* Card 1 — Leaf Summary */}
        <SummaryCard tag="All factories · by type" title="Leaf Summary" icon="🍃">
          <LeafBar label="Normal" value={ls.normalNetWeight} total={ls.totalNetWeight} color="#0b7d47" />
          <LeafBar label="Super"  value={ls.superNetWeight}  total={ls.totalNetWeight} color="#3b82f6" />
          <CardTotal label="Total Net Weight" value={ls.totalNetWeight} />
        </SummaryCard>

        {/* Card 2 — Deduction breakdown pie */}
        <SummaryCard tag="All factories · by deduction type" title="Deduction Summary" icon="📊">
          <PieLegendChart segments={ded} compact />
        </SummaryCard>

        {/* Card 3 — Excess */}
        <SummaryCard tag="All factories · by leaf type" title="Total Excess" icon="⚖️">
          <LeafBar label="Normal" value={ex.normalExcess} total={ex.totalExcess} color="#0b7d47" />
          <LeafBar label="Super"  value={ex.superExcess}  total={ex.totalExcess} color="#3b82f6" />
          <CardTotal label="Total Excess" value={ex.totalExcess} />
        </SummaryCard>
      </section>

      {/* ── Per-factory breakdown ───────────────────── */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-overline text-slate-400">Factory breakdown</p>
          <h2 className="font-display text-xl text-slate-800">By Factory</h2>
        </div>

        {!busy && factories.length === 0 && (
          <p className="text-sm text-slate-400 py-4">
            No factory data available for the selected period.
          </p>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {factories.map((f) => (
            <FactoryCard key={f.id} factory={f} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardView;
