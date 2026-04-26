import { OFFERS } from "../data/offers.js";
import { RECENT_ITEMS } from "../data/recent.js";
import { renderOffers } from "../renderers/offers.js";
import { renderRecent } from "../renderers/recent.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addOfferToCart,
  getCartItems,
  getSession,
  getWishlistOfferIds,
  migrateGuestWishlistAndCartToUser,
  toggleWishlistOffer,
} from "../services/storage.js";
import { bindBookingModalTrigger, initBookingModal } from "../booking/bookingModal.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const offersGrid = document.getElementById("offersGrid");
  renderOffers(OFFERS, offersGrid);
  syncOfferFavIcons(offersGrid);
  syncOfferCartButtons(offersGrid);

  if (offersGrid) {
    offersGrid.addEventListener("click", (e) => {
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
        syncOfferFavIcons(offersGrid);
        return;
      }

      const cartBtn = target.closest(".offer-card__cart");
      if (cartBtn) {
        e.preventDefault();
        addOfferToCart(offerId, 1);
        syncOfferCartButtons(offersGrid);
      }
    });
  }

  const recentGrid = document.getElementById("recentGrid");
  renderRecent(RECENT_ITEMS, recentGrid);

  initAuthModal();

  initBookingModal();
  bindBookingModalTrigger({ selector: "#bookingAction" });

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
    syncOfferFavIcons(offersGrid);
    syncOfferCartButtons(offersGrid);
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

  if (burger && menu) {
    burger.addEventListener("click", openMenu);
  }

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
