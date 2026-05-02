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
import { initScrollRestoration } from "../utils/scrollRestoration.js";
import { mountLayout } from "../utils/layout.js";
import { applySavedTheme, initThemeSelect } from "../utils/theme.js";

applySavedTheme();

let catalogProducts = [];

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

function getProductCategories(product) {
  if (Array.isArray(product?.categories)) return product.categories.filter(Boolean).map(String);
  return product?.category ? [String(product.category)] : [];
}

function getSelectedCategory() {
  const input = document.getElementById("catalogCategory");
  if (!(input instanceof HTMLInputElement)) return "";
  return input.value;
}

function fillCategoryFilter(products) {
  const root = document.querySelector("[data-catalog-category-dropdown]");
  const input = document.getElementById("catalogCategory");
  if (!(root instanceof HTMLElement)) return;
  if (!(input instanceof HTMLInputElement)) return;

  const button = root.querySelector("[data-dropdown-button]");
  const menu = root.querySelector("[data-dropdown-menu]");
  const label = root.querySelector("[data-dropdown-label]");
  if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;

  const current = input.value;
  const categories = Array.from(new Set(products.flatMap(getProductCategories))).sort((a, b) => a.localeCompare(b, "ru"));

  function getLabelText(value) {
    return value ? String(value) : "Все категории";
  }

  input.value = categories.includes(current) ? current : "";
  if (label instanceof HTMLElement) label.textContent = getLabelText(input.value);

  menu.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "catalog-dropdown__option";
  allBtn.setAttribute("data-category-value", "");
  allBtn.textContent = "Все категории";
  menu.appendChild(allBtn);

  categories.forEach((category) => {
    const opt = document.createElement("button");
    opt.type = "button";
    opt.className = "catalog-dropdown__option";
    opt.setAttribute("data-category-value", category);
    opt.textContent = category;
    menu.appendChild(opt);
  });
}

function initCatalogCategoryDropdown({
  rootSelector = "[data-catalog-category-dropdown]",
  buttonSelector = "[data-dropdown-button]",
  menuSelector = "[data-dropdown-menu]",
  optionSelector = "[data-category-value]",
  labelSelector = "[data-dropdown-label]",
  inputSelector = "#catalogCategory",
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!(root instanceof HTMLElement)) return;

  const button = root.querySelector(buttonSelector);
  const menu = root.querySelector(menuSelector);
  const label = root.querySelector(labelSelector);
  const input = document.querySelector(inputSelector);

  if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;
  if (!(input instanceof HTMLInputElement)) return;

  function setLabel(value) {
    if (!(label instanceof HTMLElement)) return;
    label.textContent = value ? String(value) : "Все категории";
  }

  function close() {
    root.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function open() {
    root.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function toggle() {
    if (root.classList.contains("is-open")) close();
    else open();
  }

  function setValue(next) {
    const value = String(next ?? "");
    input.value = value;
    setLabel(value);
  }

  setValue(input.value);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  root.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const opt = target.closest(optionSelector);
    if (!(opt instanceof HTMLElement)) return;
    e.preventDefault();
    const value = String(opt.getAttribute("data-category-value") ?? "");
    setValue(value);
    close();
    void renderCatalog();
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (!root.contains(target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
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

async function renderCatalog() {
  const grid = document.getElementById("catalogGrid");
  const meta = document.getElementById("catalogMeta");
  const empty = document.getElementById("catalogEmpty");
  const category = getSelectedCategory();

  const items = category
    ? catalogProducts.filter((product) => getProductCategories(product).includes(category))
    : catalogProducts;

  const offerLike = items.map(productToOfferLike);

  if (meta) meta.textContent = `Товаров: ${items.length}`;
  if (empty) empty.style.display = items.length === 0 ? "block" : "none";

  renderOffers(offerLike, grid);
  await syncOfferFavIcons(grid);
  await syncOfferCartButtons(grid);
}

async function loadCatalog() {
  const products = await getProducts();
  catalogProducts = Array.isArray(products) ? products : [];
  fillCategoryFilter(catalogProducts);
  await renderCatalog();
}

function initCatalogEvents() {
  const grid = document.getElementById("catalogGrid");
  initCatalogCategoryDropdown();

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
  const scrollRestoration = initScrollRestoration({ storageKey: "alpina:catalog-scroll-y" });

  initAuthModal();
  initCatalogEvents();
  initHeaderActions();
  void (async () => {
    await loadCatalog();
    scrollRestoration?.restore();
  })();

  document.addEventListener("alpina:session-changed", () => {
    void (async () => {
      await migrateGuestWishlistAndCartToUser();
      await migrateGuestOrdersToUser();
      await renderCatalog();
      scrollRestoration?.restore();
    })();
  });
});
