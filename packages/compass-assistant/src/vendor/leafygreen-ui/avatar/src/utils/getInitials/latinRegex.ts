// https://en.wikipedia.org/wiki/List_of_Unicode_characters
export const latinBasicRegex = /[a-zA-Z]/;
export const latinSupplementRegex =
  /[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF/]/;
export const latinExtendedARegex = /[\u0100-\u0148\u014A-\u017F]/;

/**
 * Supported Latin characters
 *
 * Includes the English alphabet
 * and common European letters with accents/diacritics
 */
export const supportedLatinRegex = new RegExp(
  [
    latinBasicRegex.source,
    latinSupplementRegex.source,
    latinExtendedARegex.source,
  ].join('|')
);
