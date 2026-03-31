const UPCOMING = [
  { icon: "👤", label: "Supplier Summary",    desc: "Per-supplier leaf totals, payments and balances" },
  { icon: "🛣️", label: "Route-Wise Weighing", desc: "Collection breakdown by transport route"          },
  { icon: "🔁", label: "Leaf Transfer",        desc: "Cross-factory transfer records and audit trail"  },
  { icon: "📋", label: "Weighing Details",     desc: "Full detail export with deduction breakdown"     },
];

function ReportsView() {
  return (
    <div className="h-screen flex flex-col gap-4 px-5 py-4">

      {/* Header */}
      <header className="flex-shrink-0 bg-white/75 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-lg px-5 py-3.5">
        <p className="text-overline text-slate-400">Analytics</p>
        <h1 className="font-display text-2xl text-slate-900 leading-tight">Reports</h1>
      </header>

      {/* Placeholder body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6
        bg-white/70 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-lg p-10 animate-rise">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200
          flex items-center justify-center text-4xl shadow-inner">
          📊
        </div>

        <div className="text-center max-w-md">
          <h2 className="font-display text-2xl text-slate-800 mb-2">Reports Coming Soon</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Detailed analytics and export reports are being built. The following report types will be available:
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
          {UPCOMING.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <strong className="text-sm text-slate-700 block leading-tight">{item.label}</strong>
                <span className="text-xs text-slate-400 leading-snug">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <span className="text-xs text-slate-400 border border-dashed border-slate-300 px-4 py-1.5 rounded-full">
          Implementation planned for a future release
        </span>
      </div>
    </div>
  );
}

export default ReportsView;
