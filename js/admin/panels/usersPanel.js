import { addUser, getUsers, removeUser } from "../../services/index.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function renderUsers() {
  const list = document.querySelector("#adminUsersList");
  if (!list) return;

  const users = await getUsers();

  if (users.length === 0) {
    list.innerHTML = '<div class="admin__empty">Пользователей пока нет</div>';
    return;
  }

  list.innerHTML = users
    .map(
      (u) => `
        <div class="admin-row">
          <div class="admin-row__main">
            <div class="admin-row__title">${escapeHtml(u.login)}</div>
            <div class="admin-row__meta">id: ${escapeHtml(u.id)}</div>
          </div>
          <button class="admin-btn admin-btn--danger" type="button" data-remove-user="${escapeHtml(u.id)}">Удалить</button>
        </div>
      `.trim(),
    )
    .join("");

  list.querySelectorAll("[data-remove-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void (async () => {
        const id = btn.getAttribute("data-remove-user");
        if (!id) return;
        await removeUser(id);
        await renderUsers();
      })();
    });
  });
}

export function initUserCreate() {
  const form = document.querySelector("#adminCreateUserForm");
  const error = document.querySelector("#adminCreateUserError");

  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await addUser({ login, password });
    if (!result.ok) {
      if (error) error.textContent = result.message;
      return;
    }

    if (error) error.textContent = "";
    form.reset();
    await renderUsers();
  });
}
