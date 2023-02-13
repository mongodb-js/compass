import React, { ReactChild } from 'react';
import escapeRegExp from 'lodash/escapeRegExp';

/**
 *
 * Wraps every instance of `wrap` found in `str` in the provided `element`.
 *
 * E.g. `wrapJSX('Apple', 'ap', 'em') => <em>Ap</em>ple`
 *
 * @param str
 * @param wrap
 * @param element
 * @returns `JSX.Element`
 * @internal
 */
export const wrapJSX = (
  str: string,
  wrap?: string,
  element?: keyof HTMLElementTagNameMap
): JSX.Element => {
  if (wrap && element) {
    const cleanWrap = escapeRegExp(wrap);
    const regex = new RegExp(cleanWrap, 'gi');
    const matches = str.matchAll(regex);

    if (matches) {
      const outArray = str.split('') as Array<ReactChild>;

      /**
       * For every match, splice it into the "string",
       * wrapped in the React element
       */
      // Consider adding --downlevelIteration TS flag so we don't need Array.from
      for (const match of Array.from(matches)) {
        const matchIndex = match.index ?? -1;
        const matchContent = match[0];
        const matchLength = matchContent.length;
        const key = matchIndex + matchContent + matchLength;

        // We create a replacement array that's
        // the same length as the match we're deleting,
        // in order to keep the matchIndexes aligned
        // with the indexes of the output array
        const replacement = new Array<ReactChild>(matchLength).fill('');
        replacement[0] = React.createElement(element, { key }, matchContent);

        outArray.splice(matchIndex, matchLength, ...replacement);
      }

      return <>{outArray}</>;
    }

    return <>{str}</>;
  }

  return <>{str}</>;
};
