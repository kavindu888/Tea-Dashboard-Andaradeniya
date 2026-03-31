import { startTransition, useEffect, useState } from "react";
import { fetchCurrentUser, loginWebUser, logoutWebUser } from "./api/authApi";
import { AUTH_UNAUTHORIZED_EVENT } from "./api/httpClient";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from "./lib/authSession";
import Sidebar from "./components/Sidebar";
import DashboardView from "./views/DashboardView";
import LeafCollectionView from "./views/LeafCollectionView";
import LoginView from "./views/LoginView";
import ReportsView from "./views/ReportsView";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function AppShell({ session, onLogout, isLoggingOut }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  function renderPage() {
    if (currentPage === "leaf-collection") return <LeafCollectionView />;
    if (currentPage === "reports") return <ReportsView />;
    return <DashboardView />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={session.user}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="flex-1 min-w-0 overflow-hidden">{renderPage()}</main>
    </div>
  );
}

function App() {
  const [authState, setAuthState] = useState(() => {
    const stored = getStoredAuthSession();
    return stored?.token
      ? { status: "restoring", session: stored, errorMessage: "" }
      : { status: "signed-out", session: null, errorMessage: "" };
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuthSession();
      setIsLoggingOut(false);
      startTransition(() => {
        setAuthState((cur) => ({
          status: "signed-out",
          session: null,
          errorMessage:
            cur.status === "signed-out"
              ? cur.errorMessage
              : "Your session expired. Please sign in again.",
        }));
      });
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  useEffect(() => {
    if (authState.status !== "restoring" || !authState.session?.token) return undefined;
    let cancelled = false;

    async function restore() {
      try {
        const res = await fetchCurrentUser();
        const next = { ...authState.session, user: res.user, expiresAt: res.expiresAt };
        storeAuthSession(next);
        if (!cancelled) startTransition(() => setAuthState({ status: "authenticated", session: next, errorMessage: "" }));
      } catch {
        clearStoredAuthSession();
        if (!cancelled) startTransition(() => setAuthState({ status: "signed-out", session: null, errorMessage: "Your session expired. Please sign in again." }));
      }
    }

    restore();
    return () => { cancelled = true; };
  }, [authState.session, authState.status]);

  async function handleLogin(credentials) {
    setAuthState((cur) => ({ ...cur, status: "signing-in", errorMessage: "" }));
    try {
      const res = await loginWebUser(credentials.userName, credentials.password);
      const next = { token: res.token, expiresAt: res.expiresAt, user: res.user };
      storeAuthSession(next);
      startTransition(() => setAuthState({ status: "authenticated", session: next, errorMessage: "" }));
    } catch (err) {
      clearStoredAuthSession();
      startTransition(() => setAuthState({ status: "signed-out", session: null, errorMessage: getErrorMessage(err, "Sign in failed.") }));
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logoutWebUser(); } catch { /* ignore */ }
    finally {
      clearStoredAuthSession();
      startTransition(() => {
        setIsLoggingOut(false);
        setAuthState({ status: "signed-out", session: null, errorMessage: "" });
      });
    }
  }

  if (authState.status === "restoring") {
    return <LoginView busy errorMessage="" onSubmit={handleLogin} statusMessage="Checking saved session…" />;
  }

  if (authState.status !== "authenticated") {
    return (
      <LoginView
        busy={authState.status === "signing-in"}
        errorMessage={authState.errorMessage}
        onSubmit={handleLogin}
      />
    );
  }

  return <AppShell session={authState.session} onLogout={handleLogout} isLoggingOut={isLoggingOut} />;
}

export default App;
