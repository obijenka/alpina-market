
 export const OFFERS = [
   {
     id: "1",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer1.png",
     badge: "Распродажа",
   },
   {
     id: "2",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer2.png",
     badge: "Распродажа",
   },
   {
     id: "3",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer3.png",
     badge: "Распродажа",
   },
   {
     id: "4",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer4.png",
     badge: "Распродажа",
   },
   {
     id: "5",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer5.png",
     badge: "Распродажа",
   },
   {
     id: "6",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer6.png",
     badge: "Распродажа",
   },
   {
     id: "7",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer7.png",
     badge: "Распродажа",
   },
   {
     id: "8",
     title: "Декоративный куст, с шикарными листьями, горшком",
     price: "2 000 руб.",
     size: "120 × 212 × 46",
     image: "assets/offers/offer8.png",
     badge: "Распродажа",
   },
 ];

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

