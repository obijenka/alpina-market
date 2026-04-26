const STORAGE_KEYS = {
  users: "alpina_users_v1",
  session: "alpina_session_v1",
  products: "alpina_products_v1",
  faq: "alpina_faq_v1",
  guestWishlist: "alpina_guest_wishlist_v1",
  guestCart: "alpina_guest_cart_v1",
  guestOrders: "alpina_guest_orders_v1",
};

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAllOrdersAdmin() {
  const users = getUsers();
  const all = [];

  users.forEach((u) => {
    const userOrders = normalizeOrders(u?.orders);
    userOrders.forEach((o) => {
      all.push({
        ...o,
        owner: {
          type: "user",
          userId: String(u.id),
        },
        ownerLogin: String(u.login ?? ""),
      });
    });
  });

  const guestOrders = normalizeOrders(read(STORAGE_KEYS.guestOrders, []));
  guestOrders.forEach((o) => {
    all.push({
      ...o,
      owner: {
        type: "guest",
        userId: "",
      },
      ownerLogin: "Гость",
    });
  });

  all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return all;
}

export function updateOrderStatusAdmin(orderId, status) {
  const id = String(orderId ?? "").trim();
  const nextStatus = String(status ?? "").trim();
  if (!id || !nextStatus) return { ok: false };

  const users = getUsers();
  let found = false;
  const nextUsers = users.map((u) => {
    const currentOrders = normalizeOrders(u?.orders);
    if (!currentOrders.some((o) => o.id === id)) return u;
    found = true;
    const nextOrders = currentOrders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    return { ...u, orders: nextOrders, updatedAt: new Date().toISOString() };
  });

  if (found) {
    setUsers(nextUsers);
    return { ok: true };
  }

  const guestOrders = normalizeOrders(read(STORAGE_KEYS.guestOrders, []));
  if (!guestOrders.some((o) => o.id === id)) {
    return { ok: false, message: "Заказ не найден" };
  }
  const nextGuest = guestOrders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
  write(STORAGE_KEYS.guestOrders, nextGuest);
  return { ok: true };
}

function normalizeOrders(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((o) => {
      if (!o || typeof o !== "object") return null;
      const id = String(o.id ?? "").trim();
      const status = String(o.status ?? "current").trim() || "current";
      const createdAt = String(o.createdAt ?? "").trim() || new Date().toISOString();
      const owner = o.owner && typeof o.owner === "object" ? o.owner : {};
      const items = Array.isArray(o.items)
        ? o.items
            .map((i) => {
              if (!i || typeof i !== "object") return null;
              const offerId = String(i.offerId ?? "").trim();
              const qty = Number(i.qty ?? 1);
              const price = Number(i.price ?? i.priceNumber ?? 0);
              if (!offerId || !Number.isFinite(qty) || qty <= 0) return null;
              return {
                offerId,
                qty,
                title: String(i.title ?? "").trim(),
                image: String(i.image ?? "").trim(),
                price: Number.isFinite(price) ? price : 0,
              };
            })
            .filter(Boolean)
        : [];
      const total = Number(o.total ?? 0);
      const customer = o.customer && typeof o.customer === "object" ? o.customer : {};
      return {
        id: id || (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())),
        status,
        createdAt,
        owner: {
          type: String(owner.type ?? "").trim(),
          userId: String(owner.userId ?? "").trim(),
        },
        items,
        total: Number.isFinite(total) ? total : 0,
        customer: {
          name: String(customer.name ?? "").trim(),
          phone: String(customer.phone ?? "").trim(),
          address: String(customer.address ?? "").trim(),
        },
      };
    })
    .filter(Boolean);
}

export function getOrders() {
  const session = getSession();
  if (session?.role === "user") {
    const user = getCurrentUser();
    return normalizeOrders(user?.orders);
  }

  return normalizeOrders(read(STORAGE_KEYS.guestOrders, []));
}

