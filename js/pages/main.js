import { OFFERS } from "../data/offers.js";
import { RECENT_ITEMS } from "../data/recent.js";
import { renderOffers } from "../renderers/offers.js";
import { renderRecent } from "../renderers/recent.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import { getSession } from "../services/storage.js";
import { bindBookingModalTrigger, initBookingModal } from "../booking/bookingModal.js";

document.addEventListener("DOMContentLoaded", () => {
  const offersGrid = document.getElementById("offersGrid");
  renderOffers(OFFERS, offersGrid);

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
