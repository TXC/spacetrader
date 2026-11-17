// Something the screens watch. Rules change the game in place, then call changed().
export class Store {
  version = 0;
  private listeners = new Set<() => void>();

  // The UI replaces this so a change is on the page before changed() returns.
  static flush: (run: () => void) => void = run => run();

  // An arrow function, so it can be handed to React as it is.
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  changed(): void {
    this.version++;
    Store.flush(() => this.listeners.forEach(listener => listener()));
  }
}