export function setOrders(orders) {
  const session = getSession();
  const normalized = normalizeOrders(orders);

  if (session?.role === "user") {
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return { ok: false, message: "Пользователь не найден" };

    const nextUsers = users.map((u) => {
      if (u.id !== user.id) return u;
      return { ...u, orders: normalized, updatedAt: new Date().toISOString() };
    });
    setUsers(nextUsers);
    return { ok: true };
  }

  write(STORAGE_KEYS.guestOrders, normalized);
  return { ok: true };
}

export function addOrder({ items, total, customer }) {
  const session = getSession();
  const owner =
    session?.role === "user"
      ? { type: "user", userId: String(session.userId ?? "").trim() }
      : { type: "guest", userId: "" };

  const order = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    status: "current",
    createdAt: new Date().toISOString(),
    owner,
    items: Array.isArray(items) ? items : [],
    total: Number(total ?? 0),
    customer: customer && typeof customer === "object" ? customer : {},
  };

  const current = getOrders();
  const next = [order, ...current];
  const res = setOrders(next);
  if (!res.ok) return res;
  return { ok: true, order: normalizeOrders([order])[0] };
}

export function updateOrderStatus(orderId, status) {
  const id = String(orderId ?? "").trim();
  const nextStatus = String(status ?? "").trim();
  if (!id || !nextStatus) return { ok: false };

  const current = getOrders();
  if (!current.some((o) => o.id === id)) return { ok: false, message: "Заказ не найден" };
  const next = current.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
  return setOrders(next);
}

export function migrateGuestOrdersToUser() {
  const session = getSession();
  if (session?.role !== "user") return { ok: false };

  const guestOrders = normalizeOrders(read(STORAGE_KEYS.guestOrders, []));
  if (guestOrders.length === 0) return { ok: true };

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const currentOrders = normalizeOrders(user.orders);
  const nextOrders = [...guestOrders, ...currentOrders];

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return { ...u, orders: nextOrders, updatedAt: new Date().toISOString() };
  });

  setUsers(nextUsers);
  localStorage.removeItem(STORAGE_KEYS.guestOrders);
  return { ok: true };
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const offerId = String(item.offerId ?? "").trim();
      const qty = Number(item.qty ?? 1);
      if (!offerId) return null;
      if (!Number.isFinite(qty) || qty <= 0) return null;
      return { offerId, qty };
    })
    .filter(Boolean);
}

export function getWishlistOfferIds() {
  const session = getSession();
  if (session?.role === "user") {
    const user = getCurrentUser();
    return normalizeIdList(user?.wishlist);
  }

  return normalizeIdList(read(STORAGE_KEYS.guestWishlist, []));
}

export function isOfferInWishlist(offerId) {
  const id = String(offerId ?? "").trim();
  if (!id) return false;
  return getWishlistOfferIds().includes(id);
}

export function toggleWishlistOffer(offerId) {
  const id = String(offerId ?? "").trim();
  if (!id) return { ok: false };

  const session = getSession();
  if (session?.role === "user") {
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return { ok: false, message: "Пользователь не найден" };

    const current = normalizeIdList(user.wishlist);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];

    const nextUsers = users.map((u) => {
      if (u.id !== user.id) return u;
      return { ...u, wishlist: next, updatedAt: new Date().toISOString() };
    });

    setUsers(nextUsers);
    return { ok: true, inWishlist: next.includes(id) };
  }

  const current = getWishlistOfferIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  write(STORAGE_KEYS.guestWishlist, next);
  return { ok: true, inWishlist: next.includes(id) };
}

export function getCartItems() {
  const session = getSession();
  if (session?.role === "user") {
    const user = getCurrentUser();
    return normalizeCart(user?.cart);
  }

  return normalizeCart(read(STORAGE_KEYS.guestCart, []));
}

