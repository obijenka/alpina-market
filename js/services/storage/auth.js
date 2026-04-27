import { apiGet } from "../api.js";
import { setSession } from "./session.js";

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function loginAdmin({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  if (trimmedLogin !== "admin" || trimmedPassword !== "admin") {
    return { ok: false, message: "Неверный логин или пароль" };
  }

  await setSession({
    id: 1,
    role: "admin",
    userId: "admin",
    login: "admin",
    createdAt: new Date().toISOString(),
  });

  return { ok: true };
}

export async function loginUser({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  const users = await apiGet(`/users?login=${encodeURIComponent(trimmedLogin)}`);
  const user = Array.isArray(users) ? users[0] : null;
  if (!user) return { ok: false, message: "Неверный логин или пароль" };

  const passwordHash = await sha256Hex(trimmedPassword);
  if (String(user.passwordHash ?? "") !== passwordHash) {
    return { ok: false, message: "Неверный логин или пароль" };
  }

  await setSession({
    id: 1,
    role: user.role === "admin" ? "admin" : "user",
    userId: user.id,
    login: user.login,
    createdAt: new Date().toISOString(),
  });

  return { ok: true };
}
