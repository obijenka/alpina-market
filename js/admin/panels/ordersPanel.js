import { getAllOrdersAdmin, updateOrderStatusAdmin } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatRub(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("ru-RU");
}

export async function renderOrders() {
  const list = document.querySelector("#adminOrdersList");
  if (!list) return;

  const orders = await getAllOrdersAdmin();
  if (orders.length === 0) {
    list.innerHTML = '<div class="admin__empty">Заказов пока нет</div>';
    return;
  }

  list.innerHTML = orders
    .map((o) => {
      const itemsCount = Array.isArray(o.items) ? o.items.reduce((s, i) => s + Number(i.qty ?? 0), 0) : 0;
      const title = `Заказ ${String(o.id).slice(0, 8)} · ${escapeHtml(o.ownerLogin || "")}`;
      const meta = `Статус: ${escapeHtml(o.status)} · Сумма: ${escapeHtml(formatRub(o.total))} ₽ · Товаров: ${escapeHtml(itemsCount)}`;
      return `
        <div class="admin-row" data-order-id="${escapeHtml(o.id)}">
          <div class="admin-row__main">
            <div class="admin-row__title">${title}</div>
            <div class="admin-row__meta">${meta}</div>
          </div>
          <select class="admin-field__input admin-order-status" data-order-status>
            <option value="current" ${o.status === "current" ? "selected" : ""}>Текущий</option>
            <option value="done" ${o.status === "done" ? "selected" : ""}>Выполнен</option>
            <option value="canceled" ${o.status === "canceled" ? "selected" : ""}>Отменён</option>
          </select>
        </div>
      `.trim();
    })
    .join("");

  list.querySelectorAll("[data-order-id]").forEach((row) => {
    row.addEventListener("change", (e) => {
      void (async () => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const select = target.closest("[data-order-status]");
        if (!(select instanceof HTMLSelectElement)) return;
        const id = row.getAttribute("data-order-id");
        if (!id) return;
        await updateOrderStatusAdmin(id, select.value);
        await renderOrders();
      })();
    });
  });
}
