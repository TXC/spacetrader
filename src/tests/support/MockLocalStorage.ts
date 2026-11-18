import type { GameStorage } from '../../game/storage.ts';

// A stand-in for the browser's storage that a test can look into.
export class MockLocalStorage implements GameStorage {
  dict: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.dict[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.dict[key] = value;
  }
}
