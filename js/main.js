import { OFFERS, renderOffers } from "./cardRenderer.js";

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("offersGrid");
  renderOffers(OFFERS, grid);
});