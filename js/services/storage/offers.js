import { apiGet } from "../api.js";

export async function getOffers() {
  return apiGet("/offers");
}
