'use strict';

/**
 * The elipsis constant.
 */

const ELIPSIS = '...';

/**
 * Truncates strings with ending elipsis.
 */
class Truncator {

  /**
   * Truncate the string at the character limit and add an elipsis.
   *
   * @param {String} string - The string to truncate.
   * @param {Integer} limit - The length to limit the string at.
   *
   * @returns {String} The truncated string.
   */
  truncate(string, limit) {
    return string.length > limit ? string.substring(0, limit) + ELIPSIS : string;
  }
}

module.exports = new Truncator();