function fmt(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildGradient(segments) {
  const total = segments.reduce((sum, s) => sum + Number(s.value || 0), 0);
  if (total <= 0) return "conic-gradient(#d1fae5 0deg 360deg)";

  let start = 0;
  const stops = segments.map((s) => {
    const deg = (Number(s.value || 0) / total) * 360;
    const stop = `${s.color} ${start.toFixed(2)}deg ${(start + deg).toFixed(2)}deg`;
    start += deg;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/**
 * PieLegendChart — renders a conic pie + legend table.
 * The parent is responsible for the card container.
 * Pass compact={true} for a smaller layout (e.g. inside a summary card).
 */
function PieLegendChart({ segments = [], compact = false }) {
  const total = segments.reduce((sum, s) => sum + Number(s.value || 0), 0);
  const gradient = buildGradient(segments);

  if (compact) {
    return (
      <div className="flex items-center gap-4 mt-1">
        {/* Small pie */}
        <div
          className="shrink-0 w-24 h-24 rounded-full p-2.5 grid place-items-center shadow-inner"
          style={{
            backgroundImage: gradient,
            boxShadow: "inset 0 0 0 8px rgba(255,255,255,0.35)",
          }}
        >
          <div className="w-[58%] h-[58%] rounded-full bg-white/90 shadow grid place-items-center text-center p-1">
            <span className="text-[0.55rem] text-slate-400 leading-tight">Total</span>
            <strong className="text-[0.7rem] text-slate-700 block leading-tight">
              {Number(total).toFixed(0)}
            </strong>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex flex-col gap-1.5 flex-1 min-w-0">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[0.72rem] text-slate-500 truncate flex-1">{s.label}</span>
              <strong className="text-[0.72rem] text-slate-700 shrink-0">{fmt(s.value)}</strong>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* Full size */
  return (
    <div className="flex items-center gap-6 mt-3">
      <div
        className="shrink-0 w-36 h-36 rounded-full p-4 grid place-items-center"
        style={{
          backgroundImage: gradient,
          boxShadow: "inset 0 0 0 12px rgba(255,255,255,0.34)",
        }}
      >
        <div className="w-[60%] h-[60%] rounded-full bg-white/90 shadow-md grid place-items-center text-center p-2">
          <span className="text-[0.62rem] text-slate-400">Total</span>
          <strong className="text-sm text-slate-700 mt-0.5">{fmt(total)}</strong>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1 min-w-0">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-sm text-slate-500 flex-1 truncate">{s.label}</span>
            <strong className="text-sm text-slate-700 shrink-0">{fmt(s.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PieLegendChart;
