export function initScrollRestoration({
  storageKey,
  behavior = "instant",
  getScrollTarget,
} = {}) {
  if (!storageKey) return;

  const resolveTarget = () => {
    if (typeof getScrollTarget === "function") {
      const t = getScrollTarget();
      if (t && typeof t === "object") return t;
    }
    return window;
  };

  const save = () => {
    const target = resolveTarget();
    const y = target === window ? window.scrollY || 0 : target.scrollTop || 0;
    try {
      sessionStorage.setItem(storageKey, String(y));
    } catch {
      // ignore
    }
  };

  const restore = () => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(storageKey) ?? "";
    } catch {
      saved = "";
    }

    const y = Number(saved);
    if (!Number.isFinite(y) || y <= 0) return;

    requestAnimationFrame(() => {
      const target = resolveTarget();
      if (target === window) {
        window.scrollTo({ top: y, left: 0, behavior });
      } else {
        target.scrollTo({ top: y, left: 0, behavior });
      }
    });
  };

  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    // ignore
  }

  window.addEventListener("pagehide", save);

  return {
    save,
    restore,
    cleanup() {
      window.removeEventListener("pagehide", save);
    },
  };
}
