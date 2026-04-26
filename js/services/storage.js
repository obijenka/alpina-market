const STORAGE_KEYS = {
  users: "alpina_users_v1",
  session: "alpina_session_v1",
  products: "alpina_products_v1",
  faq: "alpina_faq_v1",
};

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
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
