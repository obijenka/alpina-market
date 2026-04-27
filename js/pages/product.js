import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addOfferToCart,
  addReview,
  getCartItems,
  getProductById,
  getReviews,
  getSession,
  getWishlistOfferIds,
  toggleWishlistOffer,
} from "../services/index.js";

function formatRub(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? "");
  return `${num.toLocaleString("ru-RU")} руб.`;
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  const v = url.searchParams.get(name);
  return v ? String(v).trim() : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStars(rating, { readonly = true } = {}) {
  const r = Math.max(0, Math.min(5, Number(rating ?? 0)));
  const stars = Array.from({ length: 5 }).map((_, idx) => {
    const active = idx < Math.round(r);
    const src = active ? "assets/icons/star-yellow.png" : "assets/icons/star.png";
    return `<span class="review-star" aria-hidden="true"><img src="${src}" alt="" /></span>`;
  });
  return `<div class="review-stars${readonly ? " is-readonly" : ""}" aria-label="Оценка">${stars.join("")}</div>`;
}

function formatReviewDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function renderReviewsList(reviews, rootEl) {
  if (!rootEl) return;
  const items = Array.isArray(reviews) ? reviews : [];

  rootEl.innerHTML = items
    .map((r) => {
      const text = escapeHtml(r.text ?? "");
      const author = escapeHtml(r.authorLogin ?? r.authorName ?? "");
      const rating = Number(r.rating ?? 0);
      const createdAt = escapeHtml(formatReviewDate(r.createdAt));

      return `
        <article style="border:1px solid rgba(0,0,0,.08); border-radius: 12px; padding: 12px 14px;">
          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div>${renderStars(rating)}</div>
          </div>
          <div class="review-meta">${author ? author : "—"}${createdAt ? ` · ${createdAt}` : ""}</div>
          <div style="padding-top:10px;">${text}</div>
        </article>
      `.trim();
    })
    .join("");
}

function initReviewStarsPicker() {
  const widget = document.querySelector("[data-review-stars]");
  const form = document.getElementById("reviewForm");
  if (!(widget instanceof HTMLElement) || !(form instanceof HTMLFormElement)) return;

  const ratingInput = form.elements.namedItem("rating");
  if (!(ratingInput instanceof HTMLInputElement)) return;

  let current = Number(ratingInput.value);
  if (!Number.isFinite(current) || current < 1 || current > 5) current = 0;

  function setValue(next) {
    const v = Number(next);
    if (!Number.isFinite(v) || v < 1 || v > 5) return;
    ratingInput.value = String(v);
    render(v);
  }

  function render(value) {
    const v = Math.max(0, Math.min(5, Number(value ?? 0)));
    widget.innerHTML = Array.from({ length: 5 })
      .map((_, idx) => {
        const n = idx + 1;
        const active = idx < v;
        const src = active ? "assets/icons/star-yellow.png" : "assets/icons/star.png";
        return `<button class="review-star" type="button" data-star-value="${n}" aria-label="${n}"><img src="${src}" alt="" /></button>`;
      })
      .join("");
  }

  render(current);

  widget.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest("[data-star-value]");
    if (!(btn instanceof HTMLElement)) return;
    const v = Number(btn.getAttribute("data-star-value"));
    setValue(v);
  });
}

async function loadAndRenderReviews(productId) {
  const listEl = document.getElementById("reviewsList");
  const emptyEl = document.getElementById("reviewsEmpty");

  try {
    const reviews = await getReviews({ productId, status: "approved" });
    const items = Array.isArray(reviews) ? reviews : [];
    renderReviewsList(items, listEl);
    if (emptyEl) {
      emptyEl.textContent = items.length === 0 ? "Отзывов пока нет." : "";
      emptyEl.style.display = items.length === 0 ? "block" : "none";
    }
  } catch {
    if (listEl) listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.textContent = "Не удалось загрузить отзывы.";
      emptyEl.style.display = "block";
    }
  }
}

