const BOOKING_MODAL_SELECTOR = ".booking-modal";
const BOOKING_SUCCESS_MODAL_SELECTOR = ".booking-success-modal";

export function mountBookingModalMarkup() {
  const hasBooking = Boolean(document.querySelector(BOOKING_MODAL_SELECTOR));
  const hasSuccess = Boolean(document.querySelector(BOOKING_SUCCESS_MODAL_SELECTOR));
  if (hasBooking && hasSuccess) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div>
      <div class="booking-modal" aria-label="Онлайн-запись" role="dialog" aria-modal="true">
        <div class="booking-modal__overlay" data-booking-close></div>
        <div class="booking-modal__panel">
          <div class="booking-modal__head">
            <div class="booking-modal__title">Бесплатная консультация</div>
            <button class="booking-modal__close" type="button" aria-label="Закрыть" data-booking-close>
              ×
            </button>
          </div>

          <div class="booking-modal__body">
            <form id="bookingForm" autocomplete="off">
              <label class="booking-field">
                <div class="booking-field__label">Что вас интересует?</div>
                <div class="booking-dropdown" data-booking-topic-dropdown>
                  <input type="hidden" name="topic" value="" />
                  <button class="booking-dropdown__btn" type="button" data-dropdown-button aria-haspopup="listbox" aria-expanded="false">
                    <span class="booking-dropdown__label" data-dropdown-label>Выберите…</span>
                    <img class="booking-dropdown__chevron" src="assets/icons/chevron.svg" alt="chevron" />
                  </button>
                  <div class="booking-dropdown__menu" data-dropdown-menu role="listbox">
                    <button class="booking-dropdown__option" type="button" data-topic-value="consult">Консультация дизайнера</button>
                    <button class="booking-dropdown__option" type="button" data-topic-value="measure">Замер</button>
                    <button class="booking-dropdown__option" type="button" data-topic-value="selection">Подбор мебели</button>
                  </div>
                </div>
              </label>

              <label class="booking-field">
                <div class="booking-field__label">Имя</div>
                <input class="booking-field__input" type="text" name="name" required />
              </label>

              <label class="booking-field">
                <div class="booking-field__label">Телефон</div>
                <input class="booking-field__input" type="tel" name="phone" required />
              </label>

              <label class="booking-field">
                <div class="booking-field__label">Email (необязательно)</div>
                <input class="booking-field__input" type="email" name="email" />
              </label>

              <label class="booking-field">
                <div class="booking-field__label">Комментарий (необязательно)</div>
                <textarea class="booking-field__input" name="comment" rows="3"></textarea>
              </label>

              <div class="booking-actions">
                <button class="booking-btn" type="submit">Отправить</button>
                <button class="booking-btn booking-btn--light" type="button" data-booking-close>Отмена</button>
              </div>

              <div class="booking-error" id="bookingError"></div>
              <div class="booking-success" id="bookingSuccess"></div>
            </form>
          </div>
        </div>
      </div>

      <div class="booking-success-modal" aria-label="Заявка принята" role="dialog" aria-modal="true">
        <div class="booking-success-modal__overlay" data-booking-success-close></div>
        <div class="booking-success-modal__panel">
          <div class="booking-modal__head">
            <div class="booking-modal__title"></div>
            <button class="booking-modal__close" type="button" aria-label="Закрыть" data-booking-success-close>
              ×
            </button>
          </div>

          <div class="booking-success-modal__body">
            <img class="booking-success-modal__icon" src="assets/icons/success.png" alt="" />
            <div class="booking-success-modal__title">Спасибо!</div>
            <div class="booking-success-modal__text">Заявка принята. Менеджер перезвонит вам в течение 15 минут.</div>
          </div>
        </div>
      </div>
    </div>
  `.trim();

  const modal = wrapper.firstElementChild;
  if (!(modal instanceof HTMLElement)) return;

  document.body.appendChild(modal);
}