export function addOfferToCart(offerId, qty = 1) {
  const id = String(offerId ?? "").trim();
  const addQty = Number(qty);
  if (!id || !Number.isFinite(addQty) || addQty <= 0) return { ok: false };

  const session = getSession();
  if (session?.role === "user") {
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return { ok: false, message: "Пользователь не найден" };

    const current = normalizeCart(user.cart);
    const existing = current.find((i) => i.offerId === id);
    const next = existing
      ? current.map((i) => (i.offerId === id ? { ...i, qty: i.qty + addQty } : i))
      : [{ offerId: id, qty: addQty }, ...current];

    const nextUsers = users.map((u) => {
      if (u.id !== user.id) return u;
      return { ...u, cart: next, updatedAt: new Date().toISOString() };
    });

    setUsers(nextUsers);
    return { ok: true };
  }

  const current = getCartItems();
  const existing = current.find((i) => i.offerId === id);
  const next = existing
    ? current.map((i) => (i.offerId === id ? { ...i, qty: i.qty + addQty } : i))
    : [{ offerId: id, qty: addQty }, ...current];

  write(STORAGE_KEYS.guestCart, next);
  return { ok: true };
}

export function setCartItems(items) {
  const session = getSession();
  const normalized = normalizeCart(items);

  if (session?.role === "user") {
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (!user) return { ok: false, message: "Пользователь не найден" };

    const nextUsers = users.map((u) => {
      if (u.id !== user.id) return u;
      return { ...u, cart: normalized, updatedAt: new Date().toISOString() };
    });
    setUsers(nextUsers);
    return { ok: true };
  }

  write(STORAGE_KEYS.guestCart, normalized);
  return { ok: true };
}

export function updateCartOfferQty(offerId, qty) {
  const id = String(offerId ?? "").trim();
  const nextQty = Number(qty);
  if (!id || !Number.isFinite(nextQty)) return { ok: false };

  if (nextQty <= 0) {
    return removeOfferFromCart(id);
  }

  const current = getCartItems();
  const next = current.some((i) => i.offerId === id)
    ? current.map((i) => (i.offerId === id ? { ...i, qty: nextQty } : i))
    : [{ offerId: id, qty: nextQty }, ...current];

  return setCartItems(next);
}

export function removeOfferFromCart(offerId) {
  const id = String(offerId ?? "").trim();
  if (!id) return { ok: false };
  const current = getCartItems();
  const next = current.filter((i) => i.offerId !== id);
  return setCartItems(next);
}

export function removeOffersFromCart(offerIds) {
  const ids = new Set(normalizeIdList(offerIds));
  const current = getCartItems();
  const next = current.filter((i) => !ids.has(i.offerId));
  return setCartItems(next);
}

export function clearCart() {
  return setCartItems([]);
}

export function migrateGuestWishlistAndCartToUser() {
  const session = getSession();
  if (session?.role !== "user") return { ok: false };

  const guestWishlist = normalizeIdList(read(STORAGE_KEYS.guestWishlist, []));
  const guestCart = normalizeCart(read(STORAGE_KEYS.guestCart, []));
  if (guestWishlist.length === 0 && guestCart.length === 0) return { ok: true };

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const currentWishlist = normalizeIdList(user.wishlist);
  const nextWishlist = Array.from(new Set([...guestWishlist, ...currentWishlist]));

  const currentCart = normalizeCart(user.cart);
  const nextCart = [...currentCart];
  guestCart.forEach((guestItem) => {
    const existing = nextCart.find((i) => i.offerId === guestItem.offerId);
    if (existing) {
      existing.qty += guestItem.qty;
    } else {
      nextCart.push({ ...guestItem });
    }
  });

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return {
      ...u,
      wishlist: nextWishlist,
      cart: nextCart,
      updatedAt: new Date().toISOString(),
    };
  });

  setUsers(nextUsers);
  localStorage.removeItem(STORAGE_KEYS.guestWishlist);
  localStorage.removeItem(STORAGE_KEYS.guestCart);
  return { ok: true };
}

