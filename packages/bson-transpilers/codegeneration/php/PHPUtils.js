/**
 * Common functions to use in PHP templates
 *
 * @returns {object}
 */
class PHPUtils {
  constructor() {
  }

  /**
   * Removing Object casting of PHP variable
   * @param {string} str - String with PHP representation of variable
   * @returns {string} - Parsed string
   */
  removePHPObject(str) {
    if (str.indexOf('(object) ') === 0) {
      str = str.slice(9);
    }
    return str;
  };

  /**
   * Removing surrounding quotes of PHP string variable content
   * @param {string} str - PHP representation of string with or without quotes to remove
   * @returns {string} - Parsed string
   */
  removeStringQuotes(str) {
    if (
        (str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'') ||
        (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"')
    ) {
      str = str.substr(1, str.length - 2);
    }
    return str;
  };

  stringify(str) {
    str = this.removeStringQuotes(str);
    return `${str.replace(/\\([\s\S])/g, '\\$1')}`;
  };

  stringifyWithSingleQuotes(str) {
    str = this.removeStringQuotes(str);
    return `'${str.replace(/\\([\s\S])|(')/g, '\\$1$2')}'`;
  };

  stringifyWithDoubleQuotes(str) {
    str = this.removeStringQuotes(str);
    return `"${str.replace(/\\([\s\S])|(")/g, '\\$1$2')}"`;
  };
}

module.exports = PHPUtils;
