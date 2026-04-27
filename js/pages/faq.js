import { initAuthModal, openAuthModal } from "../auth/authModal.js";
import { getFaq, getSession } from "../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFaq(listEl, items) {
  if (!listEl) return;

  listEl.innerHTML = items
    .map((item) => {
      const paragraphs = (item.answer ?? [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");

      return `
        <div class="faq-item" data-faq-item>
          <button class="faq-item__head" type="button" data-faq-toggle aria-expanded="false">
            <span class="faq-item__q">${escapeHtml(item.question)}</span>
            <span class="faq-item__chev" aria-hidden="true"></span>
          </button>
          <div class="faq-item__body" data-faq-body>
            <div class="faq-item__text">
              ${paragraphs}
            </div>
          </div>
        </div>
      `.trim();
    })
    .join("");
}

function initFaqAccordion() {
  const toggles = document.querySelectorAll("[data-faq-toggle]");
  if (toggles.length === 0) return;

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest("[data-faq-item]");
      if (!(item instanceof HTMLElement)) return;

      const body = item.querySelector("[data-faq-body]");
      if (!(body instanceof HTMLElement)) return;

      const isOpen = item.classList.contains("is-open");
      const nextOpen = !isOpen;

      if (nextOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");

        body.style.height = "0px";

        const targetHeight = body.scrollHeight;
        requestAnimationFrame(() => {
          body.style.height = `${targetHeight}px`;
        });

        const onEnd = (e) => {
          if (e.propertyName !== "height") return;
          body.style.height = "auto";
          body.removeEventListener("transitionend", onEnd);
        };

        body.addEventListener("transitionend", onEnd);
        return;
      }

      const currentHeight = body.scrollHeight;
      body.style.height = `${currentHeight}px`;

      requestAnimationFrame(() => {
        body.style.height = "0px";
      });

      const onEnd = (e) => {
        if (e.propertyName !== "height") return;
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        body.removeEventListener("transitionend", onEnd);
      };

      body.addEventListener("transitionend", onEnd);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthModal();
  const profileAction = document.querySelector("#profileAction");
  if (profileAction) {
    profileAction.addEventListener("click", (e) => {
      e.preventDefault();
      void (async () => {
        const session = await getSession();
        if (session?.role === "user") {
          window.location.href = "profile.html";
          return;
        }
        openAuthModal();
      })();
    });
  }

  void (async () => {
    const list = document.getElementById("faqList");
    const items = await getFaq();
    renderFaq(list, items);
    initFaqAccordion();
  })();

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

  if (burger && menu) {
    burger.addEventListener("click", openMenu);
  }

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
});
