import { mountBookingModalMarkup } from "./bookingModalMarkup.js";
import { getCurrentUser } from "../services/index.js";

function initBookingTopicDropdown({
  rootSelector = "[data-booking-topic-dropdown]",
  buttonSelector = "[data-dropdown-button]",
  menuSelector = "[data-dropdown-menu]",
  optionSelector = "[data-topic-value]",
  labelSelector = "[data-dropdown-label]",
  inputSelector = "input[name='topic']",
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!(root instanceof HTMLElement)) return;

  const button = root.querySelector(buttonSelector);
  const menu = root.querySelector(menuSelector);
  const label = root.querySelector(labelSelector);
  const hiddenInput = root.querySelector(inputSelector);

  if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;
  if (!(hiddenInput instanceof HTMLInputElement)) return;

  const options = Array.from(root.querySelectorAll(optionSelector)).filter((el) => el instanceof HTMLElement);
  if (options.length === 0) return;

  const labels = {
    consult: "Консультация дизайнера",
    measure: "Замер",
    selection: "Подбор мебели",
  };

  function setLabel(value) {
    if (!(label instanceof HTMLElement)) return;
    label.textContent = labels[value] ?? "Выберите…";
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

  function setValue(next) {
    const value = String(next ?? "");
    hiddenInput.value = value;
    setLabel(value);
  }

  setValue(hiddenInput.value);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  options.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const value = String(opt.getAttribute("data-topic-value") ?? "");
      setValue(value);
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

function getEls() {
  const modal = document.querySelector(".booking-modal");
  const closeEls = document.querySelectorAll("[data-booking-close]");
  const form = document.querySelector("#bookingForm");
  const error = document.querySelector("#bookingError");
  const success = document.querySelector("#bookingSuccess");

  const successModal = document.querySelector(".booking-success-modal");
  const successCloseEls = document.querySelectorAll("[data-booking-success-close]");

  return {
    modal,
    closeEls,
    form,
    error,
    success,
    successModal,
    successCloseEls,
  };
}

async function openModal() {
  const { modal } = getEls();
  if (!modal) return;

  const { form } = getEls();
  if (form instanceof HTMLFormElement) {
    const user = await getCurrentUser();
    const nameInput = form.querySelector("[name='name']");
    const phoneInput = form.querySelector("[name='phone']");
    const emailInput = form.querySelector("[name='email']");

    if (user?.profile) {
      const fullName = String(user.profile.fullName ?? "").trim();
      const phone = String(user.profile.phone ?? "").trim();
      const email = String(user.profile.email ?? "").trim();

      if (nameInput instanceof HTMLInputElement && !nameInput.value.trim() && fullName) {
        nameInput.value = fullName;
      }
      if (phoneInput instanceof HTMLInputElement && !phoneInput.value.trim() && phone) {
        phoneInput.value = phone;
      }
      if (emailInput instanceof HTMLInputElement && !emailInput.value.trim() && email) {
        emailInput.value = email;
      }
    }
  }

  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

export function openBookingModal() {
  void openModal();
}

function closeModal() {
  const { modal } = getEls();
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function openSuccessModal() {
  const { successModal } = getEls();
  if (!successModal) return;
  successModal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
  const { successModal } = getEls();
  if (!successModal) return;
  successModal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function initCloseLogic() {
  const { closeEls, successCloseEls } = getEls();
  closeEls.forEach((el) => el.addEventListener("click", closeModal));
  successCloseEls.forEach((el) => el.addEventListener("click", closeSuccessModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeSuccessModal();
    }
  });
}

function initForm() {
  const { form, error, success } = getEls();
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (error) error.textContent = "";
    if (success) success.textContent = "";

    const formData = new FormData(form);
    const topic = String(formData.get("topic") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!topic || !name || !phone) {
      if (error) error.textContent = "Заполните тему, имя и телефон";
      return;
    }

    if (success) success.textContent = "";
    form.reset();
    closeModal();
    openSuccessModal();
  });
}

export function initBookingModal() {
  mountBookingModalMarkup();
  const { modal } = getEls();
  if (!modal) return;

  initCloseLogic();
  initForm();
  initBookingTopicDropdown();
}

export function bindBookingModalTrigger({ selector }) {
  const trigger = document.querySelector(selector);
  if (!trigger) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    void openModal();
  });
}
