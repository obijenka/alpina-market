function createOfferCard(offer) {
  const card = document.createElement("article");
  card.className = "offer-card";
  card.dataset.offerId = offer.id;

  card.innerHTML = `
  <div class="offer-card__inner">
     <div class="offer-card__badge">${offer.badge ?? ""}</div>
     <button class="offer-card__fav" type="button" aria-label="В избранное">
       <img width="20" height="16" src="assets/icons/fav-black.svg" alt="" />
     </button>
    <div class="offer-card__image">
      <img src="${offer.image}" alt="" />
    </div>
  </div>
    <div class="offer-card__content">
      <div class="offer-card__row">
        <div class="offer-card__title">${String(offer.title).replaceAll("\n", "<br />")}</div>
        <div class="offer-card__price">${offer.price}</div>
      </div>
      <div class="offer-card__sizes">${offer.size}</div>
      <div class="offer-card__bottom">
        <div class="offer-card__thumbs">
          <div class="offer-card__thumb"><img src="${offer.image}" alt="" /></div>
          <div class="offer-card__thumb"><img src="${offer.image}" alt="" /></div>
          <div class="offer-card__thumb"><img src="${offer.image}" alt="" /></div>
          <div class="offer-card__more">+5</div>
        </div>
        <button class="offer-card__cart" type="button" aria-label="В корзину">
          <img width="21" height="21" src="assets/icons/cart-black.svg" alt="" />
        </button>
      </div>
    </div>
  `;

  return card;
}

export function renderOffers(offers, rootEl) {
  if (!rootEl) return;
  rootEl.innerHTML = "";
  offers.forEach((offer) => rootEl.append(createOfferCard(offer)));
}
