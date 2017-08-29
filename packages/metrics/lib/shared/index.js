var _ = require('lodash');

/**
 * Helper function for `sentenceCase`
 *
 * @param  {String} s   camel cased string
 * @return {[type]}     sentence cased version of the string
 */
function camelToSentence(s) {
  return s.replace(/\.?([A-Z]+)/g, function(x, y) {
    return ' ' + y.toLowerCase();
  }).replace('_', ' ');
}

/**
 * Turns `camelCase` strings and object keys into `sentence case`.
 *
 * @param  {String} s  string to be converted
 * @return {String}    result
 */
function sentenceCase(s) {
  if (_.isPlainObject(s)) {
    return _.mapKeys(s, function(value, key) {
      return camelToSentence(key);
    });
  }
  return camelToSentence(s);
}

/**
 * Turns strings and object keys into `snake_case`.
 *
 * @param  {String} s  string to be converted
 * @return {String}    result
 */
function snakeCase(s) {
  if (_.isPlainObject(s)) {
    return _.mapKeys(s, function(value, key) {
      return _.snakeCase(key);
    });
  }
  return _.snakeCase(s);
}

module.exports = {
  sentenceCase: sentenceCase,
  snakeCase: snakeCase
};
