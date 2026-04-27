import { addFaqItem, getFaq, removeFaqItem } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function renderFaq() {
  const list = document.querySelector("#adminFaqList");
  if (!list) return;

  const items = await getFaq();

  if (items.length === 0) {
    list.innerHTML = '<div class="admin__empty">Вопросов пока нет</div>';
    return;
  }

  list.innerHTML = items
    .map(
      (i) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(i.question)}</div>
            <div class="admin-row__meta">id: ${escapeHtml(i.id)}</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-faq="${escapeHtml(i.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-faq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void (async () => {
        const id = btn.getAttribute("data-remove-faq");
        if (!id) return;
        await removeFaqItem(id);
        await renderFaq();
      })();
    });
  });
}

export function initFaqCreate() {
  const form = document.querySelector("#adminCreateFaqForm");
  const error = document.querySelector("#adminCreateFaqError");

  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    void (async () => {
      const formData = new FormData(form);
      const question = String(formData.get("question") ?? "");
      const answer = String(formData.get("answer") ?? "");

      const result = await addFaqItem({ question, answer });
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }

      if (error) error.textContent = "";
      form.reset();
      await renderFaq();
    })();
  });
}
