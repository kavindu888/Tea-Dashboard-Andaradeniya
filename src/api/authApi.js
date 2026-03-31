import { api } from "./httpClient";

export async function loginWebUser(userName, password) {
  const response = await api.post(
    "/api/auth/login",
    {
      userName,
      password,
    },
    {
      skipAuth: true,
      skipAuthRedirect: true,
    },
  );

  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/api/auth/me", {
    skipAuthRedirect: true,
  });
  return response.data;
}

export async function logoutWebUser() {
  await api.post(
    "/api/auth/logout",
    {},
    {
      skipAuthRedirect: true,
    },
  );
}
