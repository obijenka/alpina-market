import { OFFERS } from "../data/offers.js";
import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  clearCart,
  getCurrentUser,
  getCartItems,
  getSession,
  migrateGuestWishlistAndCartToUser,
  removeOfferFromCart,
  updateCartOfferQty,
} from "../services/storage.js";
import { bindBookingModalTrigger, initBookingModal } from "../booking/bookingModal.js";

function formatRub(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0 руб.";
  return `${num.toLocaleString("ru-RU")} руб.`;
}

function parsePriceRub(priceText) {
  const raw = String(priceText ?? "");
  const num = Number(raw.replace(/\s/g, "").replace(/руб\.?/gi, ""));
  return Number.isFinite(num) ? num : 0;
}

function computeTotal(offerItems) {
  return offerItems.reduce((sum, item) => sum + item.priceNumber * item.qty, 0);
}

function getOfferById(id) {
  return OFFERS.find((o) => String(o.id) === String(id)) ?? null;
}

function renderCart() {
  const listEl = document.getElementById("cartList");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  if (!listEl) return { items: [], total: 0 };

  const cart = getCartItems();
  const items = cart
    .map((ci) => {
      const offer = getOfferById(ci.offerId);
      if (!offer) return null;
      return {
        offerId: String(ci.offerId),
        qty: ci.qty,
        title: offer.title,
        image: offer.image,
        priceText: offer.price,
        priceNumber: parsePriceRub(offer.price),
      };
    })
    .filter(Boolean);

  listEl.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.dataset.offerId = item.offerId;
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item__image">
        <img src="${item.image}" alt="" />
      </div>
      <div class="cart-item__content">
        <div class="cart-item__top">
          <div class="cart-item__title">${item.title}</div>
          <button type="button" class="cart-item__remove" data-cart-remove>×</button>
        </div>
        <div class="cart-item__bottom">
          <div class="cart-item__price">${item.priceText}</div>
          <div class="cart-item__qty">
            <button type="button" class="cart-item__qty-btn" data-cart-dec>-</button>
            <input class="cart-item__qty-input" data-cart-qty type="number" min="1" value="${item.qty}" />
            <button type="button" class="cart-item__qty-btn" data-cart-inc>+</button>
          </div>
        </div>
      </div>
    `.trim();

    listEl.appendChild(row);
  });

  const total = computeTotal(items);

  if (totalEl) totalEl.textContent = formatRub(total);

  if (emptyEl) emptyEl.style.display = items.length === 0 ? "block" : "none";
  if (summaryEl) summaryEl.style.display = items.length === 0 ? "none" : "block";

  return { items, total };
}

function openCheckoutModal(total) {
  const modal = document.querySelector(".checkout-modal");
  const totalEl = document.getElementById("checkoutTotal");
  if (totalEl) totalEl.textContent = formatRub(total);
  if (!modal) return;

  const form = document.getElementById("checkoutForm");
  if (form instanceof HTMLFormElement) {
    const user = getCurrentUser();
    const nameInput = form.querySelector("[name='name']");
    const phoneInput = form.querySelector("[name='phone']");
    const addressInput = form.querySelector("[name='address']");

    if (user?.profile) {
      const fullName = String(user.profile.fullName ?? "").trim();
      const phone = String(user.profile.phone ?? "").trim();

      if (nameInput instanceof HTMLInputElement && !nameInput.value.trim() && fullName) {
        nameInput.value = fullName;
      }
      if (phoneInput instanceof HTMLInputElement && !phoneInput.value.trim() && phone) {
        phoneInput.value = phone;
      }
    }

    const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
    const defaultAddress = addresses.find((a) => a?.isDefault) ?? addresses[0] ?? null;
    if (addressInput instanceof HTMLInputElement && !addressInput.value.trim() && defaultAddress) {
      const parts = [defaultAddress.city, defaultAddress.street, defaultAddress.house, defaultAddress.apartment]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean);
      if (parts.length > 0) {
        addressInput.value = parts.join(", ");
      }
    }
  }

  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  const modal = document.querySelector(".checkout-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function openCheckoutSuccess() {
  const modal = document.querySelector(".checkout-success");
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCheckoutSuccess() {
  const modal = document.querySelector(".checkout-success");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function initCartEvents() {
  const listEl = document.getElementById("cartList");
  if (!listEl) return;

  listEl.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const row = target.closest("[data-offer-id]");
    if (!(row instanceof HTMLElement)) return;
    const offerId = String(row.dataset.offerId ?? "");
    if (!offerId) return;

    if (target.closest("[data-cart-remove]")) {
      e.preventDefault();
      removeOfferFromCart(offerId);
      renderCart();
      return;
    }

    if (target.closest("[data-cart-inc]")) {
      e.preventDefault();
      const input = row.querySelector("[data-cart-qty]");
      if (!(input instanceof HTMLInputElement)) return;
      const next = Number(input.value) + 1;
      updateCartOfferQty(offerId, next);
      renderCart();
      return;
    }

    if (target.closest("[data-cart-dec]")) {
      e.preventDefault();
      const input = row.querySelector("[data-cart-qty]");
      if (!(input instanceof HTMLInputElement)) return;
      const next = Number(input.value) - 1;
      updateCartOfferQty(offerId, next);
      renderCart();
      return;
    }
  });

  listEl.addEventListener("change", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const input = target.closest("[data-cart-qty]");
    if (!(input instanceof HTMLInputElement)) return;

    const row = target.closest("[data-offer-id]");
    if (!(row instanceof HTMLElement)) return;
    const offerId = String(row.dataset.offerId ?? "");
    const next = Number(input.value);
    if (!offerId) return;

    updateCartOfferQty(offerId, next);
    renderCart();
  });
}

function initCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const form = document.getElementById("checkoutForm");
  const closeEls = document.querySelectorAll("[data-checkout-close]");
  const successCloseEls = document.querySelectorAll("[data-checkout-success-close]");

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const { total } = renderCart();
      openCheckoutModal(total);
    });
  }

  closeEls.forEach((el) => el.addEventListener("click", closeCheckoutModal));
  successCloseEls.forEach((el) => el.addEventListener("click", closeCheckoutSuccess));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCheckoutModal();
      closeCheckoutSuccess();
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const { items, total } = renderCart();
      if (items.length === 0) {
        closeCheckoutModal();
        return;
      }

      const fd = new FormData(form);
      const name = String(fd.get("name") ?? "").trim();
      const phone = String(fd.get("phone") ?? "").trim();
      const address = String(fd.get("address") ?? "").trim();
      if (!name || !phone || !address) return;

      void total;
      clearCart();
      form.reset();
      closeCheckoutModal();
      renderCart();
      openCheckoutSuccess();
    });
  }
}

function initHeaderActions() {
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
    renderCart();
  });
}

function initMobileMenu() {
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
}

document.addEventListener("DOMContentLoaded", () => {
  initHeaderActions();

  initBookingModal();
  bindBookingModalTrigger({ selector: "#bookingAction" });

  renderCart();
  initCartEvents();
  initCheckout();
  initMobileMenu();
});
