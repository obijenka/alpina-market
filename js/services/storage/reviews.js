import { apiDelete, apiGet, apiPatch, apiPost } from "../api.js";
import { getSession } from "./session.js";

function normalizeReviewDraft(value) {
  if (!value || typeof value !== "object") return null;

  const productId = String(value.productId ?? "").trim();
  const rating = Number(value.rating);
  const text = String(value.text ?? "").trim();

  if (!productId) return null;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  if (!text) return null;

  return {
    productId,
    rating,
    text,
  };
}

export async function getReviews({ productId, status } = {}) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", String(productId));
  if (status) params.set("status", String(status));
  const qs = params.toString();
  return apiGet(`/reviews${qs ? `?${qs}` : ""}`);
}

export async function addReview(draft) {
  const normalized = normalizeReviewDraft(draft);
  if (!normalized) return { ok: false, message: "Заполните отзыв корректно" };

  const session = await getSession();
  if (session?.role !== "user" || !session.userId) {
    return { ok: false, message: "Нужно войти в аккаунт" };
  }

  const now = new Date().toISOString();

  const review = await apiPost("/reviews", {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...normalized,
    authorId: String(session.userId),
    authorLogin: String(session.login ?? ""),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return { ok: true, review };
}

export async function updateReview(reviewId, patch) {
  const id = String(reviewId ?? "").trim();
  if (!id) return { ok: false };

  const safePatch = {
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const updated = await apiPatch(`/reviews/${encodeURIComponent(id)}`, safePatch);
  return { ok: true, review: updated };
}

export async function removeReview(reviewId) {
  const id = String(reviewId ?? "").trim();
  if (!id) return { ok: false };
  await apiDelete(`/reviews/${encodeURIComponent(id)}`);
  return { ok: true };
}

export async function recomputeProductRating(productId) {
  const id = String(productId ?? "").trim();
  if (!id) return { ok: false };

  const approved = await getReviews({ productId: id, status: "approved" });
  const list = Array.isArray(approved) ? approved : [];

  const count = list.length;
  const sum = list.reduce((s, r) => s + Number(r?.rating ?? 0), 0);
  const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  await apiPatch(`/products/${encodeURIComponent(id)}`, {
    rating: { avg, count },
    updatedAt: new Date().toISOString(),
  });

  return { ok: true, rating: { avg, count } };
}
