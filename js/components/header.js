const HEADER_SELECTOR = "header.header";

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
            <button class="header__city" type="button">
              Санкт-Петербург
              <img
                class="header__chevron"
                src="assets/icons/chevron.svg"
                alt="chevron"
              />
            </button>

            <select class="header__theme" id="themeSelect" aria-label="Тема">
              <option value="light">Светлая</option>
              <option value="dark">Темная</option>
            </select>
          </div>

          <nav class="header__top-nav" aria-label="Верхнее меню">
            <a class="header__top-link" href="#">О нас</a>
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
            <a class="header__submenu-link" href="catalog.html">Акции</a>
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
            <a class="mobile-menu__link" href="#">Акции</a>
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
}
