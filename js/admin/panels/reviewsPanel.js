import { getReviews, recomputeProductRating, removeReview, updateReview } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function renderReviews() {
  const list = document.querySelector("#adminReviewsList");
  if (!list) return;

  const reviews = await getReviews();
  const items = Array.isArray(reviews) ? reviews : [];

  if (items.length === 0) {
    list.innerHTML = '<div class="admin__empty">Отзывов пока нет</div>';
    return;
  }

  list.innerHTML = items
    .map((r) => {
      const id = escapeHtml(r.id);
      const productId = escapeHtml(r.productId);
      const authorLogin = escapeHtml(r.authorLogin ?? "");
      const authorId = escapeHtml(r.authorId ?? "");
      const status = escapeHtml(r.status ?? "pending");
      const rating = Number(r.rating ?? 0);
      const text = escapeHtml(r.text ?? "");

      return `
        <div class="admin-row admin-row--review" data-review-id="${id}" data-review-product-id="${productId}">
          <div class="admin-row__main">
            <div class="admin-row__title">review: ${id}</div>
            <div class="admin-row__meta">productId: ${productId} · author: ${authorLogin || authorId || "—"} · rating: ${escapeHtml(rating)} · status: ${status}</div>

            <div style="display:grid; gap:10px; padding-top:10px;">
              <label class="admin-field">
                <div class="admin-field__label">Текст</div>
                <textarea class="admin-field__input" rows="4" data-review-text>${text}</textarea>
              </label>

              <label class="admin-field">
                <div class="admin-field__label">Оценка (1-5)</div>
                <input class="admin-field__input" type="number" min="1" max="5" value="${escapeHtml(rating)}" data-review-rating />
              </label>

              <label class="admin-field">
                <div class="admin-field__label">Статус</div>
                <select class="admin-field__input" data-review-status>
                  <option value="pending" ${status === "pending" ? "selected" : ""}>pending</option>
                  <option value="approved" ${status === "approved" ? "selected" : ""}>approved</option>
                  <option value="hidden" ${status === "hidden" ? "selected" : ""}>hidden</option>
                </select>
              </label>

              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="admin-btn" type="button" data-review-save>Сохранить</button>
                <button class="admin-btn admin-btn--danger" type="button" data-review-remove>Удалить</button>
              </div>
            </div>
          </div>
        </div>
      `.trim();
    })
    .join("");

  list.querySelectorAll("[data-review-id]").forEach((row) => {
    if (!(row instanceof HTMLElement)) return;
    const reviewId = row.getAttribute("data-review-id") ?? "";
    const productId = row.getAttribute("data-review-product-id") ?? "";
    if (!reviewId) return;

    const saveBtn = row.querySelector("[data-review-save]");
    if (saveBtn instanceof HTMLButtonElement) {
      saveBtn.addEventListener("click", () => {
        void (async () => {
          const textEl = row.querySelector("[data-review-text]");
          const ratingEl = row.querySelector("[data-review-rating]");
          const statusEl = row.querySelector("[data-review-status]");

          const text = textEl instanceof HTMLTextAreaElement ? textEl.value : "";
          const rating = ratingEl instanceof HTMLInputElement ? Number(ratingEl.value) : NaN;
          const status = statusEl instanceof HTMLSelectElement ? statusEl.value : "pending";

          await updateReview(reviewId, { text, rating, status });
          if (productId) await recomputeProductRating(productId);
          await renderReviews();
        })();
      });
    }

    const removeBtn = row.querySelector("[data-review-remove]");
    if (removeBtn instanceof HTMLButtonElement) {
      removeBtn.addEventListener("click", () => {
        void (async () => {
          await removeReview(reviewId);
          if (productId) await recomputeProductRating(productId);
          await renderReviews();
        })();
      });
    }
  });
}
