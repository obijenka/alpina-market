const AUTH_MODAL_SELECTOR = ".auth-modal";
 
export function mountAuthModalMarkup() {
  if (document.querySelector(AUTH_MODAL_SELECTOR)) return;
 
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="auth-modal" aria-label="Авторизация" role="dialog" aria-modal="true">
      <div class="auth-modal__overlay" data-auth-close></div>
      <div class="auth-modal__panel">
        <div class="auth-modal__head">
          <div class="auth-modal__title">Профиль</div>
          <button class="auth-modal__close" type="button" aria-label="Закрыть" data-auth-close>
            ×
          </button>
        </div>
 
        <div class="auth-modal__tabs" aria-label="Вкладки">
          <button class="auth-modal__tab" type="button" data-auth-tab="login">Вход</button>
          <button class="auth-modal__tab" type="button" data-auth-tab="register">Регистрация</button>
        </div>
 
        <div class="auth-modal__panel-body">
          <div class="auth-modal__content" data-auth-panel="login">
            <form class="auth-form" id="authLoginForm" autocomplete="off">
              <label class="auth-field">
                <div class="auth-field__label">Логин</div>
                <input class="auth-field__input" type="text" name="login" autocomplete="off" required />
              </label>
 
              <label class="auth-field">
                <div class="auth-field__label">Пароль</div>
                <input class="auth-field__input" type="password" name="password" autocomplete="off" required />
              </label>
 
              <div class="auth-form__error" id="authLoginError"></div>
 
              <button class="auth-form__btn" type="submit">Войти</button>
            </form>
          </div>
 
          <div class="auth-modal__content" data-auth-panel="register">
            <form class="auth-form" id="authRegisterForm" autocomplete="off">
              <label class="auth-field">
                <div class="auth-field__label">Логин</div>
                <input class="auth-field__input" type="text" name="login" autocomplete="off" required />
              </label>
 
              <label class="auth-field">
                <div class="auth-field__label">Пароль</div>
                <input class="auth-field__input" type="password" name="password" autocomplete="new-password" required />
              </label>
 
              <div class="auth-form__error" id="authRegisterError"></div>
 
              <button class="auth-form__btn" type="submit">Создать аккаунт</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `.trim();
 
  const modal = wrapper.firstElementChild;
  if (!(modal instanceof HTMLElement)) return;
 
  document.body.appendChild(modal);
}
