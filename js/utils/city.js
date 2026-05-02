const CITY_KEY = "alpina:city";

export const CITIES = ["Минск", "Гомель", "Брест"];

export function getSavedCity() {
  try {
    const value = localStorage.getItem(CITY_KEY);
    return CITIES.includes(value) ? value : "Минск";
  } catch {
    return "Минск";
  }
}

export function saveCity(city) {
  const resolved = CITIES.includes(city) ? city : "Минск";
  try {
    localStorage.setItem(CITY_KEY, resolved);
  } catch {
    // ignore
  }
}

export function initCitySelect({ selector = "#citySelect" } = {}) {
  const select = document.querySelector(selector);
  if (!(select instanceof HTMLSelectElement)) return;

  const current = getSavedCity();
  select.value = current;

  select.addEventListener("change", () => {
    const next = CITIES.includes(select.value) ? select.value : "Минск";
    saveCity(next);
    document.dispatchEvent(new CustomEvent("alpina:city-changed", { detail: { city: next } }));
  });
}

export function initCityDropdown({
  rootSelector = "[data-city-dropdown]",
  buttonSelector = "[data-dropdown-button]",
  menuSelector = "[data-dropdown-menu]",
  optionSelector = "[data-city-value]",
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

  function setLabel(city) {
    if (!(label instanceof HTMLElement)) return;
    label.textContent = city;
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

  function setCity(next) {
    const resolved = CITIES.includes(next) ? next : "Минск";
    saveCity(resolved);
    setLabel(resolved);
    document.dispatchEvent(new CustomEvent("alpina:city-changed", { detail: { city: resolved } }));
  }

  const current = getSavedCity();
  setLabel(current);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  options.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const value = String(opt.getAttribute("data-city-value") ?? "");
      setCity(value);
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
