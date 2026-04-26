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
