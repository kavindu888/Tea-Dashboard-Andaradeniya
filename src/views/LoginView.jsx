import { useState } from "react";

function LoginView({ busy, errorMessage, onSubmit, statusMessage }) {
  const [credentials, setCredentials] = useState({ userName: "", password: "" });

  function updateField(field, value) {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ userName: credentials.userName.trim(), password: credentials.password });
  }

  return (
    <main className="h-screen flex items-center justify-center p-6 overflow-hidden">
      <section className="w-full max-w-[420px] animate-rise">

        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-lg">
            LW
          </div>
          <div>
            <p className="text-overline text-emerald-600">
              Leaf Weighing System
            </p>
            <p className="text-slate-500 text-xs">Web Dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-black/[0.07] shadow-2xl p-8 flex flex-col gap-5">

          <div>
            <h1 className="font-display text-[1.9rem] text-slate-900 leading-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sign in with your web-enabled factory account to access the live
              collection dashboard.
            </p>
          </div>

          {statusMessage && (
            <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-semibold text-sm">
              {errorMessage}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-overline text-slate-400">
                User Name
              </span>
              <input
                value={credentials.userName}
                onChange={(e) => updateField("userName", e.target.value)}
                placeholder="master"
                autoComplete="username"
                disabled={busy}
                className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm outline-none
                  focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-overline text-slate-400">
                Password
              </span>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={busy}
                className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm outline-none
                  focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-12 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-600 text-white font-bold text-sm tracking-wide
                shadow-lg shadow-emerald-900/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/30
                active:translate-y-0 transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {busy ? "Signing in…" : "Login to Dashboard"}
            </button>
          </form>

          <p className="text-xs text-slate-400 leading-relaxed text-center">
            Access is restricted to web-allowed accounts only.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginView;
