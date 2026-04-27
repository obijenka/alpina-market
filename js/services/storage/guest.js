import { apiGet, apiPatch } from "../api.js";

export async function getGuest() {
  return apiGet("/guest");
}

export async function patchGuest(patch) {
  return apiPatch("/guest", patch);
}
