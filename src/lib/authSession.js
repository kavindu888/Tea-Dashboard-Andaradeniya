const STORAGE_KEY = "leaf-collection-dashboard.auth";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    return typeof parsedValue.token === "string" && parsedValue.token
      ? parsedValue
      : null;
  } catch (error) {
    return null;
  }
}

export function getStoredAuthToken() {
  return getStoredAuthSession()?.token || "";
}

export function storeAuthSession(session) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