function initReviewAccordion() {
  const toggles = document.querySelectorAll("[data-review-toggle]");
  if (toggles.length === 0) return;

  toggles.forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;

    btn.addEventListener("click", () => {
      const item = btn.closest("[data-review-item]");
      if (!(item instanceof HTMLElement)) return;

      const body = item.querySelector("[data-review-body]");
      if (!(body instanceof HTMLElement)) return;

      const isOpen = item.classList.contains("is-open");
      const nextOpen = !isOpen;

      if (nextOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        body.style.height = "0px";
        const targetHeight = body.scrollHeight;

        requestAnimationFrame(() => {
          body.style.height = `${targetHeight}px`;
        });

        const onEnd = (e) => {
          if (e.propertyName !== "height") return;
          body.style.height = "auto";
          body.removeEventListener("transitionend", onEnd);
        };

        body.addEventListener("transitionend", onEnd);
        return;
      }

      const currentHeight = body.scrollHeight;
      body.style.height = `${currentHeight}px`;
      requestAnimationFrame(() => {
        body.style.height = "0px";
      });

      const onEnd = (e) => {
        if (e.propertyName !== "height") return;
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        body.removeEventListener("transitionend", onEnd);
      };

      body.addEventListener("transitionend", onEnd);
    });
  });

  document.querySelectorAll("[data-review-item]").forEach((item) => {
    if (!(item instanceof HTMLElement)) return;
    const btn = item.querySelector("[data-review-toggle]");
    const body = item.querySelector("[data-review-body]");
    if (!(btn instanceof HTMLElement) || !(body instanceof HTMLElement)) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    item.classList.toggle("is-open", expanded);
    body.style.height = expanded ? "auto" : "0px";
  });
}

