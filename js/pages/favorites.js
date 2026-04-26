import { OFFERS } from "../data/offers.js";
import { renderOffers } from "../renderers/offers.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addOfferToCart,
  getCartItems,
  getSession,
  getWishlistOfferIds,
  migrateGuestOrdersToUser,
  migrateGuestWishlistAndCartToUser,
  toggleWishlistOffer,
} from "../services/storage.js";

function syncOfferFavIcons(rootEl) {
  if (!rootEl) return;
  const wishlist = new Set(getWishlistOfferIds());
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

function syncOfferCartButtons(rootEl) {
  if (!rootEl) return;
  const cart = new Set(getCartItems().map((i) => String(i.offerId)));
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

function renderWishlist() {
  const rootEl = document.getElementById("favoritesGrid");
  const emptyEl = document.getElementById("favoritesEmpty");

  const wishlistIds = getWishlistOfferIds();
  const wishlist = new Set(wishlistIds);
  const items = OFFERS.filter((o) => wishlist.has(String(o.id)));

  if (emptyEl) {
    emptyEl.style.display = items.length === 0 ? "block" : "none";
  }

  renderOffers(items, rootEl);
  syncOfferFavIcons(rootEl);
  syncOfferCartButtons(rootEl);
}

document.addEventListener("DOMContentLoaded", () => {
  renderWishlist();

  const grid = document.getElementById("favoritesGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const card = target.closest(".offer-card");
      if (!(card instanceof HTMLElement)) return;
      const offerId = String(card.dataset.offerId ?? "").trim();
      if (!offerId) return;

      const favBtn = target.closest(".offer-card__fav");
      if (favBtn) {
        e.preventDefault();
        toggleWishlistOffer(offerId);
        renderWishlist();
        return;
      }

      const cartBtn = target.closest(".offer-card__cart");
      if (cartBtn) {
        e.preventDefault();
        addOfferToCart(offerId, 1);
        renderWishlist();
      }
    });
  }

  initAuthModal();

  const profileAction = document.querySelector("#profileAction");
  if (profileAction) {
    profileAction.addEventListener("click", (e) => {
      e.preventDefault();
      const session = getSession();
      if (session?.role === "user") {
        window.location.href = "profile.html";
        return;
      }
      openAuthModal();
    });
  }

  document.addEventListener("alpina:session-changed", () => {
    migrateGuestWishlistAndCartToUser();
    migrateGuestOrdersToUser();
    renderWishlist();
  });

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

  if (burger) burger.addEventListener("click", openMenu);
  closeEls.forEach((el) => el.addEventListener("click", closeMenu));
});
