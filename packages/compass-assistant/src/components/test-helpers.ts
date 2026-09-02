/**
 * Text matcher for text that is broken up by nested elements, e.g.
 * `<>text <tag>more text</tag></>`, which the default string matcher
 * (own text nodes only) can't match.
 */
export function containsText(match: string) {
  return (_: unknown, element: Element | null): boolean => {
    const firstChild = element?.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      // only check elements that start with text so we don't match on nested elements
      return element?.textContent === match;
    }

    return false;
  };
}
