/**
 * Takes in an identifier that may or may not be a string and returns a string
 * with double quotes. Replace any non-escaped double quotes with \"
 * @param {String} str
 * @returns {String}
 */
const doubleQuoteStringify = function(str) {
  let newStr = str.toString();

  if (
    (
      newStr.charAt(0) === '\'' && newStr.charAt(newStr.length - 1) === '\''
    ) ||
    (newStr.charAt(0) === '"' && newStr.charAt(newStr.length - 1) === '"')
  ) {
    newStr = newStr.substr(1, newStr.length - 2);
  }

  return `"${newStr.replace(/\\([\s\S])|(")/g, '\\$1$2')}"`;
};

/**
 * Takes in an identifier that may or may not be a string and returns a string
 * with single quotes. Replace any non-escaped single quotes with \"
 * @param {String} str
 * @returns {String}
 */
const singleQuoteStringify = function(str) {
  let newStr = str.toString();

  if (
    (
      newStr.charAt(0) === '\'' && newStr.charAt(newStr.length - 1) === '\''
    ) ||
    (newStr.charAt(0) === '"' && newStr.charAt(newStr.length - 1) === '"')
  ) {
    newStr = str.substr(1, newStr.length - 2);
  }

  return `'${newStr.replace(/\\([\s\S])|(')/g, '\\$1$2')}'`;
};

/**
 * Remove quotes from string
 *
 * @param {String} str
 * @returns {String}
 */
const removeQuotes = function(str) {
  let newStr = str.toString();

  if (
    (newStr.charAt(0) === '"' && newStr.charAt(newStr.length - 1) === '"') ||
    (newStr.charAt(0) === '\'' && newStr.charAt(newStr.length - 1) === '\'')
  ) {
    newStr = newStr.substr(1, newStr.length - 2);
  }

  return newStr;
};

module.exports = {
  doubleQuoteStringify,
  singleQuoteStringify,
  removeQuotes
};