function safeJsonParse(value, fallback) {
  try {
    if (value == null) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function read(key, fallback) {
  return safeJsonParse(localStorage.getItem(key), fallback);
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers() {
  return read(STORAGE_KEYS.users, []);
}

export function setUsers(users) {
  write(STORAGE_KEYS.users, users);
}

export async function addUser({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  if (!trimmedLogin) {
    return { ok: false, message: "Введите логин" };
  }

  if (trimmedPassword.length < 4) {
    return { ok: false, message: "Пароль должен быть минимум 4 символа" };
  }

  const users = getUsers();
  const exists = users.some((u) => u.login.toLowerCase() === trimmedLogin.toLowerCase());
  if (exists) {
    return { ok: false, message: "Пользователь с таким логином уже существует" };
  }

  const passwordHash = await sha256Hex(trimmedPassword);

  const user = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    login: trimmedLogin,
    passwordHash,
    profile: {
      fullName: "",
      phone: "",
      email: "",
    },
    addresses: [],
    wishlist: [],
    cart: [],
    orders: [],
    createdAt: new Date().toISOString(),
  };

  setUsers([...users, user]);
  return { ok: true, user };
}

export function removeUser(userId) {
  const users = getUsers();
  const next = users.filter((u) => u.id !== userId);
  setUsers(next);

  const session = getSession();
  if (session?.role === "user" && session.userId === userId) {
    clearSession();
  }
}

export async function loginUser({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  const users = getUsers();
  const user = users.find((u) => u.login.toLowerCase() === trimmedLogin.toLowerCase());

  if (!user) {
    return { ok: false, message: "Неверный логин или пароль" };
  }

  if (typeof user.passwordHash === "string" && user.passwordHash.length > 0) {
    const passwordHash = await sha256Hex(trimmedPassword);
    if (passwordHash !== user.passwordHash) {
      return { ok: false, message: "Неверный логин или пароль" };
    }
  } else if (typeof user.password === "string") {
    if (user.password !== trimmedPassword) {
      return { ok: false, message: "Неверный логин или пароль" };
    }

    const nextUsers = users.map((u) => {
      if (u.id !== user.id) return u;
      return {
        ...u,
        passwordHash: "",
        password: undefined,
      };
    });

    const migratedHash = await sha256Hex(trimmedPassword);
    const migrated = nextUsers.map((u) => {
      if (u.id !== user.id) return u;
      const { password, ...rest } = u;
      return {
        ...rest,
        passwordHash: migratedHash,
      };
    });

    setUsers(migrated);
  } else {
    return { ok: false, message: "Неверный логин или пароль" };
  }

  const session = createSessionForUser(user);

  write(STORAGE_KEYS.session, session);
  return { ok: true, session };
}

export function createSessionForUser(user) {
  return {
    role: "user",
    userId: user.id,
    login: user.login,
    createdAt: new Date().toISOString(),
  };
}

export function getSession() {
  return read(STORAGE_KEYS.session, null);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

export function getCurrentUser() {
  const session = getSession();
  if (!session || session.role !== "user") return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) ?? null;
}

export function updateCurrentUserProfile({ fullName, phone, email }) {
  const session = getSession();
  if (!session || session.role !== "user") {
    return { ok: false, message: "Нет активной сессии" };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const nextProfile = {
    ...(user.profile ?? {}),
    fullName: String(fullName ?? "").trim(),
    phone: String(phone ?? "").trim(),
    email: String(email ?? "").trim(),
  };

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return {
      ...u,
      profile: nextProfile,
      updatedAt: new Date().toISOString(),
    };
  });

  setUsers(nextUsers);
  return { ok: true };
}

export function getCurrentUserAddresses() {
  const user = getCurrentUser();
  if (!user) return [];
  return Array.isArray(user.addresses) ? user.addresses : [];
}

export function addCurrentUserAddress({ label, city, street, house, apartment, comment }) {
  const session = getSession();
  if (!session || session.role !== "user") {
    return { ok: false, message: "Нет активной сессии" };
  }

  const trimmedCity = String(city ?? "").trim();
  const trimmedStreet = String(street ?? "").trim();
  const trimmedHouse = String(house ?? "").trim();

  if (!trimmedCity || !trimmedStreet || !trimmedHouse) {
    return { ok: false, message: "Заполни город, улицу и дом" };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const current = Array.isArray(user.addresses) ? user.addresses : [];
  const isFirst = current.length === 0;

  const newAddress = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    label: String(label ?? "").trim(),
    city: trimmedCity,
    street: trimmedStreet,
    house: trimmedHouse,
    apartment: String(apartment ?? "").trim(),
    comment: String(comment ?? "").trim(),
    isDefault: isFirst,
    createdAt: new Date().toISOString(),
  };

  const nextAddresses = isFirst
    ? [newAddress]
    : [
        ...current,
        {
          ...newAddress,
          isDefault: false,
        },
      ];

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return {
      ...u,
      addresses: nextAddresses,
      updatedAt: new Date().toISOString(),
    };
  });

  setUsers(nextUsers);
  return { ok: true, address: newAddress };
}

export function removeCurrentUserAddress(addressId) {
  const session = getSession();
  if (!session || session.role !== "user") {
    return { ok: false, message: "Нет активной сессии" };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const current = Array.isArray(user.addresses) ? user.addresses : [];
  const removed = current.find((a) => a.id === addressId);
  const next = current.filter((a) => a.id !== addressId);

  if (removed?.isDefault && next.length > 0) {
    next[0] = { ...next[0], isDefault: true };
  }

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return {
      ...u,
      addresses: next,
      updatedAt: new Date().toISOString(),
    };
  });

  setUsers(nextUsers);
  return { ok: true };
}

