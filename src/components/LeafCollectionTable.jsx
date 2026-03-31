function fmtN(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const LEAF_TYPE_STYLE = {
  Normal: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Super:  "bg-blue-100  text-blue-800  border-blue-200",
};

function LeafCollectionTable({ rows, selectedRowId, onSelectRow, abnormalThresholdKg }) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[1180px] border-collapse text-sm">
        <thead>
          <tr>
            {[
              "Factory", "Reg No", "Name", "Type",
              "Bags", "Bag Wt", "Gross", "Coarse", "Water",
              "Rejected", "Norm Dedu", "Super Dedu", "Leaf +/−", "NETT",
            ].map((h) => (
              <th
                key={h}
                className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em]
                  text-emerald-100 bg-gradient-to-b from-[#144230] to-[#0d3123] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {!rows?.length && (
            <tr>
              <td colSpan={14} className="px-4 py-10 text-center text-slate-400 text-sm">
                No records match the current filters.
              </td>
            </tr>
          )}

          {rows?.map((row) => {
            const selected  = row.rowKey === selectedRowId;
            const abnormal  = row.grossWeight >= abnormalThresholdKg;

            return (
              <tr
                key={row.rowKey}
                onClick={() => onSelectRow(row.rowKey)}
                className={[
                  "border-b border-slate-100 transition-colors duration-100 cursor-pointer",
                  selected  ? "bg-emerald-50"             : "hover:bg-slate-50",
                  abnormal  ? "shadow-[inset_3px_0_0_#f59e0b]" : "",
                ].join(" ")}
              >
                {/* Factory */}
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                    bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                    {row.sourceFactoryName}
                  </span>
                </td>

                {/* Reg No */}
                <td className="px-3 py-2.5 font-semibold font-tabular text-slate-700">{row.regNo}</td>

                {/* Name */}
                <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate">{row.regName}</td>

                {/* Leaf type badge */}
                <td className="px-3 py-2.5">
                  <span className={[
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap",
                    LEAF_TYPE_STYLE[row.leafType] || "bg-slate-100 text-slate-700 border-slate-200",
                  ].join(" ")}>
                    {row.leafType}
                  </span>
                </td>

                {/* Bags */}
                <td className="px-3 py-2.5 font-tabular text-slate-600">{row.bagCount}</td>

                {/* Bag Wt */}
                <td className="px-3 py-2.5 font-tabular text-slate-600">{fmtN(row.bagWeight)}</td>

                {/* Gross */}
                <td className="px-3 py-2.5 font-tabular">
                  <span className={abnormal ? "text-amber-600 font-semibold" : "text-slate-600"}>
                    {fmtN(row.grossWeight)}
                  </span>
                  {abnormal && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[0.62rem] font-bold bg-amber-100 text-amber-700">
                      High
                    </span>
                  )}
                </td>

                {/* Deductions */}
                <td className="px-3 py-2.5 font-tabular text-slate-500">{row.coarse}</td>
                <td className="px-3 py-2.5 font-tabular text-slate-500">{row.water}</td>
                <td className="px-3 py-2.5 font-tabular text-slate-500">{row.rejected}</td>
                <td className="px-3 py-2.5 font-tabular text-slate-500">{row.normalDeduction}</td>
                <td className="px-3 py-2.5 font-tabular text-slate-500">{row.superDeduction}</td>

                {/* Excess */}
                <td className={[
                  "px-3 py-2.5 font-medium font-tabular",
                  row.excessLeaf > 0 ? "text-emerald-600" : row.excessLeaf < 0 ? "text-red-500" : "text-slate-400",
                ].join(" ")}>
                  {fmtN(row.excessLeaf)}
                </td>

                {/* NETT */}
                <td className="px-3 py-2.5 font-bold font-tabular text-slate-800">{fmtN(row.netWeight)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LeafCollectionTable;
