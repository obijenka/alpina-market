import { apiDelete, apiGet, apiPost } from "../api.js";

export async function getProducts() {
  return apiGet("/products");
}

export async function getProductById(productId) {
  const id = String(productId ?? "").trim();
  if (!id) return null;
  try {
    return await apiGet(`/products/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function addProduct({ title, price, image }) {
  const trimmedTitle = String(title ?? "").trim();
  const trimmedPrice = String(price ?? "").trim();
  const trimmedImage = String(image ?? "").trim();

  if (!trimmedTitle) return { ok: false, message: "Введите название" };

  const priceNumber = Number(trimmedPrice.replace(",", "."));
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return { ok: false, message: "Введите корректную цену" };
  }

  const product = await apiPost("/products", {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: trimmedTitle,
    price: priceNumber,
    image: trimmedImage,
    createdAt: new Date().toISOString(),
  });

  return { ok: true, product };
}

export async function removeProduct(productId) {
  const id = String(productId ?? "").trim();
  if (!id) return { ok: false };
  await apiDelete(`/products/${encodeURIComponent(id)}`);
  return { ok: true };
}
