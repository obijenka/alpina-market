import { addProduct, getProducts, removeProduct } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function renderProducts() {
  const list = document.querySelector("#adminProductsList");
  if (!list) return;

  const products = await getProducts();

  if (products.length === 0) {
    list.innerHTML = '<div class="admin__empty">Товаров пока нет</div>';
    return;
  }

  list.innerHTML = products
    .map(
      (p) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(p.title)}</div>
            <div class="admin-row__meta">${escapeHtml(p.price)} ₽</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-product="${escapeHtml(p.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void (async () => {
        const id = btn.getAttribute("data-remove-product");
        if (!id) return;
        await removeProduct(id);
        await renderProducts();
      })();
    });
  });
}

export function initProductCreate() {
  const form = document.querySelector("#adminCreateProductForm");
  const error = document.querySelector("#adminCreateProductError");

  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    void (async () => {
      const formData = new FormData(form);
      const title = String(formData.get("title") ?? "");
      const price = String(formData.get("price") ?? "");
      const image = String(formData.get("image") ?? "");

      const result = await addProduct({ title, price, image });
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }

      if (error) error.textContent = "";
      form.reset();
      await renderProducts();
    })();
  });
}
