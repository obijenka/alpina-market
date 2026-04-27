import { apiGet, apiPatch } from "../api.js";
import { getSession } from "./session.js";
import { getGuest, patchGuest } from "./guest.js";

function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const offerId = String(item.offerId ?? "").trim();
      const qty = Number(item.qty ?? 1);
      if (!offerId) return null;
      if (!Number.isFinite(qty) || qty <= 0) return null;
      return { offerId, qty };
    })
    .filter(Boolean);
}

export async function getCartItems() {
  const session = await getSession();
  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    return normalizeCart(user.cart);
  }
  const guest = await getGuest();
  return normalizeCart(guest.cart);
}

async function setCartItems(items) {
  const normalized = normalizeCart(items);
  const session = await getSession();
  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    await apiPatch(`/users/${encodeURIComponent(user.id)}`, { cart: normalized, updatedAt: new Date().toISOString() });
    return { ok: true };
  }
  await patchGuest({ cart: normalized });
  return { ok: true };
}

export async function addOfferToCart(offerId, qty = 1) {
  const id = String(offerId ?? "").trim();
  const addQty = Number(qty);
  if (!id || !Number.isFinite(addQty) || addQty <= 0) return { ok: false };

  const current = await getCartItems();
  const existing = current.find((i) => i.offerId === id);
  const next = existing
    ? current.map((i) => (i.offerId === id ? { ...i, qty: i.qty + addQty } : i))
    : [{ offerId: id, qty: addQty }, ...current];

  return setCartItems(next);
}

export async function updateCartOfferQty(offerId, qty) {
  const id = String(offerId ?? "").trim();
  const nextQty = Number(qty);
  if (!id || !Number.isFinite(nextQty)) return { ok: false };
  if (nextQty <= 0) return removeOfferFromCart(id);

  const current = await getCartItems();
  const next = current.some((i) => i.offerId === id)
    ? current.map((i) => (i.offerId === id ? { ...i, qty: nextQty } : i))
    : [{ offerId: id, qty: nextQty }, ...current];

  return setCartItems(next);
}

export async function removeOfferFromCart(offerId) {
  const id = String(offerId ?? "").trim();
  if (!id) return { ok: false };
  const current = await getCartItems();
  const next = current.filter((i) => i.offerId !== id);
  return setCartItems(next);
}

export async function clearCart() {
  return setCartItems([]);
}
