import { clearSession, isAdminSession, loginAdmin } from "../services/index.js";

import { renderOrders } from "./panels/ordersPanel.js";
import { initFaqCreate, renderFaq } from "./panels/faqPanel.js";
import { initProductCreate, renderProducts } from "./panels/productsPanel.js";
import { renderReviews } from "./panels/reviewsPanel.js";
import { initUserCreate, renderUsers } from "./panels/usersPanel.js";

function $(selector) {
  return document.querySelector(selector);
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

      void (async () => {
        if (!(await isAdminSession())) return;
        if (name === "users") await renderUsers();
        if (name === "products") await renderProducts();
        if (name === "faq") await renderFaq();
        if (name === "reviews") await renderReviews();
        if (name === "orders") await renderOrders();
      })();
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
        await Promise.all([renderUsers(), renderProducts(), renderFaq(), renderReviews(), renderOrders()]);
      })();
    });
  }

  return { sync };
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
      await Promise.all([renderUsers(), renderProducts(), renderFaq(), renderReviews(), renderOrders()]);
    }
  })();
});
