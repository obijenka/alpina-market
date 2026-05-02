import { getReviews, recomputeProductRating, removeReview, updateReview } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initReviewStatusDropdown(
  row,
  {
    rootSelector = "[data-review-status-dropdown]",
    buttonSelector = "[data-dropdown-button]",
    menuSelector = "[data-dropdown-menu]",
    optionSelector = "[data-status-value]",
    labelSelector = "[data-dropdown-label]",
    inputSelector = "[data-review-status]",
  } = {}
) {
  if (!(row instanceof HTMLElement)) return;
  const root = row.querySelector(rootSelector);
  if (!(root instanceof HTMLElement)) return;

  const button = root.querySelector(buttonSelector);
  const menu = root.querySelector(menuSelector);
  const label = root.querySelector(labelSelector);
  const hiddenInput = root.querySelector(inputSelector);

  if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;
  if (!(hiddenInput instanceof HTMLInputElement)) return;

  const options = Array.from(root.querySelectorAll(optionSelector)).filter((el) => el instanceof HTMLElement);
  if (options.length === 0) return;

  function setLabel(value) {
    if (!(label instanceof HTMLElement)) return;
    label.textContent = String(value ?? "");
  }

  function close() {
    root.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function open() {
    root.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function toggle() {
    if (root.classList.contains("is-open")) close();
    else open();
  }

  function setValue(next) {
    const value = String(next ?? "pending");
    hiddenInput.value = value;
    setLabel(value);
  }

  setValue(hiddenInput.value);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  options.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const value = String(opt.getAttribute("data-status-value") ?? "pending");
      setValue(value);
      close();
    });
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (!root.contains(target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
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
                <div class="admin-dropdown" data-review-status-dropdown>
                  <input type="hidden" data-review-status value="${status}" />
                  <button class="admin-dropdown__btn" type="button" data-dropdown-button aria-haspopup="listbox" aria-expanded="false">
                    <span class="admin-dropdown__label" data-dropdown-label>${status}</span>
                    <img class="admin-dropdown__chevron" src="assets/icons/chevron.svg" alt="chevron" />
                  </button>
                  <div class="admin-dropdown__menu" data-dropdown-menu role="listbox">
                    <button class="admin-dropdown__option" type="button" data-status-value="pending">pending</button>
                    <button class="admin-dropdown__option" type="button" data-status-value="approved">approved</button>
                    <button class="admin-dropdown__option" type="button" data-status-value="hidden">hidden</button>
                  </div>
                </div>
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

    initReviewStatusDropdown(row);

    const saveBtn = row.querySelector("[data-review-save]");
    if (saveBtn instanceof HTMLButtonElement) {
      saveBtn.addEventListener("click", () => {
        void (async () => {
          const textEl = row.querySelector("[data-review-text]");
          const ratingEl = row.querySelector("[data-review-rating]");
          const statusEl = row.querySelector("[data-review-status]");

          const text = textEl instanceof HTMLTextAreaElement ? textEl.value : "";
          const rating = ratingEl instanceof HTMLInputElement ? Number(ratingEl.value) : NaN;
          const status = statusEl instanceof HTMLInputElement ? statusEl.value : "pending";

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
