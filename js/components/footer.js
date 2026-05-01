const FOOTER_SELECTOR = "footer.footer";

export function mountFooter() {
  const footer = document.querySelector(FOOTER_SELECTOR);
  if (!footer) return;

  footer.innerHTML = `
      <div class="footer__top">
        <div class="container footer__top-inner">
          <div class="footer__col footer__col-catalog">
            <div class="footer__title">Каталог</div>
            <nav class="footer__nav" aria-label="Каталог">
              <a class="footer__link" href="#">Акции</a>
              <a class="footer__link" href="#">Мебель</a>
              <a class="footer__link" href="#">Список комнат</a>
              <a class="footer__link" href="#">Товары для дома</a>
              <a class="footer__link" href="#">Фурнитура и комплектующие</a>
              <a class="footer__link" href="#">Плитка, керамогранит и мозаика</a>
            </nav>
          </div>

          <div class="footer__col footer__col-customer">
            <div class="footer__title">Покупателю</div>
            <nav class="footer__nav" aria-label="Покупателю">
              <a class="footer__link" href="#">Мебель на заказ</a>
              <a class="footer__link" href="#">Дизайн-проекты</a>
              <a class="footer__link" href="salons.html">Наши салоны</a>
              <a class="footer__link" href="#">Оплата и доставка</a>
              <a class="footer__link" href="#">О нас</a>
              <a class="footer__link" href="#">Для бизнеса</a>
            </nav>
          </div>

          <div class="footer__col footer__contacts">
            <div class="footer__title">Контакты</div>
            <div class="footer__contact">
              <div class="footer__contact-label">Единая справочная:</div>
              <a class="footer__phone" href="tel:+78007004024">8 800 700 40 24</a>
              <div class="footer__contact-note">Звонок по России бесплатный.</div>
              <div class="footer__contact-note">Режим работы: с 02:00 до 23:00 (МСК).</div>
            </div>
            <div class="footer__social">
              <div class="footer__social-label">Присоединяйтесь к нам в социальных сетях</div>
              <div class="footer__social-icons">
                <a class="footer__social-link" href="#" aria-label="YouTube">
                  <img width="16px" height="16px" src="assets/footer/youtube.svg" alt="" />
                </a>
                <a class="footer__social-link" href="#" aria-label="Instagram">
                  <img width="16px" height="16px" src="assets/footer/instagram.svg" alt="" />
                </a>
              </div>
            </div>
          </div>

          <div class="footer__col footer__pay">
            <div class="footer__title footer__title-cards">Мы принимаем к оплате</div>
            <div class="footer__cards">
              <img src="assets/footer/cards.png" alt="" />
            </div>
            <div class="footer__feedback">
              <div class="footer__feedback-label">Нам важно ваше мнение</div>
              <a class="footer__btn" href="#">Написать нам</a>
            </div>
          </div>
        </div>
      </div>

      <div class="footer__bottom">
        <div class="container footer__bottom-inner">
          <div class="footer__info">
            <div class="footer__copy">© 2020 Rendement. All rights reserved</div>
            <a class="footer__privacy" href="#">Политика конфиденциальности</a>
          </div>

          <div class="footer__dev">Developed by Legacystudio</div>
        </div>
      </div>
  `.trim();
}
