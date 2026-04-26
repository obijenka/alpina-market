import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import {
  addCurrentUserAddress,
  clearSession,
  getCurrentUser,
  getCurrentUserAddresses,
  getSession,
  removeCurrentUserAddress,
  setCurrentUserDefaultAddress,
  updateCurrentUserProfile,
} from "../services/storage.js";

function $(selector) {
  return document.querySelector(selector);
}

function setSaved(labelEl) {
  if (!labelEl) return;
  labelEl.textContent = "Сохранено";
  window.clearTimeout(labelEl.__t);
  labelEl.__t = window.setTimeout(() => {
    labelEl.textContent = "";
  }, 1500);
}

function initProfileAccordion() {
  const toggles = document.querySelectorAll("[data-profile-toggle]");
  if (toggles.length === 0) return;

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest("[data-profile-item]");
      if (!(item instanceof HTMLElement)) return;

      const body = item.querySelector("[data-profile-body]");
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

  document.querySelectorAll("[data-profile-item]").forEach((item) => {
    if (!(item instanceof HTMLElement)) return;
    const btn = item.querySelector("[data-profile-toggle]");
    const body = item.querySelector("[data-profile-body]");
    if (!(btn instanceof HTMLElement) || !(body instanceof HTMLElement)) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    item.classList.toggle("is-open", expanded);
    body.style.height = expanded ? "auto" : "0px";
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function syncGate() {
  const gate = $("#profileGate");
  const app = $("#profileApp");
  const logoutBtn = $("#profileLogoutBtn");

  const session = getSession();
  const isAuthed = session?.role === "user";

  if (gate) gate.style.display = isAuthed ? "none" : "block";
  if (app) app.style.display = isAuthed ? "grid" : "none";
  if (logoutBtn) logoutBtn.style.display = isAuthed ? "inline-flex" : "none";

  return isAuthed;
}

function fillProfileForm() {
  const form = $("#profileForm");
  if (!(form instanceof HTMLFormElement)) return;

  const user = getCurrentUser();
  const profile = user?.profile ?? {};

  const fullName = form.elements.namedItem("fullName");
  const phone = form.elements.namedItem("phone");
  const email = form.elements.namedItem("email");

  if (fullName instanceof HTMLInputElement) fullName.value = String(profile.fullName ?? "");
  if (phone instanceof HTMLInputElement) phone.value = String(profile.phone ?? "");
  if (email instanceof HTMLInputElement) email.value = String(profile.email ?? "");
}

function renderAddresses() {
  const list = $("#addressList");
  if (!list) return;

  const addresses = getCurrentUserAddresses();

  if (addresses.length === 0) {
    list.innerHTML = '<div class="profile-address__text">Адресов пока нет</div>';
    return;
  }

  list.innerHTML = addresses
    .map((a) => {
      const title = a.label?.trim() ? a.label : `${a.city}, ${a.street}`;
      const lines = [
        `${a.city}, ${a.street}, ${a.house}${a.apartment ? ", кв. " + a.apartment : ""}`,
      ].filter(Boolean);

      return `
        <div class="profile-address" data-address-id="${escapeHtml(a.id)}">
          <div class="profile-address__top">
            <div class="profile-address__title">${escapeHtml(title)}</div>
            ${a.isDefault ? '<div class="profile-badge">Основной</div>' : ""}
          </div>
          <div class="profile-address__text">${lines.map((l) => escapeHtml(l)).join("<br />")}</div>
          <div class="profile-actions">
            ${
              a.isDefault
                ? ""
                : `<button class="profile-btn profile-btn--light" type="button" data-make-default>Сделать основным</button>`
            }
            <button class="profile-btn profile-btn--danger" type="button" data-remove>Удалить</button>
          </div>
        </div>
      `.trim();
    })
    .join("");

  list.querySelectorAll("[data-address-id]").forEach((card) => {
    card.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const id = card.getAttribute("data-address-id");
      if (!id) return;

      if (target.closest("[data-remove]")) {
        removeCurrentUserAddress(id);
        renderAddresses();
        return;
      }

      if (target.closest("[data-make-default]")) {
        setCurrentUserDefaultAddress(id);
        renderAddresses();
      }
    });
  });
}

function initProfileSave() {
  const form = $("#profileForm");
  const error = $("#profileError");
  const saved = $("#profileSaved");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");

    const result = updateCurrentUserProfile({ fullName, phone, email });
    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    setSaved(saved);
  });
}

function initAddressCreate() {
  const form = $("#addressForm");
  const error = $("#addressError");
  const saved = $("#addressSaved");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const result = addCurrentUserAddress({
      label: String(formData.get("label") ?? ""),
      city: String(formData.get("city") ?? ""),
      street: String(formData.get("street") ?? ""),
      house: String(formData.get("house") ?? ""),
      apartment: String(formData.get("apartment") ?? ""),
    });

    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    form.reset();
    renderAddresses();
    setSaved(saved);
  });
}

function initLogout() {
  const btn = $("#profileLogoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

function initGateLogin() {
  const btn = $("#profileLoginBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    openAuthModal();
  });
}

function initProfileActionInHeader() {
  const profileAction = $("#profileAction");
  if (!profileAction) return;

  profileAction.addEventListener("click", (e) => {
    e.preventDefault();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthModal();
  initProfileAccordion();

  initProfileActionInHeader();
  initGateLogin();
  initLogout();
  initProfileSave();
  initAddressCreate();

  const authed = syncGate();
  if (authed) {
    fillProfileForm();
    renderAddresses();
  }

  document.addEventListener("alpina:session-changed", () => {
    const isAuthed = syncGate();
    if (isAuthed) {
      fillProfileForm();
      renderAddresses();
    }
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
