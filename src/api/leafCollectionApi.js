import { getStoredAuthToken } from "../lib/authSession";
import { api } from "./httpClient";

export async function fetchFactories() {
  const response = await api.get("/api/leaf-collection/factories");
  return response.data;
}

export async function fetchLeafCollectionFilters(factoryId) {
  const response = await api.get("/api/leaf-collection/filters", {
    params: { factoryId },
  });
  return response.data;
}

export async function fetchLeafCollectionDashboard(factoryId, filters) {
  const response = await api.get("/api/leaf-collection/dashboard", {
    params: {
      factoryId,
      ...filters,
    },
  });
  return response.data;
}

export async function fetchFactorySummaries(filters) {
  const response = await api.get("/api/leaf-collection/factory-summaries", {
    params: filters,
  });
  return response.data;
}

export async function deleteLeafCollectionRecord(factoryId, recordId, userName) {
  const response = await api.delete(`/api/leaf-collection/records/${recordId}`, {
    params: { factoryId },
    data: { userName },
  });
  return response.data;
}

export function createLeafCollectionSocket(factoryId) {
  const baseUrl =
    import.meta.env.VITE_WS_BASE_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  const query = new URLSearchParams({
    factoryId,
  });
  const authToken = getStoredAuthToken();

  if (authToken) {
    query.set("authToken", authToken);
  }

  return new WebSocket(`${baseUrl}/ws/leaf-collection?${query.toString()}`);
}
