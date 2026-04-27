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

function parseCsv(value) {
  return String(value ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseCsvLower(value) {
  return parseCsv(value).map((x) => x.toLowerCase());
}

function parseOptionalNumber(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parsePriceRequired(value) {
  const s = String(value ?? "").trim();
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function parseJsonObject(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad_json");
  return parsed;
}

export async function addProduct(payload) {
  const title = String(payload?.title ?? "").trim();
  if (!title) return { ok: false, message: "Введите название" };

  const priceNumber = parsePriceRequired(payload?.price);
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return { ok: false, message: "Введите корректную цену" };
  }

  const oldPriceNumber = parseOptionalNumber(payload?.oldPrice);

  const sku = String(payload?.sku ?? "").trim();
  const description = String(payload?.description ?? "").trim();
  const image = String(payload?.image ?? "").trim();

  const images = parseCsv(payload?.images);
  const categories = parseCsvLower(payload?.categories);
  const tags = parseCsvLower(payload?.tags);
  const category = categories[0] ?? "";
  const badge = String(payload?.badge ?? "").trim();

  const inStock = payload?.inStock == null ? true : Boolean(payload?.inStock);
  const showOnHome = Boolean(payload?.showOnHome);
  const homeOrderNum = parseOptionalNumber(payload?.homeOrder);
  const homeOrder = homeOrderNum == null ? 0 : homeOrderNum;

  let attributes = {};
  try {
    attributes = parseJsonObject(payload?.attributes);
  } catch {
    return { ok: false, message: "Attributes: некорректный JSON" };
  }

  const now = new Date().toISOString();

  const product = await apiPost("/products", {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    sku,
    title,
    description,
    price: priceNumber,
    oldPrice: oldPriceNumber ?? undefined,
    currency: "RUB",
    category,
    categories,
    tags,
    image,
    images: images.length ? images : image ? [image] : [],
    attributes,
    inStock,
    showOnHome,
    homeOrder,
    badge,
    rating: { avg: 0, count: 0 },
    createdAt: now,
    updatedAt: now,
  });

  return { ok: true, product };
}

export async function removeProduct(productId) {
  const id = String(productId ?? "").trim();
  if (!id) return { ok: false };
  await apiDelete(`/products/${encodeURIComponent(id)}`);
  return { ok: true };
}
