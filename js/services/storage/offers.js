import { apiGet } from "../api.js";

export async function getOffers() {
  const products = await apiGet("/products");
  const offers = Array.isArray(products)
    ? products
        .filter((p) => Boolean(p?.showOnHome))
        .sort((a, b) => Number(a?.homeOrder ?? 0) - Number(b?.homeOrder ?? 0))
        .slice(0, 8)
        .map((p) => ({
          ...p,
          price: p.priceText ?? p.price,
          image: p.image ?? p.images?.[0],
          size: p.size ?? p.attributes?.size,
          badge: p.badge ?? p.promoLabel,
        }))
    : [];

  return offers;
}
