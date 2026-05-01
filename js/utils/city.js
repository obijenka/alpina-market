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
