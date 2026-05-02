const THEME_KEY = "alpina:theme";

export function getSavedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "light" ? t : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme) {
  const resolved = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = resolved;
}

export function saveTheme(theme) {
  const resolved = theme === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(THEME_KEY, resolved);
  } catch {
    // ignore
  }
}

export function applySavedTheme() {
  applyTheme(getSavedTheme());
}

export function initThemeSelect({ selector = "#themeSelect" } = {}) {
  const select = document.querySelector(selector);
  if (!(select instanceof HTMLSelectElement)) return;

  const current = getSavedTheme();
  select.value = current;

  select.addEventListener("change", () => {
    const next = select.value === "dark" ? "dark" : "light";
    saveTheme(next);
    applyTheme(next);
  });
}

export function initThemeDropdown({
  rootSelector = "[data-theme-dropdown]",
  buttonSelector = "[data-dropdown-button]",
  menuSelector = "[data-dropdown-menu]",
  optionSelector = "[data-theme-value]",
  labelSelector = "[data-dropdown-label]",
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!(root instanceof HTMLElement)) return;

  const button = root.querySelector(buttonSelector);
  const menu = root.querySelector(menuSelector);
  const label = root.querySelector(labelSelector);
  if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;

  const options = Array.from(root.querySelectorAll(optionSelector)).filter((el) => el instanceof HTMLElement);
  if (options.length === 0) return;

  const labels = { light: "Светлая", dark: "Темная" };

  function setLabel(theme) {
    if (!(label instanceof HTMLElement)) return;
    const resolved = theme === "dark" ? "dark" : "light";
    label.textContent = labels[resolved] ?? resolved;
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

  function setTheme(next) {
    const resolved = next === "dark" ? "dark" : "light";
    saveTheme(resolved);
    applyTheme(resolved);
    setLabel(resolved);
  }

  const current = getSavedTheme();
  setTheme(current);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  options.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const value = String(opt.getAttribute("data-theme-value") ?? "");
      setTheme(value);
      close();
    });
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
