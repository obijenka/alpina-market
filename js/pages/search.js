import { renderOffers } from "../renderers/offers.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addOfferToCart,
  getCartItems,
  getProducts,
  getSession,
  getWishlistOfferIds,
  migrateGuestOrdersToUser,
  migrateGuestWishlistAndCartToUser,
  toggleWishlistOffer,
} from "../services/index.js";

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function collectSearchHaystack(product) {
  const parts = [];

  parts.push(product?.id);
  parts.push(product?.sku);
  parts.push(product?.title);
  parts.push(product?.description);
  parts.push(product?.category);

  if (Array.isArray(product?.categories)) parts.push(product.categories.join(" "));
  if (Array.isArray(product?.tags)) parts.push(product.tags.join(" "));
  if (Array.isArray(product?.searchKeywords)) parts.push(product.searchKeywords.join(" "));

  const attrs = product?.attributes && typeof product.attributes === "object" ? product.attributes : null;
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      parts.push(k);
      parts.push(v);
    });
  }

  return norm(parts.filter(Boolean).join(" "));
}

function productToOfferLike(product) {
  return {
    ...product,
    price: product.priceText ?? (typeof product.price === "number" ? `${product.price.toLocaleString("ru-RU")} руб.` : product.price),
    image: product.image ?? product.images?.[0],
    size: product.size ?? product.attributes?.size ?? "",
    badge: product.badge ?? product.promoLabel ?? "",
  };
}

async function syncOfferFavIcons(rootEl) {
  if (!rootEl) return;
  const wishlist = new Set(await getWishlistOfferIds());
  rootEl.querySelectorAll(".offer-card").forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    const offerId = String(card.dataset.offerId ?? "");
    const favBtn = card.querySelector(".offer-card__fav");
    if (!(favBtn instanceof HTMLElement)) return;
    const img = favBtn.querySelector("img");
    if (!(img instanceof HTMLImageElement)) return;
    const inWishlist = wishlist.has(offerId);
    img.src = inWishlist ? "assets/icons/fav.svg" : "assets/icons/fav-black.svg";
  });
}

async function syncOfferCartButtons(rootEl) {
  if (!rootEl) return;
  const cart = new Set((await getCartItems()).map((i) => String(i.offerId)));
  rootEl.querySelectorAll(".offer-card").forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    const offerId = String(card.dataset.offerId ?? "");
    const cartBtn = card.querySelector(".offer-card__cart");
    if (!(cartBtn instanceof HTMLButtonElement)) return;
    const inCart = cart.has(offerId);
    cartBtn.classList.toggle("is-in-cart", inCart);
    cartBtn.setAttribute("aria-label", inCart ? "В корзине" : "В корзину");
  });
}

function getQuery() {
  const url = new URL(window.location.href);
  return String(url.searchParams.get("q") ?? "").trim();
}

function setHeaderSearchValue(q) {
  const input = document.querySelector(".header__search-input");
  if (input instanceof HTMLInputElement) input.value = q;
}

async function renderSearch() {
  const q = getQuery();
  setHeaderSearchValue(q);

  const grid = document.getElementById("searchGrid");
  const meta = document.getElementById("searchMeta");
  const empty = document.getElementById("searchEmpty");

  const products = await getProducts();
  const list = Array.isArray(products) ? products : [];

  const queryNorm = norm(q);
  const tokens = queryNorm.split(/\s+/).filter(Boolean);

  const items = tokens.length
    ? list.filter((p) => {
        const hay = collectSearchHaystack(p);
        return tokens.every((t) => hay.includes(t));
      })
    : [];

  const offerLike = items.map(productToOfferLike);

  if (meta) {
    meta.textContent = tokens.length ? `Запрос: ${q} — найдено: ${items.length}` : "Введите запрос в поиске";
  }

  if (empty) {
    empty.style.display = tokens.length && items.length === 0 ? "block" : "none";
  }

  renderOffers(offerLike, grid);
  await syncOfferFavIcons(grid);
  await syncOfferCartButtons(grid);

  if (grid) {
    grid.addEventListener("click", (e) => {
      void (async () => {
        const target = e.target;
        if (!(target instanceof Element)) return;

        const card = target.closest(".offer-card");
        if (!(card instanceof HTMLElement)) return;
        const offerId = String(card.dataset.offerId ?? "").trim();
        if (!offerId) return;

        const favBtn = target.closest(".offer-card__fav");
        if (favBtn) {
          e.preventDefault();
          const session = await getSession();
          if (session?.role !== "user") {
            openAuthModal();
            return;
          }
          await toggleWishlistOffer(offerId);
          await syncOfferFavIcons(grid);
          return;
        }

        const cartBtn = target.closest(".offer-card__cart");
        if (cartBtn) {
          e.preventDefault();
          await addOfferToCart(offerId, 1);
          await syncOfferCartButtons(grid);
          return;
        }

        e.preventDefault();
        window.location.href = `product.html?id=${encodeURIComponent(offerId)}`;
      })();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void renderSearch();

  initAuthModal();

  document.addEventListener("alpina:session-changed", () => {
    void (async () => {
      await migrateGuestWishlistAndCartToUser();
      await migrateGuestOrdersToUser();
      await renderSearch();
    })();
  });

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
