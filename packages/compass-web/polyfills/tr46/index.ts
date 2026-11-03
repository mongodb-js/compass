/**
 * This is a dependency of whatwg-url package, we can't fully replace it with
 * the globalThis.URL due to subtle differences in packages behavior, but we can
 * substitue one of the biggest chunks of the package (tr46) with a browser
 * implementation.
 */
export function toASCII(domain: string) {
  try {
    // globalThis, not window: utilities run as Web Workers, where `window`
    // doesn't exist and this would fail every domain parse
    return new globalThis.URL(`http://${domain}`).hostname;
  } catch {
    return null;
  }
}

export function toUnicode() {
  throw new Error('Not implemented');
}
