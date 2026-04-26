import {
  addUser,
  createSessionForUser,
  loginAdmin,
  loginUser,
} from "../services/storage.js";
import { mountAuthModalMarkup } from "./authModalMarkup.js";

function getEls() {
  const modal = document.querySelector(".auth-modal");
  const overlay = document.querySelector(".auth-modal__overlay");
  const closeEls = document.querySelectorAll("[data-auth-close]");
  const tabs = document.querySelectorAll("[data-auth-tab]");
  const panels = document.querySelectorAll("[data-auth-panel]");

  const loginForm = document.querySelector("#authLoginForm");
  const registerForm = document.querySelector("#authRegisterForm");

  const loginError = document.querySelector("#authLoginError");
  const registerError = document.querySelector("#authRegisterError");

  return {
    modal,
    overlay,
    closeEls,
    tabs,
    panels,
    loginForm,
    registerForm,
    loginError,
    registerError,
  };
}

function openModal() {
  const { modal } = getEls();
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

export function openAuthModal() {
  openModal();
}

function closeModal() {
  const { modal } = getEls();
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function setActiveTab(tabName) {
  const { tabs, panels, loginError, registerError } = getEls();

  if (loginError) loginError.textContent = "";
  if (registerError) registerError.textContent = "";

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authTab === tabName);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.authPanel === tabName);
  });
}

function initTabLogic() {
  const { tabs } = getEls();
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.authTab;
      if (!name) return;
      setActiveTab(name);
    });
  });
}

function initCloseLogic() {
  const { closeEls } = getEls();

  closeEls.forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function initLoginForm() {
  const { loginForm, loginError } = getEls();
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const login = String(formData.get("login") ?? "");
    const password = String(formData.get("password") ?? "");

    if (login.trim() === "admin" && password.trim() === "admin") {
      const adminResult = loginAdmin({ login, password });
      if (!adminResult.ok) {
        if (loginError) loginError.textContent = adminResult.message;
        return;
      }

      if (loginError) loginError.textContent = "";
      closeModal();
      window.location.href = "admin.html";
      return;
    }

    const result = await loginUser({ login, password });
    if (!result.ok) {
      if (loginError) loginError.textContent = result.message;
      return;
    }

    if (loginError) loginError.textContent = "";
    closeModal();
    document.dispatchEvent(new CustomEvent("alpina:session-changed"));
  });
}

function initRegisterForm() {
  const { registerForm, registerError } = getEls();
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const login = String(formData.get("login") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await addUser({ login, password });
    if (!result.ok) {
      if (registerError) registerError.textContent = result.message;
      return;
    }

    if (registerError) registerError.textContent = "";

    const session = createSessionForUser(result.user);
    localStorage.setItem("alpina_session_v1", JSON.stringify(session));

    closeModal();
    document.dispatchEvent(new CustomEvent("alpina:session-changed"));
  });
}

export function initAuthModal() {
  mountAuthModalMarkup();
  const { modal } = getEls();
  if (!modal) return;

  initTabLogic();
  initCloseLogic();
  initLoginForm();
  initRegisterForm();
  setActiveTab("login");
}

export function bindAuthModalTrigger({ selector }) {
  const trigger = document.querySelector(selector);
  if (!trigger) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
}
