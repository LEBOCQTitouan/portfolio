import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// Node 26 exposes an undefined experimental localStorage; patch it with a
// real in-memory store so tests that call window.localStorage work correctly.
if (typeof window !== "undefined" && !window.localStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    },
    writable: true,
  });
}

/** Controllable matchMedia mock. Default: desktop = true, reduced-motion = false. */
type MqState = { matches: boolean };
const mqRegistry = new Map<string, MqState>();

export function setMatchMedia(query: string, matches: boolean) {
  mqRegistry.set(query, { matches });
}

window.matchMedia = ((query: string) => {
  const state = mqRegistry.get(query) ?? {
    matches: query.includes("min-width"), // desktop true by default, reduced false
  };
  return {
    get matches() {
      return state.matches;
    },
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}) as typeof window.matchMedia;

/** Manually-driveable IntersectionObserver mock. */
export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  callback: IntersectionObserverCallback;
  elements: Element[] = [];

  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.elements.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Test helper: fire the callback with given entries. */
  trigger(entries: Array<Partial<IntersectionObserverEntry>>) {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

beforeEach(() => {
  mqRegistry.clear();
  MockIntersectionObserver.instances = [];
});
