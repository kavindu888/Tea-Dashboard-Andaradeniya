import { useCallback, useEffect, useState } from "react";
import {
  fetchRouteWiseWeighingReport,
  fetchLeafTransferReport,
  fetchWeighingDetailsReport,
} from "../api/reportsApi";
import {
  fetchFactories,
  fetchLeafCollectionFilters,
} from "../api/leafCollectionApi";
import RouteWiseWeighingReport from "../components/reports/RouteWiseWeighingReport";
import LeafTransferReport from "../components/reports/LeafTransferReport";
import WeighingDetailsReport from "../components/reports/WeighingDetailsReport";
import { downloadPdf } from "../lib/downloadPdf";

// ── Report definitions ────────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "route-wise-weighing",
    label: "Route-Wise Weighing",
    sub: "Collection breakdown by transport route",
    icon: "🛣️",
    accentBg: "bg-emerald-700",
    accentBorder: "border-emerald-700",
    accentText: "text-emerald-700",
    accentLight: "bg-emerald-50 border-emerald-200",
  },
  {
    id: "leaf-transfer",
    label: "Leaf Transfer",
    sub: "Cross-factory transfer records and audit trail",
    icon: "🔁",
    accentBg: "bg-blue-700",
    accentBorder: "border-blue-700",
    accentText: "text-blue-700",
    accentLight: "bg-blue-50 border-blue-200",
  },
  {
    id: "weighing-details",
    label: "Weighing Details",
    sub: "Full detail export with deduction breakdown",
    icon: "📋",
    accentBg: "bg-amber-600",
    accentBorder: "border-amber-600",
    accentText: "text-amber-700",
    accentLight: "bg-amber-50 border-amber-200",
  },
];

