import { openAuthModal, initAuthModal } from "../auth/authModal.js";
import { getSession } from "../services/index.js";
import { mountLayout } from "../utils/layout.js";
import { applySavedTheme, initThemeSelect } from "../utils/theme.js";

applySavedTheme();

const salons = [
  {
    title: "Alpina, Немига",
    address: "Минск, ул. Немига, 5",
    phone: "+375 17 700-40-24",
    hours: "Ежедневно 10:00–21:00",
    coords: [53.9023, 27.5526],
  },
  {
    title: "Alpina, Зелёный Луг",
    address: "Минск, Логойский тракт, 37",
    phone: "+375 17 700-40-25",
    hours: "Ежедневно 10:00–22:00",
    coords: [53.9528, 27.6266],
  },
  {
    title: "Alpina, Малиновка",
    address: "Минск, пр-т Дзержинского, 104",
    phone: "+375 17 700-40-26",
    hours: "Пн–Сб 10:00–21:00, Вс 11:00–20:00",
    coords: [53.8497, 27.4748],
  },
  {
    title: "Alpina, Уручье",
    address: "Минск, пр-т Независимости, 168",
    phone: "+375 17 700-40-27",
    hours: "Ежедневно 10:00–21:00",
    coords: [53.9469, 27.6878],
  },
];

function getBalloonContent(salon) {
  return `
    <div class="salons-map-balloon">
      <strong>${salon.title}</strong>
      <div>${salon.address}</div>
      <div>${salon.hours}</div>
      <a href="tel:${salon.phone.replace(/[^\d+]/g, "")}">${salon.phone}</a>
    </div>
  `.trim();
}

function initSalonsMap() {
  const mapEl = document.getElementById("salonsMap");
  if (!mapEl || !window.ymaps) return;

  window.ymaps.ready(() => {
    const map = new window.ymaps.Map("salonsMap", {
      center: [53.9023, 27.5619],
      zoom: 11,
      controls: ["zoomControl", "fullscreenControl"],
    });

    salons.forEach((salon) => {
      const placemark = new window.ymaps.Placemark(
        salon.coords,
        {
          hintContent: salon.title,
          balloonContent: getBalloonContent(salon),
        },
        {
          preset: "islands#darkGreenShoppingIcon",
        }
      );

      map.geoObjects.add(placemark);
    });

    if (salons.length > 1) {
      map.setBounds(map.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 48,
      });
    }
  });
}

function initHeaderActions() {
  const profileAction = document.querySelector("#profileAction");
  if (profileAction) {
    profileAction.addEventListener("click", (e) => {
      e.preventDefault();
      void (async () => {
        const session = await getSession();
        if (session?.role === "user") {
          window.location.href = "profile.html";
          return;
        }
        openAuthModal();
      })();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  mountLayout();
  initThemeSelect();
  initAuthModal();
  initHeaderActions();
  initSalonsMap();
});