function renderProduct(product, rootEl) {
  if (!rootEl) return;

  const productId = String(product?.id ?? "").trim();

  const title = String(product?.title ?? "").trim();
  const description = String(product?.description ?? "").trim();

  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];
  const mainImage = product?.image ?? images[0] ?? "";

  const badge = product?.badge ?? product?.promoLabel ?? "";

  const priceText =
    product?.priceText ??
    (Number.isFinite(Number(product?.price)) ? formatRub(product.price) : String(product?.price ?? ""));

  const oldPriceText =
    product?.oldPrice != null && Number.isFinite(Number(product.oldPrice)) ? formatRub(product.oldPrice) : "";

  const categories = Array.isArray(product?.categories) ? product.categories : [];
  const tags = Array.isArray(product?.tags) ? product.tags : [];

  const ratingAvg = Number(product?.rating?.avg ?? 0);
  const ratingCount = Number(product?.rating?.count ?? 0);

  const attrs = product?.attributes && typeof product.attributes === "object" ? product.attributes : {};
  const attrsRows = Object.entries(attrs)
    .filter(([_, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => {
      const key = String(k);
      const val = typeof v === "number" ? String(v) : String(v);
      return `<div style="display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06)"><div style="opacity:.7">${key}</div><div>${val}</div></div>`;
    })
    .join("");

  rootEl.innerHTML = `
    <div>
      <div class="product-layout">
        <div class="product-gallery">
          ${mainImage ? `<div class="product-main-image">
            ${badge ? `<div class="product-badge offer-card__badge">${badge}</div>` : ""}
            <button class="product-fav" type="button" aria-label="В избранное" data-product-fav ${productId ? `data-product-id="${productId}"` : ""}>
              <img width="20" height="16" src="assets/icons/fav-black.svg" alt="" />
            </button>
            <img src="${mainImage}" alt="" />
          </div>` : ""}
          ${images.length > 1 ? `<div class="product-thumbs">${images
            .map((src) => `<div class="product-thumb"><img src="${src}" alt="" /></div>`)
            .join("")}</div>` : ""}
        </div>

        <div class="product-info">
          <div style="font-size:22px; font-weight:600;">${title}</div>
          ${description ? `<div style="opacity:.8;">${description}</div>` : ""}

          <div style="display:flex; align-items:baseline; gap:12px;">
            <div style="font-size:22px; font-weight:700;">${priceText}</div>
            ${oldPriceText ? `<div style="opacity:.6; text-decoration:line-through;">${oldPriceText}</div>` : ""}
          </div>

          <div style="opacity:.8;">Рейтинг: ${Number.isFinite(ratingAvg) ? ratingAvg.toFixed(1) : "0.0"} (${Number.isFinite(ratingCount) ? ratingCount : 0})</div>

          ${categories.length ? `<div style="opacity:.8;">Категории: ${categories.map((c) => String(c)).join(", ")}</div>` : ""}
          ${tags.length ? `<div style="opacity:.8;">Теги: ${tags.map((t) => String(t)).join(", ")}</div>` : ""}

          ${product?.inStock === false ? `<div style="color:#b00020;">Нет в наличии</div>` : ""}

          <button class="product-buy" type="button" data-product-buy ${productId ? `data-product-id="${productId}"` : ""} ${product?.inStock === false ? "disabled" : ""}>
            КУПИТЬ
          </button>
        </div>
      </div>

      ${attrsRows ? `<div class="product-attrs"><div style="font-weight:600; margin-bottom:8px;">Характеристики</div>${attrsRows}</div>` : ""}
    </div>
  `.trim();
}

async function syncFavButton(rootEl, productId) {
  if (!rootEl) return;
  const btn = rootEl.querySelector("[data-product-fav]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const img = btn.querySelector("img");
  if (!(img instanceof HTMLImageElement)) return;

  const wishlist = new Set(await getWishlistOfferIds());
  const inWishlist = wishlist.has(String(productId));
  img.src = inWishlist ? "assets/icons/fav.svg" : "assets/icons/fav-black.svg";
}

async function syncBuyButton(rootEl, productId) {
  if (!rootEl) return;
  const btn = rootEl.querySelector("[data-product-buy]");
  if (!(btn instanceof HTMLButtonElement)) return;

  const cart = new Set((await getCartItems()).map((i) => String(i.offerId)));
  const inCart = cart.has(String(productId));
  btn.classList.toggle("is-in-cart", inCart);
  btn.textContent = inCart ? "В КОРЗИНЕ" : "КУПИТЬ";
}

document.addEventListener("DOMContentLoaded", () => {
  void (async () => {
    const productId = getQueryParam("id");
    const titleEl = document.getElementById("productTitle");
    const rootEl = document.getElementById("productRoot");
    const errorEl = document.getElementById("productError");

    const product = await getProductById(productId);

    if (!product) {
      if (errorEl) errorEl.style.display = "block";
      if (rootEl) rootEl.innerHTML = "";
      if (titleEl) titleEl.textContent = "Товар";
      return;
    }

    const title = String(product?.title ?? "Товар");
    if (titleEl) titleEl.textContent = title;
    document.title = `${title} — Alpina Market`;

    renderProduct(product, rootEl);

    const renderedId = String(product?.id ?? "").trim();
    if (renderedId) {
      await syncFavButton(rootEl, renderedId);
      await syncBuyButton(rootEl, renderedId);
      await loadAndRenderReviews(renderedId);

      rootEl.addEventListener("click", (e) => {
        void (async () => {
          const target = e.target;
          if (!(target instanceof Element)) return;

          const favBtn = target.closest("[data-product-fav]");
          if (favBtn) {
            e.preventDefault();
            const session = await getSession();
            if (session?.role !== "user") {
              openAuthModal();
              return;
            }
            await toggleWishlistOffer(renderedId);
            await syncFavButton(rootEl, renderedId);
            return;
          }

          const buyBtn = target.closest("[data-product-buy]");
          if (buyBtn) {
            e.preventDefault();
            await addOfferToCart(renderedId, 1);
            await syncBuyButton(rootEl, renderedId);
          }
        })();
      });
    }

    const reviewForm = document.getElementById("reviewForm");
    const reviewError = document.getElementById("reviewFormError");
    if (reviewForm instanceof HTMLFormElement && renderedId) {
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        void (async () => {
          const session = await getSession();
          if (session?.role !== "user") {
            openAuthModal();
            return;
          }

          const fd = new FormData(reviewForm);
          const rating = Number(fd.get("rating"));
          const text = String(fd.get("text") ?? "").trim();

          const result = await addReview({ productId: renderedId, rating, text });
          if (!result.ok) {
            if (reviewError) reviewError.textContent = result.message;
            return;
          }

          if (reviewError) reviewError.textContent = "";
          reviewForm.reset();
          const ratingEl = reviewForm.elements.namedItem("rating");
          if (ratingEl instanceof HTMLInputElement) ratingEl.value = "";
          initReviewStarsPicker();
        })();
      });
    }
  })();

  initAuthModal();

  initReviewAccordion();
  initReviewStarsPicker();

  const profileAction = document.querySelector("#profileAction");
  if (profileAction) {
    profileAction.addEventListener("click", (e) => {
      e.preventDefault();
      void (async () => {
        const session = await getSession();
        if (session?.role === "user") {
          window.location.href = "profile.html";
          return;
        }
        openAuthModal();
      })();
    });
  }

  const burger = document.querySelector(".header__burger");
  const menu = document.querySelector(".mobile-menu");
  const closeEls = document.querySelectorAll("[data-menu-close]");

  function openMenu() {
    if (!menu) return;
    menu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (burger && menu) burger.addEventListener("click", openMenu);
  closeEls.forEach((el) => el.addEventListener("click", closeMenu));

  if (menu) {
    menu.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a")) closeMenu();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
});