export function setCurrentUserDefaultAddress(addressId) {
  const session = getSession();
  if (!session || session.role !== "user") {
    return { ok: false, message: "Нет активной сессии" };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, message: "Пользователь не найден" };

  const current = Array.isArray(user.addresses) ? user.addresses : [];
  if (!current.some((a) => a.id === addressId)) {
    return { ok: false, message: "Адрес не найден" };
  }

  const next = current.map((a) => ({ ...a, isDefault: a.id === addressId }));

  const nextUsers = users.map((u) => {
    if (u.id !== user.id) return u;
    return {
      ...u,
      addresses: next,
      updatedAt: new Date().toISOString(),
    };
  });

  setUsers(nextUsers);
  return { ok: true };
}

export function loginAdmin({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  if (trimmedLogin !== "admin" || trimmedPassword !== "admin") {
    return { ok: false, message: "Неверный логин или пароль" };
  }

  const session = {
    role: "admin",
    userId: "admin",
    login: "admin",
    createdAt: new Date().toISOString(),
  };

  write(STORAGE_KEYS.session, session);
  return { ok: true, session };
}

export function isAdminSession() {
  return getSession()?.role === "admin";
}

export function getProducts() {
  return read(STORAGE_KEYS.products, []);
}

export function setProducts(products) {
  write(STORAGE_KEYS.products, products);
}

export function addProduct({ title, price, image }) {
  const trimmedTitle = String(title ?? "").trim();
  const trimmedPrice = String(price ?? "").trim();
  const trimmedImage = String(image ?? "").trim();

  if (!trimmedTitle) {
    return { ok: false, message: "Введите название" };
  }

  const priceNumber = Number(trimmedPrice.replace(",", "."));
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return { ok: false, message: "Введите корректную цену" };
  }

  const products = getProducts();
  const product = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: trimmedTitle,
    price: priceNumber,
    image: trimmedImage,
    createdAt: new Date().toISOString(),
  };

  setProducts([...products, product]);
  return { ok: true, product };
}

export function removeProduct(productId) {
  const products = getProducts();
  const next = products.filter((p) => p.id !== productId);
  setProducts(next);
}

export function getFaq() {
  return read(STORAGE_KEYS.faq, []);
}

export function setFaq(items) {
  write(STORAGE_KEYS.faq, items);
}

export function addFaqItem({ question, answer }) {
  const trimmedQuestion = String(question ?? "").trim();

  const answerLines = Array.isArray(answer)
    ? answer.map((v) => String(v)).map((v) => v.trim()).filter(Boolean)
    : String(answer ?? "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

  if (!trimmedQuestion) {
    return { ok: false, message: "Введите вопрос" };
  }

  if (answerLines.length === 0) {
    return { ok: false, message: "Введите ответ" };
  }

  const items = getFaq();

  const newItem = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    question: trimmedQuestion,
    answer: answerLines,
    createdAt: new Date().toISOString(),
  };

  setFaq([newItem, ...items]);
  return { ok: true, item: newItem };
}

export function removeFaqItem(itemId) {
  const items = getFaq();
  const next = items.filter((i) => i.id !== itemId);
  setFaq(next);
}