// Returns how many days are in the selected month (defaults to 31 for "All")
function daysInMonth(monthLabel) {
  if (!monthLabel || monthLabel === "All") return 31;
  // monthLabel format: "APR-2026"
  const [mon, yr] = monthLabel.split("-");
  if (!mon || !yr) return 31;
  const monthIndex = new Date(`${mon} 1 ${yr}`).getMonth(); // 0-based
  const year = parseInt(yr, 10);
  if (isNaN(monthIndex) || isNaN(year)) return 31;
  return new Date(year, monthIndex + 1, 0).getDate(); // last day of month
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ factories, filters, onChange, routes, loading, onLoad }) {
  const maxDay = daysInMonth(filters.month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Factory */}
      <label className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
        Factory
        <select
          value={filters.factoryId}
          onChange={(e) => onChange("factoryId", e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-40"
        >
          {factories.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      {/* Month */}
      <label className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
        Month
        <select
          value={filters.month}
          onChange={(e) => onChange("month", e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-32.5"
        >
          <option value="All">All Months</option>
          {(filters._months || []).map((m) => (
            <option key={m.monthName} value={m.monthName}>
              {m.monthName}
            </option>
          ))}
        </select>
      </label>

      {/* Day */}
      <label className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
        Day
        <select
          value={filters.day}
          onChange={(e) => onChange("day", parseInt(e.target.value, 10) || 0)}
          className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-28"
        >
          <option value={0}>All Days</option>
          {days.map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </label>

      {/* Route */}
      <label className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
        Route
        <select
          value={filters.route}
          onChange={(e) => onChange("route", e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-35"
        >
          <option value="All">All Routes</option>
          {routes.map((r) => (
            <option key={r.routeCode} value={r.route}>
              {r.route}
            </option>
          ))}
        </select>
      </label>

      {/* Load button */}
      <button
        type="button"
        onClick={onLoad}
        disabled={loading}
        className="h-9 px-5 rounded-lg bg-emerald-700 text-white text-sm font-semibold
          hover:bg-emerald-800 active:scale-95 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading…
          </span>
        ) : (
          "Load Report"
        )}
      </button>
    </div>
  );
}

// ── Download PDF button ───────────────────────────────────────────────────────
function DownloadPdfButton({
  reportType,
  reportData,
  reportLabel,
  factoryName,
  filterLabel,
}) {
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  function handleDownload() {
    if (!reportData || busy) return;
    setBusy(true);
    setErrMsg("");
    try {
      const parts = [reportLabel, factoryName, filterLabel].filter(Boolean);
      const filename = parts.join(" — ").replace(/[/\\?%*:|"<>]/g, "-");
      downloadPdf(reportType, reportData, filename);
    } catch (err) {
      console.error("PDF download failed:", err);
      setErrMsg(err?.message || "PDF generation failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-2 h-9 px-4 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold
          hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 transition-all
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Generating PDF…
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {errMsg && (
        <p className="text-xs text-red-500 max-w-65 text-right">{errMsg}</p>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
function ReportsView() {
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0].id);
  const [factories, setFactories] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shared filter state
  const today = new Date();
  const currentMonthLabel = `${today.toLocaleString("en-US", { month: "short" }).toUpperCase()}-${today.getFullYear()}`;

  const [filters, setFilters] = useState({
    factoryId: "",
    month: currentMonthLabel,
    day: today.getDate(),
    route: "All",
    _months: [],
  });

  // ── Load factories on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchFactories()
      .then((res) => {
        const all = res.factories || [];
        // Exclude the "all-factories" meta entry; pick real factories
        const realFactories = all.filter((f) => f.id !== "all-factories");
        setFactories(all);
        if (realFactories.length > 0) {
          setFilters((prev) => ({ ...prev, factoryId: realFactories[0].id }));
        } else if (all.length > 0) {
          setFilters((prev) => ({ ...prev, factoryId: all[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // ── Load filter options when factoryId changes ────────────────────────────
  useEffect(() => {
    if (!filters.factoryId) return;

    fetchLeafCollectionFilters(filters.factoryId)
      .then((res) => {
        const months = res.months || [];
        const fetchedRoutes = (res.routes || []).filter(
          (r) => r.route !== "All",
        );
        setRoutes(fetchedRoutes);
        setFilters((prev) => ({ ...prev, _months: months }));
      })
      .catch(() => {});
  }, [filters.factoryId]);

  // ── Filter change ─────────────────────────────────────────────────────────
  function handleFilterChange(key, value) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // If month changed, clamp the selected day to the new month's max days
      if (key === "month" && prev.day > 0) {
        const max = daysInMonth(value);
        if (prev.day > max) next.day = 0;
      }
      return next;
    });
    setReportData(null);
    setError("");
  }

  // ── Load report ───────────────────────────────────────────────────────────
  const handleLoad = useCallback(async () => {
    if (!filters.factoryId) return;
    setLoading(true);
    setError("");
    setReportData(null);

    const params = {
      month: filters.month !== "All" ? filters.month : undefined,
      day: filters.day > 0 ? filters.day : undefined,
      route: filters.route !== "All" ? filters.route : undefined,
    };

    try {
      let data;
      if (activeReport === "route-wise-weighing") {
        data = await fetchRouteWiseWeighingReport(filters.factoryId, params);
      } else if (activeReport === "leaf-transfer") {
        data = await fetchLeafTransferReport(filters.factoryId, params);
      } else {
        data = await fetchWeighingDetailsReport(filters.factoryId, params);
      }
      setReportData(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load report.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeReport, filters]);

  // Reset report data when report type changes
  useEffect(() => {
    setReportData(null);
    setError("");
  }, [activeReport]);

  const activeReportMeta = REPORT_TYPES.find((r) => r.id === activeReport);

  // Filter label for print title
  const filterLabel = [
    filters.month !== "All" ? filters.month : null,
    filters.day > 0 ? `Day ${filters.day}` : null,
    filters.route !== "All" ? filters.route : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const factoryName =
    reportData?.factoryName ||
    factories.find((f) => f.id === filters.factoryId)?.name ||
    "";

  return (
    <div className="h-screen flex flex-col gap-4 px-5 py-4 overflow-hidden">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <header className="no-print shrink-0 bg-white/75 backdrop-blur-md rounded-2xl border border-black/6 shadow-lg px-5 py-3.5">
        <p className="text-overline text-slate-400">Analytics</p>
        <h1 className="font-display text-2xl text-slate-900 leading-tight">
          Reports
        </h1>
      </header>

      {/* ── Report type tabs ─────────────────────────────────────────── */}
      <div className="no-print shrink-0 flex gap-2 flex-wrap">
        {REPORT_TYPES.map((rt) => {
          const active = activeReport === rt.id;
          return (
            <button
              key={rt.id}
              type="button"
              onClick={() => setActiveReport(rt.id)}
              className={[
                "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-200",
                active
                  ? `${rt.accentBg} border-transparent text-white shadow-md`
                  : "bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <span className="text-base leading-none">{rt.icon}</span>
              <span>{rt.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Controls card ────────────────────────────────────────────── */}
      <div className="no-print shrink-0 bg-white/75 backdrop-blur-md rounded-2xl border border-black/6 shadow-lg px-5 py-4 animate-rise">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <FilterBar
            factories={factories}
            filters={filters}
            routes={routes}
            onChange={handleFilterChange}
            loading={loading}
            onLoad={handleLoad}
          />

          {reportData && (
            <div className="mt-auto">
              <DownloadPdfButton
                reportType={activeReport}
                reportData={reportData}
                reportLabel={activeReportMeta?.label}
                factoryName={factoryName}
                filterLabel={filterLabel}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Report content area ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-black/6 shadow-lg bg-white/75 backdrop-blur-md">
        {/* Idle state */}
        {!loading && !reportData && !error && (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-10 animate-rise">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl ${activeReportMeta?.accentLight} border`}
            >
              {activeReportMeta?.icon}
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl text-slate-700 mb-1">
                {activeReportMeta?.label}
              </h2>
              <p className="text-slate-400 text-sm">{activeReportMeta?.sub}</p>
              <p className="text-slate-400 text-xs mt-2">
                Select filters above and click <strong>Load Report</strong>
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-10">
            <svg
              className="animate-spin h-8 w-8 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <p className="text-slate-400 text-sm">Loading report…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-10">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={handleLoad}
              className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── The actual report ─────────────────────────────────────── */}
        {!loading && reportData && (
          <div className="p-6 bg-white">
            {activeReport === "route-wise-weighing" && (
              <RouteWiseWeighingReport data={reportData} />
            )}
            {activeReport === "leaf-transfer" && (
              <LeafTransferReport data={reportData} />
            )}
            {activeReport === "weighing-details" && (
              <WeighingDetailsReport data={reportData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsView;
