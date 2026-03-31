import axios from "axios";
import { getStoredAuthToken } from "../lib/authSession";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});

api.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const token = getStoredAuthToken();
  if (!token) {
    return config;
  }

  if (typeof config.headers?.set === "function") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !error?.config?.skipAuthRedirect
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  },
);
