import { apiGet, apiPatch } from "../api.js";
import { getSession } from "./session.js";
import { getGuest, patchGuest } from "./guest.js";

export async function getWishlistOfferIds() {
  const session = await getSession();
  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    return Array.isArray(user.wishlist) ? user.wishlist.map(String) : [];
  }
  const guest = await getGuest();
  return Array.isArray(guest.wishlist) ? guest.wishlist.map(String) : [];
}

export async function toggleWishlistOffer(offerId) {
  const id = String(offerId ?? "").trim();
  if (!id) return { ok: false };

  const session = await getSession();
  if (session?.role === "user") {
    const user = await apiGet(`/users/${encodeURIComponent(session.userId)}`);
    const current = Array.isArray(user.wishlist) ? user.wishlist.map(String) : [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
    await apiPatch(`/users/${encodeURIComponent(user.id)}`, { wishlist: next, updatedAt: new Date().toISOString() });
    return { ok: true, inWishlist: next.includes(id) };
  }

  const guest = await getGuest();
  const current = Array.isArray(guest.wishlist) ? guest.wishlist.map(String) : [];
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  await patchGuest({ wishlist: next });
  return { ok: true, inWishlist: next.includes(id) };
}
