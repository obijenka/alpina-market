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
