const NAV_ITEMS = [
  { id: "dashboard",       label: "Dashboard",       sub: "Overview & summaries", icon: "◈" },
  { id: "leaf-collection", label: "Leaf Collection", sub: "Live intake stream",   icon: "⊞" },
  { id: "reports",         label: "Reports",          sub: "Coming soon",          icon: "▤" },
];

function Sidebar({ currentPage, onNavigate, currentUser, onLogout, isLoggingOut }) {
  return (
    <aside className="relative w-64 h-screen flex flex-col gap-2 px-4 py-6 overflow-hidden shrink-0
      bg-gradient-to-b from-[#0c1f18] via-[#163527] to-[#1f4535] text-emerald-50">

      {/* Decorative bottom-right glow */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-52 h-52 rounded-full bg-white/[0.04] blur-2xl" />

      {/* ── Brand ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] flex items-center justify-center
          bg-gradient-to-br from-white/95 to-white/70 border border-white/20 shadow-lg
          text-emerald-900 font-display font-bold text-lg">
          LW
        </div>
        <div className="min-w-0">
          <p className="text-overline text-emerald-300/50 mb-0.5">
            Leaf Weighing
          </p>
          <h2 className="font-display text-emerald-50 text-[1.05rem] leading-tight truncate">
            System
          </h2>
          <p className="text-emerald-200/40 text-[0.72rem]">Web Dashboard</p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-overline text-emerald-300/40 px-1 mb-2">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left w-full transition-all duration-200",
                active
                  ? "bg-white/[0.16] border border-white/[0.1] shadow-md translate-x-0.5"
                  : "border border-transparent hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <span className={[
                "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base border border-white/[0.1] transition-colors",
                active ? "bg-white/[0.22]" : "bg-white/[0.07]",
              ].join(" ")}>
                {item.icon}
              </span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <strong className="text-emerald-50 text-sm font-semibold leading-tight">
                  {item.label}
                </strong>
                <small className="text-emerald-200/50 text-[0.7rem] leading-tight truncate">
                  {item.sub}
                </small>
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── User info card ────────────────────────────── */}
      <div className="rounded-xl bg-white/[0.07] border border-white/[0.07] px-4 py-3">
        <strong className="text-emerald-50 text-sm block truncate">
          {currentUser?.fullName || currentUser?.userName || "User"}
        </strong>
        <span className="text-emerald-200/40 text-[0.72rem]">
          Signed in · Web Dashboard
        </span>
      </div>

      {/* ── Logout ────────────────────────────────────── */}
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="h-10 rounded-xl border border-white/[0.1] text-emerald-300/60 text-sm
          hover:bg-red-500/[0.15] hover:text-red-200/90 hover:border-red-400/20
          transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoggingOut ? "Signing out…" : "Logout"}
      </button>
    </aside>
  );
}

export default Sidebar;
