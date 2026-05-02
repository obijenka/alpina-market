import { initCityDropdown } from "../utils/city.js";
import { initThemeDropdown } from "../utils/theme.js";
import { bindBookingModalTrigger, initBookingModal } from "../booking/bookingModal.js";
import { applySavedA11yMode, getSavedA11yMode, toggleA11yMode } from "../utils/a11y.js";

const HEADER_SELECTOR = "header.header";

const TRANSLATE_STORAGE_KEY = "alpina:lang";
const TRANSLATE_RELOAD_KEY = "alpina:lang-reloaded";

function getSavedLanguage() {
  const raw = window.localStorage.getItem(TRANSLATE_STORAGE_KEY);
  return raw === "en" || raw === "ru" ? raw : "ru";
}

function saveLanguage(lang) {
  window.localStorage.setItem(TRANSLATE_STORAGE_KEY, lang);
}

function initGoogleTranslate() {
  const target = document.getElementById("google_translate_element");
  if (!target) return;

  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function googleTranslateElementInit() {
      if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "ru",
          includedLanguages: "ru,en",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };
  }

  if (document.getElementById("google-translate-script")) return;

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onload = () => {
    if (typeof window.googleTranslateElementInit === "function") {
      window.googleTranslateElementInit();
    }
  };
  document.head.appendChild(script);
}

function setGoogTransCookie(lang) {
  const to = lang === "en" ? "en" : "ru";
  const value = `/ru/${to}`;
  const host = window.location.hostname;

  document.cookie = `googtrans=${value}; path=/`;
  if (host) {
    document.cookie = `googtrans=${value}; path=/; domain=${host}`;
    document.cookie = `googtrans=${value}; path=/; domain=.${host}`;
  }
}

function isTranslated() {
  const html = document.documentElement;
  return html.classList.contains("translated-ltr") || html.classList.contains("translated-rtl");
}

function scheduleTranslateReloadIfNeeded(lang) {
  const already = window.sessionStorage.getItem(TRANSLATE_RELOAD_KEY);
  if (already === lang) return;

  window.setTimeout(() => {
    if (lang === "en") {
      if (isTranslated()) return;
    } else {
      if (!isTranslated()) return;
    }

    window.sessionStorage.setItem(TRANSLATE_RELOAD_KEY, lang);
    window.location.reload();
  }, 900);
}

function applyGoogleTranslateLang(lang) {
  const select = document.querySelector(".goog-te-combo");
  if (!(select instanceof HTMLSelectElement)) return false;

  const nextValue = lang === "en" ? "en" : "";
  select.value = nextValue;

  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change"));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  if (typeof select.onchange === "function") select.onchange(new Event("change"));

  select.focus();
  select.blur();
  return true;
}

function applyLanguageWithRetry(lang) {
  setGoogTransCookie(lang);

  if (applyGoogleTranslateLang(lang)) return;

  let tries = 0;
  const maxTries = 60;
  const intervalMs = 250;

  const timer = window.setInterval(() => {
    tries += 1;
    if (applyGoogleTranslateLang(lang) || tries >= maxTries) {
      window.clearInterval(timer);
    }
  }, intervalMs);
}

function initTranslateDropdown() {
  const root = document.querySelector("[data-translate-dropdown]");
  if (!(root instanceof HTMLElement)) return;

  const button = root.querySelector("[data-dropdown-button]");
  const label = root.querySelector("[data-dropdown-label]");
  const menu = root.querySelector("[data-dropdown-menu]");
  if (!(button instanceof HTMLButtonElement)) return;
  if (!(label instanceof HTMLElement)) return;
  if (!(menu instanceof HTMLElement)) return;

  function open() {
    root.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function close() {
    root.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", () => {
    if (root.classList.contains("is-open")) close();
    else open();
  });

  menu.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const option = target.closest("[data-lang-value]");
    if (!(option instanceof HTMLElement)) return;
    const lang = option.getAttribute("data-lang-value");
    if (lang !== "ru" && lang !== "en") return;

    label.textContent = lang === "ru" ? "RU" : "EN";
    saveLanguage(lang);
    setGoogTransCookie(lang);
    close();
    window.location.reload();
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("[data-translate-dropdown]")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  const hasSaved = window.localStorage.getItem(TRANSLATE_STORAGE_KEY) !== null;
  const saved = getSavedLanguage();
  const initial = hasSaved ? saved : "ru";
  if (!hasSaved) saveLanguage("ru");
  label.textContent = initial === "ru" ? "RU" : "EN";
  applyLanguageWithRetry(initial);
}

