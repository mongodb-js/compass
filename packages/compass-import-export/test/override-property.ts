// Shadows a property with an own property for the duration of a test. Works
// whether the property is missing (jsdom), inherited (Electron's
// navigator.storage lives on Navigator.prototype) or an own property.
// sinon 9 can't stub properties that don't exist.
export function overrideProperty(
  target: object,
  name: string,
  value: unknown
): () => void {
  const original = Object.getOwnPropertyDescriptor(target, name);
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value,
  });
  return () => {
    if (original) {
      Object.defineProperty(target, name, original);
    } else {
      delete (target as Record<string, unknown>)[name];
    }
  };
}
