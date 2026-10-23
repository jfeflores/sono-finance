const ACCOUNT_KEY = "sono-cache-account";

function clearStorage(storage: Storage) {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
  for (const key of keys) {
    if (key && (key.startsWith("sono-") || key === "dash_overview") && key !== "sono-theme") {
      storage.removeItem(key);
    }
  }
}

export function clearAccountData() {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
}

export function prepareAccountData(userId: string | null) {
  if (!userId || sessionStorage.getItem(ACCOUNT_KEY) !== userId) clearAccountData();
  if (userId) sessionStorage.setItem(ACCOUNT_KEY, userId);
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