function initMobileMenu() {
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

export function mountHeader() {
  const header = document.querySelector(HEADER_SELECTOR);
  if (!header) return;

  header.innerHTML = `
      <div class="header__top">
        <div class="container header__top-inner">
          <div class="header__top-left">
            <div class="header__dropdown" data-city-dropdown>
              <button class="header__dropdown-btn" type="button" data-dropdown-button aria-haspopup="listbox" aria-expanded="false">
                <span class="header__dropdown-label" data-dropdown-label>Минск</span>
                <img class="header__chevron" src="assets/icons/chevron.svg" alt="chevron" />
              </button>
              <div class="header__dropdown-menu" data-dropdown-menu role="listbox">
                <button class="header__dropdown-option" type="button" data-city-value="Минск">Минск</button>
                <button class="header__dropdown-option" type="button" data-city-value="Гомель">Гомель</button>
                <button class="header__dropdown-option" type="button" data-city-value="Брест">Брест</button>
              </div>
            </div>

            <div class="header__dropdown" data-theme-dropdown>
              <button class="header__dropdown-btn" type="button" data-dropdown-button aria-haspopup="listbox" aria-expanded="false">
                <span class="header__dropdown-label" data-dropdown-label>Светлая</span>
                <img class="header__chevron" src="assets/icons/chevron.svg" alt="chevron" />
              </button>
              <div class="header__dropdown-menu" data-dropdown-menu role="listbox">
                <button class="header__dropdown-option" type="button" data-theme-value="light">Светлая</button>
                <button class="header__dropdown-option" type="button" data-theme-value="dark">Темная</button>
              </div>
            </div>

        
            <div class="header__dropdown" data-translate-dropdown>
              <button class="header__dropdown-btn" type="button" data-dropdown-button aria-haspopup="listbox" aria-expanded="false">
                <span class="header__dropdown-label" data-dropdown-label>RU</span>
                <img class="header__chevron" src="assets/icons/chevron.svg" alt="chevron" />
              </button>
              <div class="header__dropdown-menu" data-dropdown-menu role="listbox">
                <button class="header__dropdown-option" type="button" data-lang-value="ru">RU</button>
                <button class="header__dropdown-option" type="button" data-lang-value="en">EN</button>
              </div>
            </div>

            <div class="header__translate" id="google_translate_element" aria-hidden="true"></div>

            <button class="header__a11y" type="button" id="a11yToggle" aria-pressed="false">Aа</button>
          </div>

          <nav class="header__top-nav" aria-label="Верхнее меню">
            <a class="header__top-link" href="index.html">Главная</a>
            <a class="header__top-link" href="salons.html">Наши салоны</a>
            <a class="header__top-link" id="bookingAction" href="#">Онлайн-запись</a>
            <a class="header__top-link" href="faq.html">Вопросы и ответы</a>
          </nav>

          <button class="header__burger" type="button" aria-label="Открыть меню">
            <span class="header__burger-line"></span>
            <span class="header__burger-line"></span>
            <span class="header__burger-line"></span>
          </button>
        </div>
      </div>

      <div class="header__main">
        <div class="container header__main-inner">
          <a class="header__logo" href="index.html" aria-label="Alpina Market">
            <img src="assets/logo.svg" alt="alpina market" />
          </a>

          <form class="header__search" role="search" action="search.html" method="get">
            <input class="header__search-input" type="search" name="q" placeholder="Белый стул" />
            <button class="header__search-btn" type="submit" aria-label="Поиск">
              <img src="assets/icons/search.svg" alt="Поиск" />
            </button>
          </form>

          <div class="header__contacts">
            <a class="header__phone" href="tel:+78007004024">8 800 700 40 24</a>
            <button class="header__callback" type="button">
              Позвонить или написать
              <img class="header__chevron" src="assets/icons/chevron.svg" alt="chevron" />
            </button>
          </div>

          <div class="header__actions" aria-label="Действия">
            <a class="header__action" id="profileAction" href="#" aria-label="Профиль">
              <img width="18" height="18" src="assets/icons/user.svg" alt="" />
            </a>
            <a class="header__action" href="#" aria-label="Сообщения">
              <img width="18" height="18" src="assets/icons/message.svg" alt="" />
            </a>
            <a class="header__action" id="favoritesAction" href="favorites.html" aria-label="Избранное">
              <img width="20" height="16" src="assets/icons/fav.svg" alt="" />
            </a>
            <a class="header__action" id="cartAction" href="cart.html" aria-label="Корзина">
              <img width="14" height="18" src="assets/icons/cart.svg" alt="" />
            </a>
          </div>
        </div>
      </div>

      <div class="header__bottom">
        <div class="container header__bottom-inner">
          <nav class="header__menu" aria-label="Каталог">
            <a class="header__menu-link header__menu-link--catalog" href="catalog.html">Каталог</a>
            <a class="header__menu-link" href="#">Каталог по комнатам</a>
            <a class="header__menu-link" href="#">Дизайн-проекты</a>
            <a class="header__menu-link" href="#">Мебель на заказ</a>
          </nav>

          <nav class="header__submenu" aria-label="Разделы каталога">
            <a class="header__submenu-link" href="catalog.html">Мебель</a>
            <a class="header__submenu-link" href="catalog.html">Мебельная фурнитура и комплектующие</a>
            <a class="header__submenu-link" href="catalog.html">Товары для дома</a>
            <a class="header__submenu-link" href="catalog.html">Плитка, керамогранит и мозаика</a>
            <a class="header__submenu-link" href="sales.html">Акции</a>
          </nav>
        </div>
      </div>

      <div class="mobile-menu" aria-label="Мобильное меню">
        <div class="mobile-menu__overlay" data-menu-close></div>
        <div class="mobile-menu__panel" role="dialog" aria-modal="true">
          <div class="mobile-menu__head">
            <div class="mobile-menu__title">Меню</div>
            <button class="mobile-menu__close" type="button" aria-label="Закрыть" data-menu-close>
              ×
            </button>
          </div>

          <div class="mobile-menu__section">
            <div class="mobile-menu__section-title">Каталог</div>
            <a class="mobile-menu__link" href="#">Каталог по комнатам</a>
            <a class="mobile-menu__link" href="#">Дизайн-проекты</a>
            <a class="mobile-menu__link" href="#">Мебель на заказ</a>
            <a class="mobile-menu__link" href="sales.html">Акции</a>
          </div>

          <div class="mobile-menu__section">
            <div class="mobile-menu__section-title">Информация</div>
            <a class="mobile-menu__link" href="#">О нас</a>
            <a class="mobile-menu__link" href="salons.html">Наши салоны</a>
            <a class="mobile-menu__link" href="#">Оплата и доставка</a>
            <a class="mobile-menu__link" href="#">Для бизнеса</a>
          </div>

          <div class="mobile-menu__section">
            <div class="mobile-menu__section-title">Контакты</div>
            <a class="mobile-menu__phone" href="tel:+78007004024">8 800 700 40 24</a>
            <a class="mobile-menu__link" href="#">Позвонить или написать</a>
          </div>
        </div>
      </div>
  `.trim();

  initMobileMenu();
  initCityDropdown();
  initThemeDropdown();

  applySavedA11yMode();
  const a11yToggle = document.getElementById("a11yToggle");
  if (a11yToggle instanceof HTMLButtonElement) {
    const isOn = getSavedA11yMode() === "on";
    a11yToggle.setAttribute("aria-pressed", String(isOn));
    a11yToggle.addEventListener("click", () => {
      const next = toggleA11yMode();
      a11yToggle.setAttribute("aria-pressed", String(next === "on"));
    });
  }

  initGoogleTranslate();
  initTranslateDropdown();

  initBookingModal();
  bindBookingModalTrigger({ selector: "#bookingAction" });
}
