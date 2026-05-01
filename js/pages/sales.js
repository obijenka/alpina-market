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
import { mountLayout } from "../utils/layout.js";
import { applySavedTheme, initThemeSelect } from "../utils/theme.js";

applySavedTheme();

function getDiscountedProducts(products) {
  const list = Array.isArray(products) ? products : [];
  return list.filter((p) => {
    const price = Number(p?.price);
    const oldPrice = Number(p?.oldPrice);
    if (Number.isFinite(price) && Number.isFinite(oldPrice) && oldPrice > price) return true;
    const badge = String(p?.badge ?? p?.promoLabel ?? "").toLowerCase();
    return badge.includes("%") || badge.includes("акц") || badge.includes("скид");
  });
}

function productToOfferLike(product) {
  return {
    ...product,
    price: product.priceText ?? (typeof product.price === "number" ? `${product.price.toLocaleString("ru-RU")} руб.` : product.price),
    oldPrice:
      product.oldPrice != null && product.oldPrice !== ""
        ? product.oldPrice
        : product.oldPriceNumber != null && product.oldPriceNumber !== ""
          ? product.oldPriceNumber
          : undefined,
    oldPriceText:
      product.oldPriceText ??
      (typeof product.oldPrice === "number" ? `${product.oldPrice.toLocaleString("ru-RU")} руб.` : undefined),
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

async function renderSales() {
  const grid = document.getElementById("salesGrid");
  const meta = document.getElementById("salesMeta");
  const empty = document.getElementById("salesEmpty");

  const products = await getProducts();
  const discounted = getDiscountedProducts(products);
  const offerLike = discounted.map(productToOfferLike);

  if (meta) meta.textContent = `Товаров со скидкой: ${discounted.length}`;
  if (empty) empty.style.display = discounted.length === 0 ? "block" : "none";

  renderOffers(offerLike, grid);
  await syncOfferFavIcons(grid);
  await syncOfferCartButtons(grid);
}

function initGridActions() {
  const grid = document.getElementById("salesGrid");
  if (!grid) return;

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

function initHeaderActions() {
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
}

document.addEventListener("DOMContentLoaded", () => {
  mountLayout();
  initThemeSelect();
  initAuthModal();

  initGridActions();
  initHeaderActions();
  void renderSales();

  document.addEventListener("alpina:session-changed", () => {
    void (async () => {
      await migrateGuestWishlistAndCartToUser();
      await migrateGuestOrdersToUser();
      await renderSales();
    })();
  });
});
