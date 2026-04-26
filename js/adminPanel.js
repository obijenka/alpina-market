import {
  addProduct,
  addUser,
  clearSession,
  getProducts,
  getUsers,
  isAdminSession,
  loginAdmin,
  removeProduct,
  removeUser,
} from "./storage.js";

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActiveAdminTab(tabName) {
  const tabs = document.querySelectorAll("[data-admin-tab]");
  const panels = document.querySelectorAll("[data-admin-panel]");

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.getAttribute("data-admin-tab") === tabName);
  });

  panels.forEach((panel) => {
    panel.classList.toggle(
      "is-active",
      panel.getAttribute("data-admin-panel") === tabName,
    );
  });
}

function initAdminTabs() {
  const tabs = document.querySelectorAll("[data-admin-tab]");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.getAttribute("data-admin-tab");
      if (!name) return;
      setActiveAdminTab(name);
    });
  });

  setActiveAdminTab("products");
}

function initAdminLogout() {
  const btn = $("#adminLogoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

function renderUsers() {
  const list = $("#adminUsersList");
  if (!list) return;

  const users = getUsers();

  if (users.length === 0) {
    list.innerHTML = '<div class="admin__empty">Пользователей пока нет</div>';
    return;
  }

  list.innerHTML = users
    .map(
      (u) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(u.login)}</div>
            <div class="admin-row__meta">id: ${escapeHtml(u.id)}</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-user="${escapeHtml(u.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-remove-user");
      if (!id) return;
      removeUser(id);
      renderUsers();
    });
  });
}

function renderProducts() {
  const list = $("#adminProductsList");
  if (!list) return;

  const products = getProducts();

  if (products.length === 0) {
    list.innerHTML = '<div class="admin__empty">Товаров пока нет</div>';
    return;
  }

  list.innerHTML = products
    .map(
      (p) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(p.title)}</div>
            <div class="admin-row__meta">${escapeHtml(p.price)} ₽</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-product="${escapeHtml(p.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-remove-product");
      if (!id) return;
      removeProduct(id);
      renderProducts();
    });
  });
}

function initAdminAuth() {
  const gate = $("#adminGate");
  const app = $("#adminApp");

  if (!gate || !app) return;

  function sync() {
    const isAdmin = isAdminSession();
    gate.style.display = isAdmin ? "none" : "block";
    app.style.display = isAdmin ? "block" : "none";
  }

  sync();

  const form = $("#adminLoginForm");
  const error = $("#adminLoginError");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const login = String(formData.get("login") ?? "");
      const password = String(formData.get("password") ?? "");

      const result = loginAdmin({ login, password });
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }

      if (error) error.textContent = "";
      sync();
      renderUsers();
      renderProducts();
    });
  }

  return { sync };
}

function initUserCreate() {
  const form = $("#adminCreateUserForm");
  const error = $("#adminCreateUserError");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = addUser({ login, password });
    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    form.reset();
    renderUsers();
  });
}

function initProductCreate() {
  const form = $("#adminCreateProductForm");
  const error = $("#adminCreateProductError");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "");
    const price = String(formData.get("price") ?? "");
    const image = String(formData.get("image") ?? "");

    const result = addProduct({ title, price, image });
    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    form.reset();
    renderProducts();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  initAdminTabs();
  initAdminLogout();
  initUserCreate();
  initProductCreate();

  if (isAdminSession()) {
    renderUsers();
    renderProducts();
  }
});
