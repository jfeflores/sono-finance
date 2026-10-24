const ACCOUNT_KEY = "sono-cache-account";
const DATA_PREFIX = "sono-data:v1:";
let activeOwner: string | null = null;
let generation = 0;
const controllers = new Set<AbortController>();

function prefix(owner: string) { return `${DATA_PREFIX}${encodeURIComponent(owner)}:`; }
function invalidateWork() {
  generation++;
  controllers.forEach(controller => controller.abort());
  controllers.clear();
}
function clearOwner(owner: string | null) {
  if (!owner) return;
  for (const storage of [localStorage, sessionStorage]) {
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
    for (const key of keys) if (key?.startsWith(prefix(owner))) storage.removeItem(key);
  }
}

/** Raw legacy keys have no verified owner and are deliberately never read or deleted. */
function scopedStorage(storage: () => Storage) {
  return {
    getItem(key: string) {
      if (key === "sono-theme") return localStorage.getItem(key);
      return activeOwner ? storage().getItem(prefix(activeOwner) + key) : null;
    },
    setItem(key: string, value: string) {
      if (key === "sono-theme") { localStorage.setItem(key, value); return; }
      if (activeOwner) storage().setItem(prefix(activeOwner) + key, value);
    },
    removeItem(key: string) {
      if (key === "sono-theme") { localStorage.removeItem(key); return; }
      if (activeOwner) storage().removeItem(prefix(activeOwner) + key);
    },
  };
}
export const accountLocalStorage = scopedStorage(() => localStorage);
export const accountSessionStorage = scopedStorage(() => sessionStorage);

export function captureAccountScope() {
  const userId = activeOwner;
  const epoch = generation;
  return { userId, isCurrent: () => !!userId && activeOwner === userId && generation === epoch };
}

export function createAccountWork() {
  const scope = captureAccountScope();
  const controller = new AbortController();
  if (scope.isCurrent()) controllers.add(controller);
  else controller.abort();
  const isCurrent = () => scope.isCurrent() && !controller.signal.aborted;
  const finish = () => controllers.delete(controller);
  return {
    userId: scope.userId, signal: controller.signal, isCurrent,
    assertCurrent() { if (!isCurrent()) throw new DOMException("Account changed", "AbortError"); },
    cancel() { controller.abort(); finish(); },
    finish,
  };
}

export function clearAccountData() {
  invalidateWork();
  clearOwner(activeOwner ?? sessionStorage.getItem(ACCOUNT_KEY));
}

export function prepareAccountData(userId: string | null) {
  if (userId !== activeOwner) {
    invalidateWork();
    const previous = activeOwner ?? sessionStorage.getItem(ACCOUNT_KEY);
    if (previous !== userId) clearOwner(previous);
    activeOwner = userId;
  }
  if (userId) sessionStorage.setItem(ACCOUNT_KEY, userId);
  else sessionStorage.removeItem(ACCOUNT_KEY);
}

export function publicShareUrl(origin: string) {
  return new URL("/", origin).href;
}

export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}