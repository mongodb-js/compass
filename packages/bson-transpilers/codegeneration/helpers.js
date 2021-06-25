/**
 * Takes in an identifier that may or may not be a string and returns a string
 * with double quotes. Replace any non-escaped double quotes with \"
 * @param {String} str
 * @returns {String}
 */
const doubleQuoteStringify = function(str) {
  let newStr = str;
  if (
    (str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'') ||
    (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"')) {
    newStr = str.substr(1, str.length - 2);
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
  let newStr = str;
  if (
    (str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'') ||
    (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"')) {
    newStr = str.substr(1, str.length - 2);
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
  let newStr = str;

  if (
    (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"') ||
    (str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'')
  ) {
    newStr = str.substr(1, str.length - 2);
  }
  return newStr;
};


module.exports = {
  doubleQuoteStringify,
  singleQuoteStringify,
  removeQuotes
};
