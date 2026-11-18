// The only code that reads and writes the browser's storage. Neither function throws:
// storage can be full, switched off, or hold something that is not JSON.

// The part of the browser's storage the game uses.
export type GameStorage = Pick<Storage, 'getItem' | 'setItem'>;

// The value stored under `key`, or undefined when there is none or it cannot be read.
export function readJson(storage: GameStorage, key: string): unknown {
  try {
    const stored = storage.getItem(key);
    return stored === null ? undefined : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

// Stores `value` under `key`. Says whether that worked.
export function writeJson(storage: GameStorage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// A storage that lasts as long as the page, for when the browser offers none.
export function memoryStorage(): GameStorage {
  const kept = new Map<string, string>();
  return {
    getItem: key => kept.get(key) ?? null,
    setItem: (key, value) => void kept.set(key, value),
  };
}

// The browser's storage if it can be used, or one in memory if it is blocked.
export function browserStorage(): GameStorage {
  try {
    window.localStorage.getItem('games');
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}
