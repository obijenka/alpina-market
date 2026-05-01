import { renderOffers } from "../renderers/offers.js";
import { renderRecent } from "../renderers/recent.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addOfferToCart,
  getCartItems,
  getOffers,
  getRecentItems,
  getSession,
  getWishlistOfferIds,
  migrateGuestOrdersToUser,
  migrateGuestWishlistAndCartToUser,
  toggleWishlistOffer,
} from "../services/index.js";
import { bindBookingModalTrigger, initBookingModal } from "../booking/bookingModal.js";
import { applySavedTheme, initThemeSelect } from "../utils/theme.js";
import { mountLayout } from "../utils/layout.js";

applySavedTheme();

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

document.addEventListener("DOMContentLoaded", () => {
  mountLayout();
  initThemeSelect();
  void (async () => {
    const offersGrid = document.getElementById("offersGrid");
    const recentGrid = document.getElementById("recentGrid");

    const [offers, recent] = await Promise.all([getOffers(), getRecentItems()]);
    renderOffers(offers, offersGrid);
    renderRecent(recent, recentGrid);
    await syncOfferFavIcons(offersGrid);
    await syncOfferCartButtons(offersGrid);
  })();

  const offersGrid = document.getElementById("offersGrid");
  if (offersGrid) {
    offersGrid.addEventListener("click", (e) => {
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
          await toggleWishlistOffer(offerId);
          await syncOfferFavIcons(offersGrid);
          return;
        }

        const cartBtn = target.closest(".offer-card__cart");
        if (cartBtn) {
          e.preventDefault();
          await addOfferToCart(offerId, 1);
          await syncOfferCartButtons(offersGrid);
          return;
        }

        e.preventDefault();
        window.location.href = `product.html?id=${encodeURIComponent(offerId)}`;
      })();
    });
  }

  initAuthModal();

  initBookingModal();
  bindBookingModalTrigger({ selector: "#bookingAction" });

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

  document.addEventListener("alpina:session-changed", () => {
    void (async () => {
      await migrateGuestWishlistAndCartToUser();
      await migrateGuestOrdersToUser();
      await syncOfferFavIcons(offersGrid);
      await syncOfferCartButtons(offersGrid);
    })();
  });
});
