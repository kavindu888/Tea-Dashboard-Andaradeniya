import { api } from "./httpClient";

export async function fetchRouteWiseWeighingReport(factoryId, filters) {
  const response = await api.get("/api/reports/route-wise-weighing", {
    params: { factoryId, ...filters },
  });
  return response.data;
}

export async function fetchLeafTransferReport(factoryId, filters) {
  const response = await api.get("/api/reports/leaf-transfer", {
    params: { factoryId, ...filters },
  });
  return response.data;
}

export async function fetchWeighingDetailsReport(factoryId, filters) {
  const response = await api.get("/api/reports/weighing-details", {
    params: { factoryId, ...filters },
  });
  return response.data;
}
