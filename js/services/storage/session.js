import { apiGet, apiPut } from "../api.js";

export async function getSession() {
  const s = await apiGet("/session");
  if (!s || s.role == null) return null;
  return s;
}

export async function setSession(session) {
  await apiPut("/session", session);
}

export async function clearSession() {
  await setSession({ id: 1, role: null, userId: null, login: null, createdAt: null });
}

export function isAdminSession() {
  return getSession().then((s) => s?.role === "admin");
}
