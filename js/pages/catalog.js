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

let catalogProducts = [];

function productToOfferLike(product) {
  return {
    ...product,
    price: product.priceText ?? (typeof product.price === "number" ? `${product.price.toLocaleString("ru-RU")} руб.` : product.price),
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
  const select = document.getElementById("catalogCategory");
  if (!(select instanceof HTMLSelectElement)) return "";
  return select.value;
}

function fillCategoryFilter(products) {
  const select = document.getElementById("catalogCategory");
  if (!(select instanceof HTMLSelectElement)) return;

  const current = select.value;
  const categories = Array.from(new Set(products.flatMap(getProductCategories))).sort((a, b) => a.localeCompare(b, "ru"));

  select.innerHTML = '<option value="">Все категории</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });

  select.value = categories.includes(current) ? current : "";
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
  const categorySelect = document.getElementById("catalogCategory");

  if (categorySelect instanceof HTMLSelectElement) {
    categorySelect.addEventListener("change", () => {
      void renderCatalog();
    });
  }

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
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthModal();
  initCatalogEvents();
  initHeaderActions();
  void loadCatalog();

  document.addEventListener("alpina:session-changed", () => {
    void (async () => {
      await migrateGuestWishlistAndCartToUser();
      await migrateGuestOrdersToUser();
      await renderCatalog();
    })();
  });
});
