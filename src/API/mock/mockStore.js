/**
 * Tiny localStorage-backed store for UI prototypes that run before their backend exists.
 * Falls back to memory when storage is unavailable.
 */
export function createMockStore(storageKey, buildSeed) {
  let state = null;

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode etc.) — keep working in memory.
    }
  };

  const get = () => {
    if (state) return state;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) state = JSON.parse(raw);
    } catch {
      state = null;
    }
    if (!state) {
      state = buildSeed();
      save();
    }
    return state;
  };

  return { get, save };
}

let idSequence = 0;

/** Unique id even when several records are created in the same millisecond. */
export const mockId = (prefix) => {
  idSequence += 1;
  return `${prefix}-${Date.now().toString(36)}${idSequence.toString(36)}`;
};

/** Simulated network latency, then run the handler. */
export async function runMock(handler, payload, ms = 280) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return handler(payload);
}

/** Mirrors the axios error shape the app reads (`err.response.data.message`). */
export function mockApiError(message) {
  const error = new Error(message);
  error.response = { data: { message } };
  return error;
}
