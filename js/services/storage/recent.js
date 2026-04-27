import { apiGet } from "../api.js";

export async function getRecentItems() {
  return apiGet("/recent");
}
