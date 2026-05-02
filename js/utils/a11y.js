const A11Y_KEY = "alpina:a11y";

export function getSavedA11yMode() {
  const raw = String(localStorage.getItem(A11Y_KEY) ?? "").trim();
  return raw === "on" ? "on" : "off";
}

export function saveA11yMode(mode) {
  const next = mode === "on" ? "on" : "off";
  localStorage.setItem(A11Y_KEY, next);
}

export function applyA11yMode(mode) {
  const next = mode === "on" ? "on" : "off";
  document.body.setAttribute("data-a11y", next);
}

export function toggleA11yMode() {
  const current = getSavedA11yMode();
  const next = current === "on" ? "off" : "on";
  saveA11yMode(next);
  applyA11yMode(next);
  document.dispatchEvent(new CustomEvent("alpina:a11y-changed", { detail: { mode: next } }));
  return next;
}

export function applySavedA11yMode() {
  applyA11yMode(getSavedA11yMode());
}
