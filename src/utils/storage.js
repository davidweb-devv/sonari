// Safe localStorage helpers.
// Reads never throw (corrupted JSON, blocked storage, private mode), and
// writes fail quietly instead of crashing the page.

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full. The app still works, it just won't remember.
  }
}
