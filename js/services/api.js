const API_BASE_URL = "http://localhost:3000";

async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message = text || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function apiGet(path) {
  return apiFetch(path, { method: "GET" });
}

export function apiPost(path, body) {
  return apiFetch(path, { method: "POST", body });
}

export function apiPut(path, body) {
  return apiFetch(path, { method: "PUT", body });
}

export function apiPatch(path, body) {
  return apiFetch(path, { method: "PATCH", body });
}

export function apiDelete(path) {
  return apiFetch(path, { method: "DELETE" });
}
