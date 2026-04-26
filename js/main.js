import { OFFERS, renderOffers } from "./cardRenderer.js";
import { RECENT_ITEMS, renderRecent } from "./recentRenderer.js";

document.addEventListener("DOMContentLoaded", () => {
  const offersGrid = document.getElementById("offersGrid");
  renderOffers(OFFERS, offersGrid);

  const recentGrid = document.getElementById("recentGrid");
  renderRecent(RECENT_ITEMS, recentGrid);
});