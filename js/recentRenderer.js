export const RECENT_ITEMS = [
  {
    id: "1",
    title: "Кресло ARONA, розовый, ALP00009126",
    price: "88 500 руб.",
    image: "assets/furniture/armchair.png",
  },
  {
    id: "2",
    title: "Кресло ARONA, розовый, ALP00009126",
    price: "300 000 руб.",
    image: "assets/offers/offer3.png",
  },
  {
    id: "3",
    title: "Кресло ARONA, розовый, ALP00009126",
    price: "2 500 руб.",
    image: "assets/offers/offer5.png",
  },
  {
    id: "4",
    title: "Кресло ARONA, розовый, ALP00009126",
    price: "300 000 руб.",
    image: "assets/furniture/armchair.png",
  },
];

function createRecentCard(item) {
  const card = document.createElement("a");
  card.className = "recent-card";
  card.href = item.href ?? "#";
  card.dataset.recentId = item.id;

  card.innerHTML = `
    <div class="recent-card__image">
      <img src="${item.image}" alt="" />
    </div>
    <div class="recent-card__content">
      <div class="recent-card__name">${item.title}</div>
      <div class="recent-card__price">${item.price}</div>
    </div>
  `;

  return card;
}

export function renderRecent(items, rootEl) {
  if (!rootEl) return;
  rootEl.innerHTML = "";
  items.forEach((item) => rootEl.append(createRecentCard(item)));
}
