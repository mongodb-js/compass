/**
 * Common functions to use in PHP templates
 *
 * @returns {object}
 */
class PHPUtils {
  constructor() {
  }

  /**
   * Common string checker to be sure we work with string
   * @param {string|undefined} str - input variable
   * @returns {string} - Parsed string
   */
  convertToString(str) {
    if (str === undefined) {
      return '';
    }
    return str;
  }

  /**
   * Removing Object casting of PHP variable
   * @param {string|undefined} str - String with PHP representation of variable
   * @returns {string} - Parsed string
   */
  toPHPArray(str) {
    str = this.convertToString(str);
    if (str.length > 0 && str.charAt(0) !== '[') {
      str = `[${str}]`;
    }
    return str;
  }

  /**
   * Removing Object casting of PHP variable
   * @param {string|undefined} str - String with PHP representation of variable
   * @returns {string} - Parsed string
   */
  removePHPObject(str) {
    str = this.convertToString(str);
    if (str.indexOf('(object) ') === 0) {
      str = str.slice(9);
    }
    return str;
  }

  /**
   * Removing surrounding quotes of PHP string variable content
   * @param {string|undefined} str - PHP representation of string with or without quotes to remove
   * @returns {string} - Parsed string
   */
  removeStringQuotes(str) {
    str = this.convertToString(str);
    if (
      (str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'') ||
      (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"')
    ) {
      str = str.substr(1, str.length - 2);
    }
    return str;
  }

  /**
   * @param {string|undefined} str
   * @returns {string} - Parsed string
   */
  stringify(str) {
    str = this.removeStringQuotes(str);
    return `${str.replace(/\\([\s\S])/g, '\\$1')}`;
  }

  /**
   * This function is duplicated in the "StringTypeTemplate" and "RegexTypeTemplate".
   * @param {string|undefined} str
   * @returns {string} - Parsed string
   */
  stringifyWithSingleQuotes(str) {
    str = this.removeStringQuotes(str);
    return `'${str.replace(/\\([\s\S])|(')/g, '\\$1$2')}'`;
  }

  /**
   * @param {string|undefined} str
   * @returns {string} - Parsed string
   */
  stringifyWithDoubleQuotes(str) {
    str = this.removeStringQuotes(str);
    return `"${str.replace(/\\([\s\S])|(")/g, '\\$1$2')}"`;
  }
}

module.exports = PHPUtils;
