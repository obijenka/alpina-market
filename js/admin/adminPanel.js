import {
  addProduct,
  addUser,
  addFaqItem,
  clearSession,
  getAllOrdersAdmin,
  getFaq,
  getProducts,
  getUsers,
  isAdminSession,
  loginAdmin,
  removeProduct,
  removeFaqItem,
  removeUser,
  updateOrderStatusAdmin,
} from "../services/index.js";

function $(selector) {
  return document.querySelector(selector);
}

function formatRub(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("ru-RU");
}

async function renderOrders() {
  const list = $("#adminOrdersList");
  if (!list) return;

  const orders = await getAllOrdersAdmin();
  if (orders.length === 0) {
    list.innerHTML = '<div class="admin__empty">Заказов пока нет</div>';
    return;
  }

  list.innerHTML = orders
    .map((o) => {
      const itemsCount = Array.isArray(o.items) ? o.items.reduce((s, i) => s + Number(i.qty ?? 0), 0) : 0;
      const title = `Заказ ${String(o.id).slice(0, 8)} · ${escapeHtml(o.ownerLogin || "")}`;
      const meta = `Статус: ${escapeHtml(o.status)} · Сумма: ${escapeHtml(formatRub(o.total))} ₽ · Товаров: ${escapeHtml(itemsCount)}`;
      return `
        <div class="admin-row" data-order-id="${escapeHtml(o.id)}">
          <div class="admin-row__main">
            <div class="admin-row__title">${title}</div>
            <div class="admin-row__meta">${meta}</div>
          </div>
          <select class="admin-field__input admin-order-status" data-order-status>
            <option value="current" ${o.status === "current" ? "selected" : ""}>Текущий</option>
            <option value="done" ${o.status === "done" ? "selected" : ""}>Выполнен</option>
            <option value="canceled" ${o.status === "canceled" ? "selected" : ""}>Отменён</option>
          </select>
        </div>
      `.trim();
    })
    .join("");

  list.querySelectorAll("[data-order-id]").forEach((row) => {
    row.addEventListener("change", (e) => {
      void (async () => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const select = target.closest("[data-order-status]");
        if (!(select instanceof HTMLSelectElement)) return;
        const id = row.getAttribute("data-order-id");
        if (!id) return;
        await updateOrderStatusAdmin(id, select.value);
        await renderOrders();
      })();
    });
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

async function renderFaq() {
  const list = $("#adminFaqList");
  if (!list) return;

  const items = await getFaq();

  if (items.length === 0) {
    list.innerHTML = '<div class="admin__empty">Вопросов пока нет</div>';
    return;
  }

  list.innerHTML = items
    .map(
      (i) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(i.question)}</div>
            <div class="admin-row__meta">id: ${escapeHtml(i.id)}</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-faq="${escapeHtml(i.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-faq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void (async () => {
        const id = btn.getAttribute("data-remove-faq");
        if (!id) return;
        await removeFaqItem(id);
        await renderFaq();
      })();
    });
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
    void (async () => {
      await clearSession();
      window.location.href = "index.html";
    })();
  });
}

async function renderUsers() {
  const list = $("#adminUsersList");
  if (!list) return;

  const users = await getUsers();

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
      void (async () => {
        const id = btn.getAttribute("data-remove-user");
        if (!id) return;
        await removeUser(id);
        await renderUsers();
      })();
    });
  });
}

async function renderProducts() {
  const list = $("#adminProductsList");
  if (!list) return;

  const products = await getProducts();

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
      void (async () => {
        const id = btn.getAttribute("data-remove-product");
        if (!id) return;
        await removeProduct(id);
        await renderProducts();
      })();
    });
  });
}

function initAdminAuth() {
  const gate = $("#adminGate");
  const app = $("#adminApp");

  if (!gate || !app) return;

  async function sync() {
    const isAdmin = await isAdminSession();
    gate.style.display = isAdmin ? "none" : "block";
    app.style.display = isAdmin ? "block" : "none";
  }

  void sync();

  const form = $("#adminLoginForm");
  const error = $("#adminLoginError");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      void (async () => {
        const formData = new FormData(form);
        const login = String(formData.get("login") ?? "");
        const password = String(formData.get("password") ?? "");

        const result = await loginAdmin({ login, password });
        if (!result.ok) {
          if (error) error.textContent = result.message;
          return;
        }

        if (error) error.textContent = "";
        await sync();
        await renderUsers();
        await renderProducts();
        await renderFaq();
        await renderOrders();
      })();
    });
  }

  return { sync };
}

function initUserCreate() {
  const form = $("#adminCreateUserForm");
  const error = $("#adminCreateUserError");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await addUser({ login, password });
    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    form.reset();
    await renderUsers();
  });
}

function initProductCreate() {
  const form = $("#adminCreateProductForm");
  const error = $("#adminCreateProductError");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    void (async () => {
      const formData = new FormData(form);
      const title = String(formData.get("title") ?? "");
      const price = String(formData.get("price") ?? "");
      const image = String(formData.get("image") ?? "");

      const result = await addProduct({ title, price, image });
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }

      if (error) error.textContent = "";
      form.reset();
      await renderProducts();
    })();
  });
}

function initFaqCreate() {
  const form = $("#adminCreateFaqForm");
  const error = $("#adminCreateFaqError");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    void (async () => {
      const formData = new FormData(form);
      const question = String(formData.get("question") ?? "");
      const answer = String(formData.get("answer") ?? "");

      const result = await addFaqItem({ question, answer });
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }

      if (error) error.textContent = "";
      form.reset();
      await renderFaq();
    })();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  initAdminTabs();
  initAdminLogout();
  initUserCreate();
  initProductCreate();
  initFaqCreate();

  void (async () => {
    if (await isAdminSession()) {
      await renderUsers();
      await renderProducts();
      await renderFaq();
      await renderOrders();
    }
  })();
});
