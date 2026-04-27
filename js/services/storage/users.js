import { apiDelete, apiGet, apiPatch, apiPost } from "../api.js";
import { clearSession, getSession } from "./session.js";

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getUsers() {
  return apiGet("/users");
}

export async function addUser({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  if (!trimmedLogin) return { ok: false, message: "Введите логин" };
  if (trimmedPassword.length < 4) return { ok: false, message: "Пароль должен быть минимум 4 символа" };

  const existing = await apiGet(`/users?login=${encodeURIComponent(trimmedLogin)}`);
  if (Array.isArray(existing) && existing.length > 0) {
    return { ok: false, message: "Пользователь с таким логином уже существует" };
  }

  const passwordHash = await sha256Hex(trimmedPassword);
  const user = await apiPost("/users", {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    login: trimmedLogin,
    passwordHash,
    role: "user",
    profile: { fullName: "", phone: "", email: "" },
    addresses: [],
    wishlist: [],
    cart: [],
    orders: [],
    createdAt: new Date().toISOString(),
  });

  return { ok: true, user };
}

export async function removeUser(userId) {
  const id = String(userId ?? "").trim();
  if (!id) return { ok: false };
  await apiDelete(`/users/${encodeURIComponent(id)}`);

  const session = await getSession();
  if (session?.role === "user" && session.userId === id) {
    await clearSession();
  }

  return { ok: true };
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session || session.role !== "user") return null;
  return apiGet(`/users/${encodeURIComponent(session.userId)}`);
}

export async function updateCurrentUserProfile({ fullName, phone, email }) {
  const session = await getSession();
  if (!session || session.role !== "user") return { ok: false, message: "Нет активной сессии" };

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const nextProfile = {
    ...(user.profile ?? {}),
    fullName: String(fullName ?? "").trim(),
    phone: String(phone ?? "").trim(),
    email: String(email ?? "").trim(),
  };

  await apiPatch(`/users/${encodeURIComponent(user.id)}`, {
    profile: nextProfile,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true };
}

export async function getCurrentUserAddresses() {
  const user = await getCurrentUser();
  if (!user) return [];
  return Array.isArray(user.addresses) ? user.addresses : [];
}

export async function addCurrentUserAddress({ label, city, street, house, apartment, comment }) {
  const session = await getSession();
  if (!session || session.role !== "user") return { ok: false, message: "Нет активной сессии" };

  const trimmedCity = String(city ?? "").trim();
  const trimmedStreet = String(street ?? "").trim();
  const trimmedHouse = String(house ?? "").trim();

  if (!trimmedCity || !trimmedStreet || !trimmedHouse) {
    return { ok: false, message: "Заполни город, улицу и дом" };
  }

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const current = Array.isArray(user.addresses) ? user.addresses : [];
  const isFirst = current.length === 0;

  const newAddress = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    label: String(label ?? "").trim(),
    city: trimmedCity,
    street: trimmedStreet,
    house: trimmedHouse,
    apartment: String(apartment ?? "").trim(),
    comment: String(comment ?? "").trim(),
    isDefault: isFirst,
    createdAt: new Date().toISOString(),
  };

  const nextAddresses = isFirst
    ? [newAddress]
    : [
        ...current,
        {
          ...newAddress,
          isDefault: false,
        },
      ];

  await apiPatch(`/users/${encodeURIComponent(user.id)}`, {
    addresses: nextAddresses,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true, address: newAddress };
}

export async function removeCurrentUserAddress(addressId) {
  const session = await getSession();
  if (!session || session.role !== "user") return { ok: false, message: "Нет активной сессии" };

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const current = Array.isArray(user.addresses) ? user.addresses : [];
  const removed = current.find((a) => a.id === addressId);
  const next = current.filter((a) => a.id !== addressId);

  if (removed?.isDefault && next.length > 0) {
    next[0] = { ...next[0], isDefault: true };
  }

  await apiPatch(`/users/${encodeURIComponent(user.id)}`, {
    addresses: next,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true };
}

export async function setCurrentUserDefaultAddress(addressId) {
  const session = await getSession();
  if (!session || session.role !== "user") return { ok: false, message: "Нет активной сессии" };

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const current = Array.isArray(user.addresses) ? user.addresses : [];

  if (!current.some((a) => a.id === addressId)) {
    return { ok: false, message: "Адрес не найден" };
  }

  const next = current.map((a) => ({ ...a, isDefault: a.id === addressId }));
  await apiPatch(`/users/${encodeURIComponent(user.id)}`, {
    addresses: next,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true };
}
