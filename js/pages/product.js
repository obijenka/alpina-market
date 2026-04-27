import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import { addOfferToCart, getCartItems, getProductById, getSession, getWishlistOfferIds, toggleWishlistOffer } from "../services/index.js";

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
  })();

  initAuthModal();

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
