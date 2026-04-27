import { apiGet, apiPatch, apiPost } from "../api.js";
import { getSession } from "./session.js";
import { getGuest, patchGuest } from "./guest.js";
import { getUsers } from "./users.js";

function normalizeOrders(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((o) => o && typeof o === "object");
}

export async function getOrders() {
  const session = await getSession();
  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    return normalizeOrders(user.orders);
  }
  const guest = await getGuest();
  return normalizeOrders(guest.orders);
}

export async function addOrder({ items, total, customer }) {
  const session = await getSession();
  const order = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    status: "current",
    createdAt: new Date().toISOString(),
    items: Array.isArray(items) ? items : [],
    total: Number(total ?? 0),
    customer: customer && typeof customer === "object" ? customer : {},
    owner: session?.role === "user" ? { type: "user", userId: session.userId } : { type: "guest", userId: "" },
  };

  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    const current = normalizeOrders(user.orders);
    const next = [order, ...current];
    await apiPatch(`/users/${encodeURIComponent(user.id)}`, { orders: next, updatedAt: new Date().toISOString() });
    await apiPost("/orders", order);
    return { ok: true, order };
  }

  const guest = await getGuest();
  const current = normalizeOrders(guest.orders);
  const next = [order, ...current];
  await patchGuest({ orders: next });
  await apiPost("/orders", order);
  return { ok: true, order };
}

export async function getAllOrdersAdmin() {
  const users = await getUsers();
  const all = [];

  users.forEach((u) => {
    normalizeOrders(u.orders).forEach((o) => {
      all.push({ ...o, ownerLogin: u.login ?? "" });
    });
  });

  const guest = await getGuest();
  normalizeOrders(guest.orders).forEach((o) => {
    all.push({ ...o, ownerLogin: "Гость" });
  });

  all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return all;
}

export async function updateOrderStatusAdmin(orderId, status) {
  const id = String(orderId ?? "").trim();
  const nextStatus = String(status ?? "").trim();
  if (!id || !nextStatus) return { ok: false };

  const users = await getUsers();
  for (const u of users) {
    const orders = normalizeOrders(u.orders);
    if (!orders.some((o) => o.id === id)) continue;
    const next = orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    await apiPatch(`/users/${encodeURIComponent(u.id)}`, { orders: next, updatedAt: new Date().toISOString() });
    break;
  }

  const guest = await getGuest();
  const gOrders = normalizeOrders(guest.orders);
  if (gOrders.some((o) => o.id === id)) {
    const next = gOrders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    await patchGuest({ orders: next });
  }

  const allOrders = await apiGet(`/orders?id=${encodeURIComponent(id)}`);
  if (Array.isArray(allOrders) && allOrders[0]) {
    await apiPatch(`/orders/${encodeURIComponent(allOrders[0].id)}`, { status: nextStatus });
  }

  return { ok: true };
}

export async function migrateGuestWishlistAndCartToUser() {
  const session = await getSession();
  if (session?.role !== "user") return { ok: false };

  const guest = await getGuest();
  const guestWishlist = Array.isArray(guest.wishlist) ? guest.wishlist.map(String) : [];
  const guestCart = Array.isArray(guest.cart) ? guest.cart : [];

  if (guestWishlist.length === 0 && guestCart.length === 0) return { ok: true };

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const currentWishlist = Array.isArray(user.wishlist) ? user.wishlist.map(String) : [];
  const nextWishlist = Array.from(new Set([...guestWishlist, ...currentWishlist]));

  const currentCart = Array.isArray(user.cart) ? user.cart : [];
  const nextCart = [...currentCart];
  guestCart.forEach((gi) => {
    const offerId = String(gi.offerId ?? "").trim();
    const qty = Number(gi.qty ?? 0);
    if (!offerId || !Number.isFinite(qty) || qty <= 0) return;

    const ex = nextCart.find((i) => String(i.offerId) === offerId);
    if (ex) ex.qty = Number(ex.qty ?? 0) + qty;
    else nextCart.push({ offerId, qty });
  });

  await apiPatch(`/users/${encodeURIComponent(user.id)}`, {
    wishlist: nextWishlist,
    cart: nextCart,
    updatedAt: new Date().toISOString(),
  });

  await patchGuest({ wishlist: [], cart: [] });
  return { ok: true };
}

export async function migrateGuestOrdersToUser() {
  const session = await getSession();
  if (session?.role !== "user") return { ok: false };

  const guest = await getGuest();
  const guestOrders = normalizeOrders(guest.orders);
  if (guestOrders.length === 0) return { ok: true };

  const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
  const currentOrders = normalizeOrders(user.orders);
  const nextOrders = [...guestOrders, ...currentOrders];

  await apiPatch(`/users/${encodeURIComponent(user.id)}`, { orders: nextOrders, updatedAt: new Date().toISOString() });
  await patchGuest({ orders: [] });
  return { ok: true };
}
