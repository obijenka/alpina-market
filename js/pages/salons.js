import { openAuthModal, initAuthModal } from "../auth/authModal.js";
import { getSession } from "../services/index.js";
import { mountLayout } from "../utils/layout.js";
import { applySavedTheme, initThemeSelect } from "../utils/theme.js";
import { getSavedCity } from "../utils/city.js";

applySavedTheme();

const salons = [
  {
    title: "Alpina, Немига",
    city: "Минск",
    address: "Минск, ул. Немига, 5",
    phone: "+375 17 700-40-24",
    hours: "Ежедневно 10:00–21:00",
    coords: [53.9023, 27.5526],
  },
  {
    title: "Alpina, Зелёный Луг",
    city: "Минск",
    address: "Минск, Логойский тракт, 37",
    phone: "+375 17 700-40-25",
    hours: "Ежедневно 10:00–22:00",
    coords: [53.9528, 27.6266],
  },
  {
    title: "Alpina, Малиновка",
    city: "Минск",
    address: "Минск, пр-т Дзержинского, 104",
    phone: "+375 17 700-40-26",
    hours: "Пн–Сб 10:00–21:00, Вс 11:00–20:00",
    coords: [53.8497, 27.4748],
  },
  {
    title: "Alpina, Уручье",
    city: "Минск",
    address: "Минск, пр-т Независимости, 168",
    phone: "+375 17 700-40-27",
    hours: "Ежедневно 10:00–21:00",
    coords: [53.9469, 27.6878],
  },
  {
    title: "Alpina, Центр",
    city: "Гомель",
    address: "Гомель, ул. Советская, 10",
    phone: "+375 23 700-40-24",
    hours: "Ежедневно 10:00–21:00",
    coords: [52.425, 31.015],
  },
  {
    title: "Alpina, Вокзал",
    city: "Гомель",
    address: "Гомель, пр-т Ленина, 2",
    phone: "+375 23 700-40-25",
    hours: "Пн–Сб 10:00–21:00, Вс 11:00–20:00",
    coords: [52.437, 30.99],
  },
  {
    title: "Alpina, Центр",
    city: "Брест",
    address: "Брест, ул. Советская, 1",
    phone: "+375 16 700-40-24",
    hours: "Ежедневно 10:00–21:00",
    coords: [52.097, 23.734],
  },
  {
    title: "Alpina, Московский",
    city: "Брест",
    address: "Брест, ул. Московская, 20",
    phone: "+375 16 700-40-25",
    hours: "Ежедневно 10:00–22:00",
    coords: [52.088, 23.71],
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

function getCitySalons(city) {
  return salons.filter((s) => s.city === city);
}

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function filterSalonsByQuery(list, query) {
  const q = norm(query);
  if (!q) return list;

  return list.filter((s) => {
    const hay = norm([s.title, s.address, s.phone, s.hours].filter(Boolean).join(" "));
    return hay.includes(q);
  });
}

function initSalonsMap() {
  const mapEl = document.getElementById("salonsMap");
  if (!mapEl || !window.ymaps) return;

  const searchInput = document.getElementById("salonsSearch");
  const getQuery = () => (searchInput instanceof HTMLInputElement ? searchInput.value : "");

  window.ymaps.ready(() => {
    const map = new window.ymaps.Map("salonsMap", {
      center: [53.9023, 27.5619],
      zoom: 11,
      controls: ["zoomControl", "fullscreenControl"],
    });

    let currentCity = getSavedCity();

    function render(city) {
      currentCity = city;
      const list = filterSalonsByQuery(getCitySalons(city), getQuery());
      map.geoObjects.removeAll();

      list.forEach((salon) => {
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

      if (list.length > 1) {
        const bounds = map.geoObjects.getBounds();
        if (bounds) {
          map.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: 48,
          });
        }
      } else if (list.length === 1) {
        map.setCenter(list[0].coords, 12);
      }
    }

    render(currentCity);

    document.addEventListener("alpina:city-changed", (e) => {
      const city = e?.detail?.city;
      if (typeof city !== "string" || city.trim() === "") return;
      render(city);
    });

    if (searchInput instanceof HTMLInputElement) {
      searchInput.addEventListener("input", () => {
        render(currentCity);
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
