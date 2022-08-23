/* eslint-disable filename-rules/match */

/**
 * Helper function to check whether a DOM element's content is clipped, ie:
 * The element's content is too big to fit in its block formatting context,
 * or the position of the content is positioned in such a way that it intersects
 * with the element's block formatting context, thus causing it to overflow.
 *
 * @param element the element to check
 * @returns boolean true if the element is overflowing, false if not.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
 */
export default function isElementOverflowed(element: HTMLElement): boolean {
  return (
    (element && element.scrollHeight > element.clientHeight) ||
    (element && element.scrollWidth > element.clientWidth)
  );
}
