import { mountBookingModalMarkup } from "./bookingModalMarkup.js";

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

function openModal() {
  const { modal } = getEls();
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

export function openBookingModal() {
  openModal();
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
}

export function bindBookingModalTrigger({ selector }) {
  const trigger = document.querySelector(selector);
  if (!trigger) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
}
